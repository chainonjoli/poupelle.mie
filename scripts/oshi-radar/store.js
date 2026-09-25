/* 推し活レーダーOS データ層
   2つのモードを持つ:
   - ローカルモード: localStorage 'oshiRadar.v1'（Phase 1 と同一。既存データはそのまま）
   - クラウドモード: Cloudflare Workers + D1 のAPIが真実。メモリキャッシュを同期読み、
     変更はAPIへ書き込み。オフライン閲覧用に 'oshiRadar.cloudCache.v1' にミラーする。
   読み書きAPI（listEvents等）は Phase 1 と同一のまま。app.js/logic.js は無改修で動く。 */
(function (global) {
    'use strict';

    var KEY = 'oshiRadar.v1';               /* ローカルモードの本体（移行後も消さない） */
    var CACHE_KEY = 'oshiRadar.cloudCache.v1'; /* クラウドモードのオフラインミラー */
    var REMOTE_KEY = 'oshiRadar.remote';    /* {enabled, apiUrl, token} */

    function uid(prefix) {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function nowIso() { return new Date().toISOString(); }

    /* ---- リモート設定 ---- */
    function getRemoteConfig() {
        try { return JSON.parse(localStorage.getItem(REMOTE_KEY)) || { enabled: false, apiUrl: '', token: '' }; }
        catch (e) { return { enabled: false, apiUrl: '', token: '' }; }
    }
    function saveRemoteConfig(cfg) { localStorage.setItem(REMOTE_KEY, JSON.stringify(cfg)); }
    function isRemote() { return !!getRemoteConfig().enabled; }

    var remoteStatus = 'local'; /* local | online | offline */
    var syncErrorShown = false;

    function apiFetch(method, path, body, cfg) {
        cfg = cfg || getRemoteConfig();
        return fetch(cfg.apiUrl.replace(/\/$/, '') + path, {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + cfg.token,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) { var e = new Error(data.error || ('HTTP ' + res.status)); e.data = data; e.status = res.status; throw e; }
                return data;
            });
        });
    }

    /* 変更のクラウド反映（fire-and-forget。失敗時は一度だけ警告） */
    function push(method, path, body) {
        if (!isRemote()) return Promise.resolve();
        return apiFetch(method, path, body).catch(function (e) {
            console.error('cloud sync failed', e);
            if (e.status === 409) {
                alert('クラウド側に同じイベント（名前×会場×開始日×主催者）が既にあります。ページを再読み込みして確認してください。');
            } else if (!syncErrorShown) {
                syncErrorShown = true;
                alert('クラウドへの保存に失敗しました。通信環境を確認してください。\nこの端末での変更は再読み込みまでは画面に残りますが、サーバーには保存されていません。');
            }
        });
    }

    /* ---- 初期データ（シード。ローカルモード初回のみ） ---- */
    function seedData() {
        var oshiKing = {
            id: uid('oshi'), name: 'King & Prince', group: 'King & Prince', category: 'アイドル',
            priority: 1, notify: true,
            keywords: ['キンプリ', 'King&Prince', 'King and Prince', 'KING & PRINCE'],
            excludeKeywords: [], createdAt: nowIso()
        };
        var oshiRen = {
            id: uid('oshi'), name: '永瀬廉', group: 'King & Prince', category: 'アイドル',
            priority: 1, notify: true,
            keywords: ['廉', 'Ren Nagase', 'King & Prince'],
            excludeKeywords: [], createdAt: nowIso()
        };
        var oshiKaito = {
            id: uid('oshi'), name: '髙橋海人', group: 'King & Prince', category: 'アイドル',
            priority: 1, notify: true,
            keywords: ['高橋海人', 'Kaito Takahashi', 'King & Prince'],
            excludeKeywords: [], createdAt: nowIso()
        };
        var oshiDisney = {
            id: uid('oshi'), name: 'Disney', group: '', category: 'ブランド',
            priority: 2, notify: true,
            keywords: ['ディズニー', 'disney'],
            excludeKeywords: [], createdAt: nowIso()
        };
        var oshiPoupelle = {
            id: uid('oshi'), name: 'えんとつ町のプペル', group: '', category: '作品',
            priority: 3, notify: true,
            keywords: ['プペル', 'poupelle'],
            excludeKeywords: [], createdAt: nowIso()
        };
        var oshiArt = {
            id: uid('oshi'), name: 'アート・展示・POP-UP', group: '', category: 'ジャンル',
            priority: 3, notify: false,
            keywords: ['展示会', '美術館', 'POP-UP', 'ポップアップ', '期間限定'],
            excludeKeywords: [], createdAt: nowIso()
        };

        var sampleEvent = {
            id: uid('ev'), name: 'King & Prince × Disney イベント（見本データ）',
            organizer: 'タワーレコード',
            category: 'POP-UP',
            oshiLinks: [
                { oshiId: oshiKing.id, matchType: 'コラボ' },
                { oshiId: oshiDisney.id, matchType: 'コラボ' }
            ],
            prefecture: '大阪府', city: '大阪市阿倍野区',
            venue: 'タワーレコード あべのHoop店', area: '天王寺・あべの',
            startDate: '2026-08-08', endDate: '2026-08-24',
            openTime: '11:00', closeTime: '21:00', lastEntry: '20:30',
            fee: '無料', needsReservation: false, needsNumberedTicket: true,
            sameDayTicket: true, freeEntry: true, freeEntryFrom: '16:00',
            officialUrl: '',
            sources: [
                { url: 'https://tower.jp/', name: 'タワーレコード（要確認：見本のため未裏取り）', official: false, fetchedAt: nowIso(), verifiedAt: '' }
            ],
            status: '開催中',
            notes: '※これは使い方を示す見本データです。実際の開催期間・入場方法は必ず公式情報で確認してから更新してください。',
            createdAt: nowIso(), updatedAt: nowIso(), lastVerifiedAt: ''
        };

        return {
            version: 1,
            settings: {
                homeArea: '津',
                searchRangeMin: 30,
                defaultStayMin: 30
            },
            oshi: [oshiKing, oshiRen, oshiKaito, oshiDisney, oshiPoupelle, oshiArt],
            events: [sampleEvent],
            schedules: []
        };
    }

    var cache = null;
    var initialized = false;

    /* 初期化。クラウドモードならAPIから状態を取得してから解決する。
       app.js は init() の完了後に描画を始めること。 */
    function init() {
        if (initialized) return Promise.resolve();
        if (!isRemote()) {
            loadLocal();
            remoteStatus = 'local';
            initialized = true;
            return Promise.resolve();
        }
        return apiFetch('GET', '/api/state').then(function (data) {
            cache = data;
            remoteStatus = 'online';
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* 容量超過は無視 */ }
            initialized = true;
        }).catch(function (e) {
            console.error('cloud load failed', e);
            var mirror = null;
            try { mirror = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e2) { }
            if (mirror) {
                cache = mirror;
                remoteStatus = 'offline';
                alert('クラウドに接続できないため、前回同期したデータを表示しています（閲覧のみ推奨）。');
            } else {
                loadLocal();
                remoteStatus = 'offline';
                alert('クラウドに接続できません。ローカルデータを表示しています。');
            }
            initialized = true;
        });
    }

    function loadLocal() {
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                cache = JSON.parse(raw);
                if (!cache.settings) cache.settings = seedData().settings;
                if (!cache.oshi) cache.oshi = [];
                if (!cache.events) cache.events = [];
                if (!cache.schedules) cache.schedules = [];
                return;
            }
        } catch (e) {
            console.error('storage load error', e);
        }
        cache = seedData();
        persistLocal();
    }

    function persistLocal() {
        try {
            localStorage.setItem(isRemote() ? CACHE_KEY : KEY, JSON.stringify(cache));
        } catch (e) {
            console.error('storage save error', e);
        }
    }

    function load() {
        if (!cache) loadLocal(); /* init()を経ない直アクセスの保険（ローカルモード動作） */
        return cache;
    }

    function save() { persistLocal(); }

    /* ---- 推し ---- */
    function listOshi() { return load().oshi.slice(); }
    function getOshi(id) {
        return load().oshi.find(function (o) { return o.id === id; }) || null;
    }
    function upsertOshi(oshi) {
        var db = load();
        if (!oshi.id) { oshi.id = uid('oshi'); oshi.createdAt = nowIso(); db.oshi.push(oshi); }
        else {
            var i = db.oshi.findIndex(function (o) { return o.id === oshi.id; });
            if (i >= 0) db.oshi[i] = oshi; else db.oshi.push(oshi);
        }
        save();
        push('POST', '/api/oshi', oshi);
        return oshi;
    }
    function deleteOshi(id) {
        var db = load();
        db.oshi = db.oshi.filter(function (o) { return o.id !== id; });
        db.events.forEach(function (ev) {
            ev.oshiLinks = (ev.oshiLinks || []).filter(function (l) { return l.oshiId !== id; });
        });
        save();
        push('DELETE', '/api/oshi/' + id);
    }

    /* ---- イベント ---- */
    function listEvents() { return load().events.slice(); }
    function getEvent(id) {
        return load().events.find(function (e) { return e.id === id; }) || null;
    }
    /* 一意性キー（要件18）: 名前×会場×開始日×主催者 */
    function eventKey(ev) {
        return [ev.name, ev.venue, ev.startDate, ev.organizer].map(function (s) {
            return String(s || '').trim().toLowerCase();
        }).join('|');
    }
    function findDuplicate(ev) {
        var key = eventKey(ev);
        return load().events.find(function (e) {
            return e.id !== ev.id && eventKey(e) === key;
        }) || null;
    }
    function upsertEvent(ev) {
        var db = load();
        ev.updatedAt = nowIso();
        if (!ev.id) { ev.id = uid('ev'); ev.createdAt = nowIso(); db.events.push(ev); }
        else {
            var i = db.events.findIndex(function (e) { return e.id === ev.id; });
            if (i >= 0) db.events[i] = ev; else db.events.push(ev);
        }
        save();
        push('POST', '/api/events', ev);
        return ev;
    }
    function deleteEvent(id) {
        var db = load();
        db.events = db.events.filter(function (e) { return e.id !== id; });
        save();
        push('DELETE', '/api/events/' + id);
    }

    /* ---- 予定 ---- */
    function listSchedules() { return load().schedules.slice(); }
    function getScheduleByDate(dateStr) {
        return load().schedules.find(function (s) { return s.date === dateStr; }) || null;
    }
    function upsertSchedule(sc) {
        var db = load();
        if (!sc.id) sc.id = uid('sc');
        var i = db.schedules.findIndex(function (s) { return s.id === sc.id; });
        if (i >= 0) db.schedules[i] = sc; else db.schedules.push(sc);
        db.schedules.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        save();
        push('POST', '/api/schedules', sc);
        return sc;
    }
    function deleteSchedule(id) {
        var db = load();
        db.schedules = db.schedules.filter(function (s) { return s.id !== id; });
        save();
        push('DELETE', '/api/schedules/' + id);
    }

    /* ---- 設定 ---- */
    function getSettings() { return load().settings; }
    function saveSettings(s) {
        load().settings = s;
        save();
        push('PUT', '/api/settings', s);
    }

    /* ---- バックアップ ---- */
    function exportJson() { return JSON.stringify(load(), null, 2); }
    function importJson(text) {
        var data = JSON.parse(text); /* 不正JSONはここで例外 */
        if (!data || data.version !== 1) throw new Error('対応していないデータ形式です');
        if (isRemote()) {
            /* クラウドモードでは移行APIで取り込み、取り込み後に再読込を促す */
            return apiFetch('POST', '/api/migrate', data);
        }
        cache = data;
        save();
        return Promise.resolve();
    }

    /* ---- クラウド移行（設定画面のウィザードが使う） ----
       手順: backup → migrate → verify → switch。localStorage版データは消さない。 */
    function backupLocal() {
        var raw = localStorage.getItem(KEY);
        if (!raw) throw new Error('ローカルデータがありません');
        var backupKey = 'oshiRadar.backup.' + nowIso().replace(/[:.]/g, '-');
        localStorage.setItem(backupKey, raw);
        return { key: backupKey, json: raw };
    }
    function testConnection(cfg) {
        return apiFetch('GET', '/api/state', null, cfg);
    }
    function migrateToCloud(cfg) {
        var raw = localStorage.getItem(KEY);
        if (!raw) return Promise.reject(new Error('ローカルデータがありません'));
        return apiFetch('POST', '/api/migrate', JSON.parse(raw), cfg);
    }
    function verifyCloud(cfg) {
        var local = JSON.parse(localStorage.getItem(KEY) || '{}');
        return apiFetch('GET', '/api/export', null, cfg).then(function (server) {
            return {
                local: {
                    oshi: (local.oshi || []).length,
                    events: (local.events || []).length,
                    schedules: (local.schedules || []).length
                },
                server: {
                    oshi: (server.oshi || []).length,
                    events: (server.events || []).length,
                    schedules: (server.schedules || []).length
                }
            };
        });
    }
    function switchToCloud(cfg) {
        cfg.enabled = true;
        saveRemoteConfig(cfg);
    }
    function switchToLocal() {
        var cfg = getRemoteConfig();
        cfg.enabled = false;
        saveRemoteConfig(cfg);
    }

    global.OshiStore = {
        init: init,
        load: load, save: save, uid: uid, nowIso: nowIso,
        listOshi: listOshi, getOshi: getOshi, upsertOshi: upsertOshi, deleteOshi: deleteOshi,
        listEvents: listEvents, getEvent: getEvent, upsertEvent: upsertEvent,
        deleteEvent: deleteEvent, findDuplicate: findDuplicate,
        listSchedules: listSchedules, getScheduleByDate: getScheduleByDate,
        upsertSchedule: upsertSchedule, deleteSchedule: deleteSchedule,
        getSettings: getSettings, saveSettings: saveSettings,
        exportJson: exportJson, importJson: importJson,
        /* クラウド関連 */
        isRemote: isRemote,
        remoteStatus: function () { return remoteStatus; },
        getRemoteConfig: getRemoteConfig, saveRemoteConfig: saveRemoteConfig,
        backupLocal: backupLocal, testConnection: testConnection,
        migrateToCloud: migrateToCloud, verifyCloud: verifyCloud,
        switchToCloud: switchToCloud, switchToLocal: switchToLocal
    };
})(window);
