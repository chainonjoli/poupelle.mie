/* 推し活レーダーOS API (Cloudflare Workers + D1)
   Phase 2a: データ基盤のみ。自動収集(scheduledハンドラ)は Phase 2b で追加する。

   設計上の要点:
   - レスポンスは Phase 1 の localStorage JSON と同じ形(camelCase)。フロントの
     logic.js / app.js を無改修で使い回すため。
   - 上書き優先順位: user > collector_L1 > collector_L2 > collector_L3。
     ユーザーが手動編集したフィールドは events.manual_fields に記録され、
     将来の収集エンジンはそこを上書きできない(applyEventUpdateを共用する)。
   - イベントは identity_key(norm名×norm会場×開始日×norm主催者)で一意。
   - フィールド変更はすべて event_change_logs に記録する。 */

const USER_ID = 'u_main';

/* 収集エンジン(2b)もこのランクで書き込む。数値が大きいほど強い */
const SOURCE_RANK = { user: 4, migration: 4, collector_L1: 3, collector_L2: 2, collector_L3: 1 };

/* ---------- ユーティリティ ---------- */

function nowIso() { return new Date().toISOString(); }

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, extraHeaders || {})
  });
}

/* 誤認防止の正規化: 全角英数→半角、小文字化、空白と主な記号を除去 */
function norm(s) {
  return String(s || '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
    .toLowerCase()
    .replace(/[\s　・×✕x\-–—〜~!！?？'"''""()（）\[\]【】]/g, '');
}

function identityKey(ev) {
  return [norm(ev.name), norm(ev.venue), ev.startDate || '', norm(ev.organizer)].join('|');
}

/* ---------- 行 <-> Phase1 JSON 変換 ---------- */

function rowToEvent(row, sources, links) {
  return {
    id: row.id,
    name: row.name,
    organizer: row.organizer,
    category: row.category,
    oshiLinks: links.map(function (l) { return { oshiId: l.oshi_id, matchType: l.match_type }; }),
    prefecture: row.prefecture,
    city: row.city,
    venue: row.venue,
    area: row.area,
    startDate: row.start_date,
    endDate: row.end_date,
    openTime: row.open_time,
    closeTime: row.close_time,
    lastEntry: row.last_entry,
    fee: row.fee,
    needsReservation: !!row.needs_reservation,
    needsNumberedTicket: !!row.needs_numbered_ticket,
    sameDayTicket: !!row.same_day_ticket,
    freeEntry: !!row.free_entry,
    freeEntryFrom: row.free_entry_from,
    officialUrl: row.official_url,
    status: row.status,
    notes: row.notes,
    verification: row.verification,
    manualFields: JSON.parse(row.manual_fields || '[]'),
    sources: sources.map(function (s) {
      return { url: s.url, name: s.name, official: !!s.official, sourceLevel: s.source_level, fetchedAt: s.fetched_at, verifiedAt: s.verified_at };
    }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVerifiedAt: row.last_verified_at
  };
}

function rowToOshi(row, keywords) {
  return {
    id: row.id,
    name: row.name,
    group: row.group_name,
    category: row.category,
    priority: row.priority,
    notify: !!row.notify,
    keywords: keywords.filter(function (k) { return k.kind === 'related'; }).map(function (k) { return k.keyword; }),
    excludeKeywords: keywords.filter(function (k) { return k.kind === 'exclude'; }).map(function (k) { return k.keyword; }),
    createdAt: row.created_at
  };
}

/* イベントのスカラー項目: [APIフィールド名, DBカラム名, 型] */
const EVENT_FIELDS = [
  ['name', 'name', 's'], ['organizer', 'organizer', 's'], ['category', 'category', 's'],
  ['prefecture', 'prefecture', 's'], ['city', 'city', 's'], ['venue', 'venue', 's'], ['area', 'area', 's'],
  ['startDate', 'start_date', 's'], ['endDate', 'end_date', 's'],
  ['openTime', 'open_time', 's'], ['closeTime', 'close_time', 's'], ['lastEntry', 'last_entry', 's'],
  ['fee', 'fee', 's'],
  ['needsReservation', 'needs_reservation', 'b'], ['needsNumberedTicket', 'needs_numbered_ticket', 'b'],
  ['sameDayTicket', 'same_day_ticket', 'b'], ['freeEntry', 'free_entry', 'b'],
  ['freeEntryFrom', 'free_entry_from', 's'], ['officialUrl', 'official_url', 's'],
  ['status', 'status', 's'], ['notes', 'notes', 's']
];

function fieldValue(ev, apiName, type) {
  var v = ev[apiName];
  if (type === 'b') return v ? 1 : 0;
  return String(v == null ? '' : v);
}

function verificationOf(sources) {
  var official = (sources || []).some(function (s) {
    return s.official || s.sourceLevel === 'L1' || s.sourceLevel === 'L2';
  });
  return official ? 'verified' : 'unverified';
}

/* ---------- イベント upsert（ユーザー編集と将来の収集エンジンが共用） ----------
   changeSource: 'user' | 'migration' | 'collector_L1' | 'collector_L2' | 'collector_L3' */
async function applyEventUpdate(db, incoming, changeSource) {
  var now = nowIso();
  var key = identityKey(incoming);

  /* identity重複チェック(自分以外に同キーがあれば拒否) */
  var dup = await db.prepare(
    'SELECT id, name, venue, start_date FROM events WHERE user_id = ? AND identity_key = ? AND id != ?'
  ).bind(USER_ID, key, incoming.id || '').first();
  if (dup) {
    return { conflict: { id: dup.id, name: dup.name, venue: dup.venue, startDate: dup.start_date } };
  }

  var existing = incoming.id
    ? await db.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').bind(incoming.id, USER_ID).first()
    : null;

  var sources = (incoming.sources || []).map(function (s) {
    return {
      url: String(s.url || ''), name: String(s.name || ''),
      official: s.official ? 1 : 0,
      source_level: s.sourceLevel || (s.official ? 'L1' : 'L3'),
      fetched_at: s.fetchedAt || now, verified_at: s.verifiedAt || ''
    };
  });
  var verification = verificationOf(incoming.sources || []);
  var stmts = [];
  var changes = [];

  if (!existing) {
    var id = incoming.id || ('ev_' + now.replace(/\D/g, '').slice(0, 14) + '_' + Math.random().toString(36).slice(2, 8));
    var cols = ['id', 'user_id', 'identity_key', 'verification', 'manual_fields', 'created_by',
      'created_at', 'updated_at', 'last_verified_at'];
    var vals = [id, USER_ID, key, verification,
      JSON.stringify(changeSource === 'user' ? EVENT_FIELDS.map(function (f) { return f[0]; }) : []),
      changeSource === 'user' ? 'user' : changeSource,
      now, now, incoming.lastVerifiedAt || ''];
    EVENT_FIELDS.forEach(function (f) { cols.push(f[1]); vals.push(fieldValue(incoming, f[0], f[2])); });
    stmts.push(db.prepare(
      'INSERT INTO events (' + cols.join(',') + ') VALUES (' + cols.map(function () { return '?'; }).join(',') + ')'
    ).bind(...vals));
    changes.push({ field: '(created)', oldValue: '', newValue: incoming.name || '' });
    incoming.id = id;
  } else {
    var manual = JSON.parse(existing.manual_fields || '[]');
    var sets = [], vals2 = [];
    EVENT_FIELDS.forEach(function (f) {
      var apiName = f[0], col = f[1], type = f[2];
      var newVal = fieldValue(incoming, apiName, type);
      var oldVal = type === 'b' ? (existing[col] ? 1 : 0) : String(existing[col] == null ? '' : existing[col]);
      if (String(newVal) === String(oldVal)) return;
      /* 上書き優先順位: 収集エンジンは手動編集済みフィールドを触れない。
         L3(未確認ソース)は空欄を埋めることしかできない */
      if (changeSource !== 'user' && changeSource !== 'migration') {
        if (manual.indexOf(apiName) >= 0) return;
        if (changeSource === 'collector_L3' && String(oldVal) !== '' && oldVal !== 0) return;
      }
      sets.push(col + ' = ?'); vals2.push(newVal);
      changes.push({ field: apiName, oldValue: String(oldVal), newValue: String(newVal) });
      if (changeSource === 'user' && manual.indexOf(apiName) < 0) manual.push(apiName);
    });
    sets.push('identity_key = ?'); vals2.push(key);
    sets.push('verification = ?'); vals2.push(verification);
    sets.push('manual_fields = ?'); vals2.push(JSON.stringify(manual));
    sets.push('updated_at = ?'); vals2.push(now);
    if (incoming.lastVerifiedAt && incoming.lastVerifiedAt !== existing.last_verified_at) {
      sets.push('last_verified_at = ?'); vals2.push(incoming.lastVerifiedAt);
      changes.push({ field: 'lastVerifiedAt', oldValue: existing.last_verified_at || '', newValue: incoming.lastVerifiedAt });
    }
    vals2.push(incoming.id, USER_ID);
    stmts.push(db.prepare('UPDATE events SET ' + sets.join(', ') + ' WHERE id = ? AND user_id = ?').bind(...vals2));
  }

  /* ソースと推しリンクは全置換（ユーザー編集は完全なセットを送ってくる想定） */
  stmts.push(db.prepare('DELETE FROM event_sources WHERE event_id = ?').bind(incoming.id));
  sources.forEach(function (s) {
    stmts.push(db.prepare(
      'INSERT INTO event_sources (event_id, url, name, official, source_level, fetched_at, verified_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(incoming.id, s.url, s.name, s.official, s.source_level, s.fetched_at, s.verified_at));
  });
  stmts.push(db.prepare('DELETE FROM event_oshi_links WHERE event_id = ?').bind(incoming.id));
  (incoming.oshiLinks || []).forEach(function (l) {
    stmts.push(db.prepare(
      'INSERT OR IGNORE INTO event_oshi_links (event_id, oshi_id, match_type) VALUES (?,?,?)'
    ).bind(incoming.id, l.oshiId, l.matchType || '関連作品'));
  });
  changes.forEach(function (c) {
    stmts.push(db.prepare(
      'INSERT INTO event_change_logs (event_id, field, old_value, new_value, change_source, changed_at) VALUES (?,?,?,?,?,?)'
    ).bind(incoming.id, c.field, c.oldValue.slice(0, 500), c.newValue.slice(0, 500), changeSource, now));
  });

  await db.batch(stmts);
  return { id: incoming.id, changes: changes.length };
}

/* ---------- 読み出し ---------- */

async function loadState(db) {
  var res = await db.batch([
    db.prepare('SELECT * FROM oshi WHERE user_id = ? ORDER BY priority, created_at').bind(USER_ID),
    db.prepare('SELECT k.* FROM oshi_keywords k JOIN oshi o ON o.id = k.oshi_id WHERE o.user_id = ?').bind(USER_ID),
    db.prepare('SELECT * FROM events WHERE user_id = ?').bind(USER_ID),
    db.prepare('SELECT s.* FROM event_sources s JOIN events e ON e.id = s.event_id WHERE e.user_id = ?').bind(USER_ID),
    db.prepare('SELECT l.* FROM event_oshi_links l JOIN events e ON e.id = l.event_id WHERE e.user_id = ?').bind(USER_ID),
    db.prepare('SELECT * FROM schedules WHERE user_id = ? ORDER BY date').bind(USER_ID),
    db.prepare('SELECT i.* FROM schedule_items i JOIN schedules s ON s.id = i.schedule_id WHERE s.user_id = ? ORDER BY i.time').bind(USER_ID),
    db.prepare('SELECT * FROM settings WHERE user_id = ?').bind(USER_ID)
  ]);
  var kw = res[1].results, srcs = res[3].results, links = res[4].results, items = res[6].results;
  var st = res[7].results[0] || {};
  return {
    version: 1,
    settings: {
      homeArea: st.home_area || '津',
      searchRangeMin: st.search_range_min || 30,
      defaultStayMin: st.default_stay_min || 30
    },
    oshi: res[0].results.map(function (o) {
      return rowToOshi(o, kw.filter(function (k) { return k.oshi_id === o.id; }));
    }),
    events: res[2].results.map(function (e) {
      return rowToEvent(e,
        srcs.filter(function (s) { return s.event_id === e.id; }),
        links.filter(function (l) { return l.event_id === e.id; }));
    }),
    schedules: res[5].results.map(function (s) {
      return {
        id: s.id, date: s.date,
        items: items.filter(function (i) { return i.schedule_id === s.id; })
          .map(function (i) { return { time: i.time, endTime: i.end_time, title: i.title, area: i.area }; })
      };
    })
  };
}

/* ---------- 個別upsert ---------- */

async function upsertOshi(db, o) {
  var now = nowIso();
  var id = o.id || ('oshi_' + now.replace(/\D/g, '').slice(0, 14) + '_' + Math.random().toString(36).slice(2, 8));
  var stmts = [
    db.prepare(
      'INSERT INTO oshi (id, user_id, name, group_name, category, priority, notify, created_at, updated_at) ' +
      'VALUES (?,?,?,?,?,?,?,?,?) ' +
      'ON CONFLICT(id) DO UPDATE SET name=excluded.name, group_name=excluded.group_name, ' +
      'category=excluded.category, priority=excluded.priority, notify=excluded.notify, updated_at=excluded.updated_at'
    ).bind(id, USER_ID, String(o.name || ''), String(o.group || ''), String(o.category || ''),
      +o.priority || 2, o.notify ? 1 : 0, o.createdAt || now, now),
    db.prepare('DELETE FROM oshi_keywords WHERE oshi_id = ?').bind(id)
  ];
  (o.keywords || []).forEach(function (k) {
    stmts.push(db.prepare('INSERT INTO oshi_keywords (oshi_id, keyword, kind) VALUES (?,?,?)').bind(id, k, 'related'));
  });
  (o.excludeKeywords || []).forEach(function (k) {
    stmts.push(db.prepare('INSERT INTO oshi_keywords (oshi_id, keyword, kind) VALUES (?,?,?)').bind(id, k, 'exclude'));
  });
  await db.batch(stmts);
  return id;
}

async function upsertSchedule(db, sc) {
  var now = nowIso();
  var id = sc.id || ('sc_' + now.replace(/\D/g, '').slice(0, 14) + '_' + Math.random().toString(36).slice(2, 8));
  var stmts = [
    db.prepare(
      'INSERT INTO schedules (id, user_id, date) VALUES (?,?,?) ' +
      'ON CONFLICT(id) DO UPDATE SET date=excluded.date'
    ).bind(id, USER_ID, String(sc.date || '')),
    db.prepare('DELETE FROM schedule_items WHERE schedule_id = ?').bind(id)
  ];
  (sc.items || []).forEach(function (i) {
    stmts.push(db.prepare(
      'INSERT INTO schedule_items (schedule_id, time, end_time, title, area) VALUES (?,?,?,?,?)'
    ).bind(id, String(i.time || ''), String(i.endTime || ''), String(i.title || ''), String(i.area || '')));
  });
  await db.batch(stmts);
  return id;
}

/* ---------- CORS ---------- */

function corsHeaders(request) {
  var origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

/* ---------- ルーティング ---------- */

export default {
  async fetch(request, env) {
    var cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    var url = new URL(request.url);
    var path = url.pathname;

    function reply(data, status) { return json(data, status, cors); }

    if (path === '/api/health') {
      return reply({ ok: true, service: 'oshi-radar-api', phase: '2a', time: nowIso() });
    }

    /* 認証（health以外すべて） */
    var auth = request.headers.get('Authorization') || '';
    var token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!env.API_TOKEN || token !== env.API_TOKEN) {
      return reply({ error: 'unauthorized' }, 401);
    }

    var db = env.DB;
    try {
      /* --- 状態一括取得 / バックアップ --- */
      if (path === '/api/state' && request.method === 'GET') {
        return reply(await loadState(db));
      }
      if (path === '/api/export' && request.method === 'GET') {
        return reply(await loadState(db));
      }

      /* --- 推し --- */
      if (path === '/api/oshi' && request.method === 'POST') {
        var o = await request.json();
        if (!o.name) return reply({ error: 'name required' }, 400);
        return reply({ id: await upsertOshi(db, o) });
      }
      var m = path.match(/^\/api\/oshi\/([\w-]+)$/);
      if (m && request.method === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM event_oshi_links WHERE oshi_id = ?').bind(m[1]),
          db.prepare('DELETE FROM oshi_keywords WHERE oshi_id = ?').bind(m[1]),
          db.prepare('DELETE FROM oshi WHERE id = ? AND user_id = ?').bind(m[1], USER_ID)
        ]);
        return reply({ ok: true });
      }

      /* --- イベント --- */
      if (path === '/api/events' && request.method === 'POST') {
        var ev = await request.json();
        if (!ev.name || !ev.venue || !ev.startDate) return reply({ error: 'name, venue, startDate required' }, 400);
        var r = await applyEventUpdate(db, ev, 'user');
        if (r.conflict) return reply({ error: 'duplicate', existing: r.conflict }, 409);
        return reply(r);
      }
      m = path.match(/^\/api\/events\/([\w-]+)$/);
      if (m && request.method === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM event_sources WHERE event_id = ?').bind(m[1]),
          db.prepare('DELETE FROM event_oshi_links WHERE event_id = ?').bind(m[1]),
          db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').bind(m[1], USER_ID)
        ]);
        return reply({ ok: true });
      }
      m = path.match(/^\/api\/events\/([\w-]+)\/changes$/);
      if (m && request.method === 'GET') {
        var logs = await db.prepare(
          'SELECT field, old_value, new_value, change_source, changed_at FROM event_change_logs WHERE event_id = ? ORDER BY changed_at DESC LIMIT 100'
        ).bind(m[1]).all();
        return reply({ changes: logs.results });
      }

      /* --- 予定 --- */
      if (path === '/api/schedules' && request.method === 'POST') {
        var sc = await request.json();
        if (!sc.date) return reply({ error: 'date required' }, 400);
        return reply({ id: await upsertSchedule(db, sc) });
      }
      m = path.match(/^\/api\/schedules\/([\w-]+)$/);
      if (m && request.method === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM schedule_items WHERE schedule_id = ?').bind(m[1]),
          db.prepare('DELETE FROM schedules WHERE id = ? AND user_id = ?').bind(m[1], USER_ID)
        ]);
        return reply({ ok: true });
      }

      /* --- 設定 --- */
      if (path === '/api/settings' && request.method === 'PUT') {
        var s = await request.json();
        await db.prepare(
          'UPDATE settings SET home_area = ?, search_range_min = ?, default_stay_min = ?, updated_at = ? WHERE user_id = ?'
        ).bind(String(s.homeArea || '津'), +s.searchRangeMin || 30, +s.defaultStayMin || 30, nowIso(), USER_ID).run();
        return reply({ ok: true });
      }

      /* --- 移行: Phase 1 のエクスポートJSONをそのまま受け取る --- */
      if (path === '/api/migrate' && request.method === 'POST') {
        var data = await request.json();
        if (!data || data.version !== 1) return reply({ error: 'unsupported format (expect Phase1 export, version:1)' }, 400);
        var counts = { oshi: 0, events: 0, schedules: 0, skippedDuplicates: 0 };
        for (var i = 0; i < (data.oshi || []).length; i++) {
          await upsertOshi(db, data.oshi[i]); counts.oshi++;
        }
        for (i = 0; i < (data.events || []).length; i++) {
          var rr = await applyEventUpdate(db, data.events[i], 'migration');
          if (rr.conflict) counts.skippedDuplicates++; else counts.events++;
        }
        for (i = 0; i < (data.schedules || []).length; i++) {
          await upsertSchedule(db, data.schedules[i]); counts.schedules++;
        }
        if (data.settings) {
          await db.prepare(
            'UPDATE settings SET home_area = ?, search_range_min = ?, default_stay_min = ?, updated_at = ? WHERE user_id = ?'
          ).bind(String(data.settings.homeArea || '津'), +data.settings.searchRangeMin || 30,
            +data.settings.defaultStayMin || 30, nowIso(), USER_ID).run();
        }
        /* 検証用にサーバー側の件数も返す */
        var after = await db.batch([
          db.prepare('SELECT COUNT(*) AS c FROM oshi WHERE user_id = ?').bind(USER_ID),
          db.prepare('SELECT COUNT(*) AS c FROM events WHERE user_id = ?').bind(USER_ID),
          db.prepare('SELECT COUNT(*) AS c FROM schedules WHERE user_id = ?').bind(USER_ID)
        ]);
        return reply({
          imported: counts,
          serverCounts: { oshi: after[0].results[0].c, events: after[1].results[0].c, schedules: after[2].results[0].c }
        });
      }

      return reply({ error: 'not found' }, 404);
    } catch (e) {
      return reply({ error: 'server_error', message: String(e && e.message || e) }, 500);
    }
  }
};
