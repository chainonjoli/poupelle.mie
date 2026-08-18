/* 推し活レーダーOS UI層
   store.js / travel.js / logic.js を使って画面を描画する。 */
(function () {
    'use strict';

    var S = window.OshiStore, T = window.OshiTravel, L = window.OshiLogic;
    var view = document.getElementById('view');
    var dlg = document.getElementById('dlg');
    var dlgBody = document.getElementById('dlg-body');
    var currentTab = 'home';

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function todayStr() { return L.toDateStr(new Date()); }
    function nowMinutes() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }

    /* スコア計算の共有コンテキストを組み立てる */
    function buildContext() {
        var settings = S.getSettings();
        var sched = S.getScheduleByDate(todayStr());
        var scCtx = L.currentContextFromSchedule(sched, nowMinutes(), settings.homeArea);
        return {
            todayStr: todayStr(),
            oshiList: S.listOshi(),
            baseArea: scCtx.fromArea || settings.homeArea,
            scheduleRegion: scCtx.region,
            freeGapMin: scCtx.freeGapMin,
            next: scCtx.next,
            settings: settings,
            todaySchedule: sched
        };
    }

    /* ---------- イベントカード ---------- */
    function fmtDateRange(ev) {
        var s = ev.startDate ? ev.startDate.replace(/-/g, '/') : '未定';
        var e = ev.endDate ? ev.endDate.replace(/-/g, '/') : '';
        return e && e !== s ? s + '〜' + e : s;
    }

    function eventCard(ev, ctx, opts) {
        opts = opts || {};
        var score = L.scoreEvent(ev, ctx);
        var level = L.notifyLevel(score.total);
        var boost = L.missPreventionBoost(ev, score, ctx);
        var verify = L.needsVerification(ev);
        var hot = score.total >= 80 || boost.length > 0;
        var state = L.eventDayState(ev, ctx.todayStr);
        var entry = [];
        if (ev.freeEntry && ev.freeEntryFrom) entry.push(ev.freeEntryFrom + '〜フリー入場');
        else if (ev.freeEntry) entry.push('フリー入場可');
        if (ev.needsNumberedTicket) entry.push('整理券あり');
        if (ev.needsReservation) entry.push('事前予約制');

        var meta = [];
        meta.push('<span class="m" data-i="📍">' + esc(ev.venue || ev.area || '会場未定') + '</span>');
        meta.push('<span class="m" data-i="📅">' + esc(fmtDateRange(ev)) + (state === 'ongoing' ? '（開催中）' : state === 'ended' ? '（終了）' : '') + '</span>');
        if (score.travelMin != null && score.travelMin < 999) {
            meta.push('<span class="m" data-i="🚃">' + esc(ctx.baseArea) + 'から約' + score.travelMin + '分</span>');
        }
        if (ev.openTime) meta.push('<span class="m" data-i="🕐">' + esc(ev.openTime) + '〜' + esc(ev.closeTime || '') + (ev.lastEntry ? '（最終入場' + esc(ev.lastEntry) + '）' : '') + '</span>');
        if (entry.length) meta.push('<span class="m" data-i="🎫">' + esc(entry.join('・')) + '</span>');

        var badge = verify
            ? '<span class="badge-verify">要確認</span>'
            : '<span class="badge-official">公式確認済</span>';

        return '<div class="card' + (hot ? ' hot' : '') + '" data-ev="' + ev.id + '">' +
            '<div class="card-top">' +
              '<div class="score-badge' + (score.total >= 80 ? ' hot' : '') + '">' + score.total + '<small>点</small></div>' +
              '<div class="card-title">' + esc(ev.name) + badge + '</div>' +
            '</div>' +
            (level.label ? '<div class="notify-label">' + level.label + '</div>' : '') +
            (boost.length ? '<div class="boost-reasons">⚡ ' + boost.map(esc).join(' ／ ') + '</div>' : '') +
            '<div class="card-meta">' + meta.join('') + '</div>' +
            '<div class="card-actions">' +
              '<button class="btn btn-outline-gold btn-small" data-act="judge" data-id="' + ev.id + '">今から行ける？</button>' +
              (ev.officialUrl ? '<a class="btn btn-small" href="' + esc(ev.officialUrl) + '" target="_blank" rel="noopener">公式サイト</a>' : '') +
              (opts.editable !== false ? '<button class="btn btn-small" data-act="edit-ev" data-id="' + ev.id + '">編集</button>' : '') +
            '</div>' +
            '<div class="judge-slot"></div>' +
        '</div>';
    }

    function runJudge(evId, slot) {
        var ctx = buildContext();
        var ev = S.getEvent(evId);
        if (!ev) return;
        var r = L.judgeNow(ev, {
            nowMin: nowMinutes(),
            fromArea: ctx.baseArea,
            next: ctx.next,
            stayMin: ctx.settings.defaultStayMin || 30
        });
        var cls = r.verdict === '◎' ? 'v-ok' : (r.verdict === '×' || r.verdict === '?') ? 'v-ng' : 'v-mid';
        slot.innerHTML = '<div class="judge">' +
            '<div class="verdict ' + cls + '">' + esc(r.verdict) + ' ' + esc(r.label) + '</div>' +
            (r.timeline.length ? '<div class="timeline">' + r.timeline.map(function (t) { return '<div>' + esc(t) + '</div>'; }).join('') + '</div>' : '') +
            (r.notes.length ? '<div class="jnotes">' + r.notes.map(esc).join('<br>') + '</div>' : '') +
        '</div>';
    }

    /* ---------- ホーム ---------- */
    function renderHome() {
        var ctx = buildContext();
        var events = S.listEvents().filter(function (ev) {
            return L.eventDayState(ev, ctx.todayStr) !== 'ended'; /* 終了イベントは自動非表示 */
        });
        var scored = events.map(function (ev) {
            return { ev: ev, score: L.scoreEvent(ev, ctx), boost: null };
        });
        scored.forEach(function (x) { x.boost = L.missPreventionBoost(x.ev, x.score, ctx); });
        scored.sort(function (a, b) { return b.score.total - a.score.total; });

        function cards(list) {
            return list.length
                ? list.map(function (x) { return eventCard(x.ev, ctx); }).join('')
                : '<div class="empty">該当なし</div>';
        }

        var goNow = scored.filter(function (x) {
            return x.boost.length > 0 && L.eventDayState(x.ev, ctx.todayStr) === 'ongoing';
        });
        var todayList = scored.filter(function (x) { return L.eventDayState(x.ev, ctx.todayStr) === 'ongoing'; });
        var warnList = scored.filter(function (x) { return x.score.total >= 80; });
        var endingSoon = scored.filter(function (x) {
            var d = x.ev.endDate ? L.daysBetween(ctx.todayStr, x.ev.endDate) : null;
            return d != null && d >= 0 && d <= 7;
        });
        var newList = scored.filter(function (x) {
            return x.ev.createdAt && (Date.now() - new Date(x.ev.createdAt).getTime()) < 86400000;
        });
        /* 遠征予定と一致: 登録済み予定の日付×エリア地方にかかるイベント */
        var trips = S.listSchedules().filter(function (s) { return s.date >= ctx.todayStr; });
        var tripMatch = scored.filter(function (x) {
            return trips.some(function (s) {
                var regions = (s.items || []).map(function (i) { return T.regionOf(i.area); });
                var inRange = (!x.ev.startDate || x.ev.startDate <= s.date) && (!x.ev.endDate || x.ev.endDate >= s.date);
                return inRange && regions.indexOf(T.regionOf(x.ev.area)) >= 0;
            });
        });

        /* 朝の確認バナー（今日予定がある日） */
        var morning = '';
        if (ctx.todaySchedule && (ctx.todaySchedule.items || []).length) {
            var region = ctx.scheduleRegion || '';
            var hotCount = warnList.length;
            var recoCount = scored.filter(function (x) { return x.score.total >= 60 && x.score.total < 80; }).length;
            morning = '<div class="morning-banner">' +
                '<div class="mb-title">☀️ 今日の推し活チャンス</div>' +
                '<div class="mb-body">今日は' + esc(region || '外出') + 'の予定があります。<br>' +
                '🔥見逃し注意 ' + hotCount + '件 ／ ⭐おすすめ ' + recoCount + '件</div>' +
            '</div>';
        }

        view.innerHTML =
            morning +
            '<div class="now-btn-wrap"><button class="btn btn-gold btn-wide" id="btn-now">🔍 今から何かある？</button></div>' +
            '<div id="now-results"></div>' +
            (goNow.length ? '<section class="sec"><div class="sec-title">🔥 今から行けます<span class="count">' + goNow.length + '</span></div>' + cards(goNow) + '</section>' : '') +
            '<section class="sec"><div class="sec-title">今日開催中<span class="count">' + todayList.length + '</span></div>' + cards(todayList) + '</section>' +
            '<section class="sec"><div class="sec-title">見逃し注意（80点以上）<span class="count">' + warnList.length + '</span></div>' + cards(warnList) + '</section>' +
            '<section class="sec"><div class="sec-title">終了間近（7日以内）<span class="count">' + endingSoon.length + '</span></div>' + cards(endingSoon) + '</section>' +
            '<section class="sec"><div class="sec-title">遠征予定と一致<span class="count">' + tripMatch.length + '</span></div>' + cards(tripMatch) + '</section>' +
            '<section class="sec"><div class="sec-title">新着（24時間以内）<span class="count">' + newList.length + '</span></div>' + cards(newList) + '</section>';

        var btnNow = document.getElementById('btn-now');
        btnNow.addEventListener('click', function () {
            var box = document.getElementById('now-results');
            var candidates = todayList.filter(function (x) {
                var r = L.judgeNow(x.ev, {
                    nowMin: nowMinutes(), fromArea: ctx.baseArea,
                    next: ctx.next, stayMin: ctx.settings.defaultStayMin || 30
                });
                x.judge = r;
                return r.verdict === '◎' || r.verdict === '○' || r.verdict === '△';
            });
            if (!candidates.length) {
                box.innerHTML = '<section class="sec"><div class="sec-title">今から行けるイベント</div><div class="empty">今から行けるイベントは見つかりませんでした。<br>（現在地: ' + esc(ctx.baseArea) + '）</div></section>';
                return;
            }
            box.innerHTML = '<section class="sec"><div class="sec-title">🔥 今から行けます<span class="count">' + candidates.length + '</span></div>' +
                candidates.map(function (x) { return eventCard(x.ev, ctx); }).join('') + '</section>';
            /* 判定結果を各カードに即表示 */
            candidates.forEach(function (x) {
                var card = box.querySelector('.card[data-ev="' + x.ev.id + '"] .judge-slot');
                if (card) runJudge(x.ev.id, card);
            });
        });
    }

    /* ---------- イベント一覧・フォーム ---------- */
    var showEnded = false;

    function renderEvents() {
        var ctx = buildContext();
        var events = S.listEvents();
        var active = events.filter(function (ev) { return L.eventDayState(ev, ctx.todayStr) !== 'ended'; });
        var ended = events.filter(function (ev) { return L.eventDayState(ev, ctx.todayStr) === 'ended'; });
        var scored = active.map(function (ev) { return { ev: ev, s: L.scoreEvent(ev, ctx) }; });
        scored.sort(function (a, b) { return b.s.total - a.s.total; });

        view.innerHTML =
            '<div class="add-row"><button class="btn btn-gold btn-wide" data-act="add-ev">＋ イベントを登録</button></div>' +
            '<section class="sec"><div class="sec-title">イベント（スコア順）<span class="count">' + scored.length + '</span></div>' +
            (scored.length ? scored.map(function (x) { return eventCard(x.ev, ctx); }).join('') : '<div class="empty">イベントがまだありません。<br>「＋ イベントを登録」から追加してください。</div>') +
            '</section>' +
            '<section class="sec"><div class="sec-title">終了したイベント<span class="count">' + ended.length + '</span></div>' +
            (ended.length
                ? ('<button class="btn btn-small" id="toggle-ended">' + (showEnded ? '隠す' : '表示する') + '</button>' +
                   (showEnded ? ended.map(function (ev) { return eventCard(ev, ctx); }).join('') : ''))
                : '<div class="empty">なし</div>') +
            '</section>';

        var tg = document.getElementById('toggle-ended');
        if (tg) tg.addEventListener('click', function () { showEnded = !showEnded; renderEvents(); });
    }

    function eventForm(ev) {
        ev = ev || {
            name: '', organizer: '', category: 'POP-UP', oshiLinks: [], prefecture: '', city: '',
            venue: '', area: '', startDate: todayStr(), endDate: '', openTime: '', closeTime: '',
            lastEntry: '', fee: '', needsReservation: false, needsNumberedTicket: false,
            sameDayTicket: false, freeEntry: true, freeEntryFrom: '', officialUrl: '',
            sources: [], status: '開催中', notes: '', lastVerifiedAt: ''
        };
        var oshiList = S.listOshi();
        var areas = T.areaNames();

        /* 推しキーワードの自動候補: イベント名にキーワードが含まれる推しを事前選択 */
        function suggestType(o) {
            var linked = (ev.oshiLinks || []).find(function (l) { return l.oshiId === o.id; });
            if (linked) return linked.matchType;
            var text = (ev.name + ' ' + ev.notes).toLowerCase();
            var ex = (o.excludeKeywords || []).some(function (k) { return k && text.indexOf(k.toLowerCase()) >= 0; });
            if (ex) return '';
            var hit = [o.name].concat(o.keywords || []).some(function (k) { return k && text.indexOf(k.toLowerCase()) >= 0; });
            return hit ? '関連作品' : '';
        }

        var oshiRows = oshiList.map(function (o) {
            var sel = suggestType(o);
            return '<div class="f-inline"><div class="f-group" style="flex:1.4"><label>' + esc(o.name) + '</label></div>' +
                '<div class="f-group"><select data-oshi="' + o.id + '">' +
                ['', '本人', 'グループ', 'コラボ', '関連作品'].map(function (t) {
                    return '<option value="' + t + '"' + (t === sel ? ' selected' : '') + '>' + (t || '関係なし') + '</option>';
                }).join('') + '</select></div></div>';
        }).join('');

        var srcRows = (ev.sources || []).map(function (s, i) {
            return '<div class="row" data-src="' + i + '">' +
                '<div class="row-head"><div class="row-title">' + esc(s.name || '情報源') + '</div>' +
                (s.official ? '<span class="badge-official">公式</span>' : '<span class="badge-verify">非公式</span>') +
                '<button class="btn btn-small btn-danger" data-act="del-src" data-i="' + i + '">削除</button></div>' +
                '<div class="row-sub">' + esc(s.url) + '<br>取得: ' + esc((s.fetchedAt || '').slice(0, 10)) + (s.verifiedAt ? ' ／ 最終確認: ' + esc(s.verifiedAt.slice(0, 10)) : '') + '</div></div>';
        }).join('');

        dlgBody.innerHTML =
            '<h2>' + (ev.id ? 'イベントを編集' : 'イベントを登録') + '</h2>' +
            '<div id="dup-warn"></div>' +
            '<div class="f-group"><label>イベント名 *</label><input type="text" id="f-name" value="' + esc(ev.name) + '"></div>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>主催者 <span class="hint">（誤認防止のため必須推奨）</span></label><input type="text" id="f-organizer" value="' + esc(ev.organizer) + '"></div>' +
              '<div class="f-group"><label>カテゴリ</label><select id="f-category">' +
                ['POP-UP', '展示', 'コラボカフェ', 'ライブ', 'イベント', '美術館', 'その他'].map(function (c) {
                    return '<option' + (c === ev.category ? ' selected' : '') + '>' + c + '</option>';
                }).join('') + '</select></div>' +
            '</div>' +
            '<h3>場所</h3>' +
            '<div class="f-group"><label>会場名 *</label><input type="text" id="f-venue" value="' + esc(ev.venue) + '"></div>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>エリア（移動時間計算用）*</label><select id="f-area"><option value="">選択してください</option>' +
                areas.map(function (a) { return '<option' + (a === ev.area ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
              '<div class="f-group"><label>市区町村</label><input type="text" id="f-city" value="' + esc(ev.city) + '"></div>' +
            '</div>' +
            '<h3>期間・時間</h3>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>開始日 *</label><input type="date" id="f-start" value="' + esc(ev.startDate) + '"></div>' +
              '<div class="f-group"><label>終了日</label><input type="date" id="f-end" value="' + esc(ev.endDate) + '"></div>' +
            '</div>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>開場</label><input type="time" id="f-open" value="' + esc(ev.openTime) + '"></div>' +
              '<div class="f-group"><label>閉場</label><input type="time" id="f-close" value="' + esc(ev.closeTime) + '"></div>' +
              '<div class="f-group"><label>最終入場</label><input type="time" id="f-lastentry" value="' + esc(ev.lastEntry) + '"></div>' +
            '</div>' +
            '<h3>入場方法</h3>' +
            '<div class="f-check"><input type="checkbox" id="f-free"' + (ev.freeEntry ? ' checked' : '') + '><label for="f-free">フリー入場あり</label></div>' +
            '<div class="f-group"><label>フリー入場開始時間</label><input type="time" id="f-freefrom" value="' + esc(ev.freeEntryFrom) + '"></div>' +
            '<div class="f-check"><input type="checkbox" id="f-ticket"' + (ev.needsNumberedTicket ? ' checked' : '') + '><label for="f-ticket">整理券が必要</label></div>' +
            '<div class="f-check"><input type="checkbox" id="f-reserve"' + (ev.needsReservation ? ' checked' : '') + '><label for="f-reserve">事前予約が必要</label></div>' +
            '<div class="f-check"><input type="checkbox" id="f-sameday"' + (ev.sameDayTicket ? ' checked' : '') + '><label for="f-sameday">当日券あり</label></div>' +
            '<div class="f-group"><label>料金</label><input type="text" id="f-fee" value="' + esc(ev.fee) + '"></div>' +
            '<h3>推しとの関係</h3>' + (oshiRows || '<div class="empty">先に推しを登録してください</div>') +
            '<h3>情報源（公式ソースが無いと【要確認】表示になります）</h3>' +
            '<div id="src-list">' + srcRows + '</div>' +
            '<div class="f-group"><label>情報源URL</label><input type="url" id="f-src-url" placeholder="https://"></div>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>情報源名</label><input type="text" id="f-src-name" placeholder="例: タワーレコード公式"></div>' +
              '<div class="f-group" style="display:flex;align-items:flex-end"><div class="f-check" style="margin:0"><input type="checkbox" id="f-src-official"><label for="f-src-official">公式情報</label></div></div>' +
            '</div>' +
            '<button class="btn btn-small" id="btn-add-src">＋ この情報源を追加</button>' +
            '<div class="f-group" style="margin-top:12px"><label>公式URL</label><input type="url" id="f-url" value="' + esc(ev.officialUrl) + '"></div>' +
            '<div class="f-group"><label>注意事項・メモ</label><textarea id="f-notes">' + esc(ev.notes) + '</textarea></div>' +
            '<div class="f-check"><input type="checkbox" id="f-verified"><label for="f-verified">今日、内容を公式情報で確認した（最終確認日時を更新）</label></div>' +
            '<div class="dlg-actions">' +
              (ev.id ? '<button class="btn btn-danger" id="btn-del-ev">削除</button>' : '') +
              '<button class="btn" id="btn-cancel">閉じる</button>' +
              '<button class="btn btn-gold" id="btn-save-ev">保存</button>' +
            '</div>';

        var pendingSources = (ev.sources || []).slice();

        function redrawSources() {
            document.getElementById('src-list').innerHTML = pendingSources.map(function (s, i) {
                return '<div class="row"><div class="row-head"><div class="row-title">' + esc(s.name || '情報源') + '</div>' +
                    (s.official ? '<span class="badge-official">公式</span>' : '<span class="badge-verify">非公式</span>') +
                    '<button class="btn btn-small btn-danger" data-act="del-src" data-i="' + i + '">削除</button></div>' +
                    '<div class="row-sub">' + esc(s.url) + '</div></div>';
            }).join('');
        }

        dlgBody.addEventListener('click', function onSrc(e) {
            var del = e.target.closest('[data-act="del-src"]');
            if (del) { pendingSources.splice(+del.dataset.i, 1); redrawSources(); }
        });

        document.getElementById('btn-add-src').addEventListener('click', function () {
            var url = document.getElementById('f-src-url').value.trim();
            if (!url) { alert('URLを入力してください'); return; }
            pendingSources.push({
                url: url,
                name: document.getElementById('f-src-name').value.trim(),
                official: document.getElementById('f-src-official').checked,
                fetchedAt: S.nowIso(), verifiedAt: ''
            });
            document.getElementById('f-src-url').value = '';
            document.getElementById('f-src-name').value = '';
            document.getElementById('f-src-official').checked = false;
            redrawSources();
        });

        document.getElementById('btn-cancel').addEventListener('click', function () { dlg.close(); });
        if (ev.id) {
            document.getElementById('btn-del-ev').addEventListener('click', function () {
                if (confirm('このイベントを削除しますか？')) { S.deleteEvent(ev.id); dlg.close(); render(); }
            });
        }

        document.getElementById('btn-save-ev').addEventListener('click', function () {
            var links = [];
            dlgBody.querySelectorAll('select[data-oshi]').forEach(function (sel) {
                if (sel.value) links.push({ oshiId: sel.dataset.oshi, matchType: sel.value });
            });
            var out = {
                id: ev.id || '',
                name: document.getElementById('f-name').value.trim(),
                organizer: document.getElementById('f-organizer').value.trim(),
                category: document.getElementById('f-category').value,
                oshiLinks: links,
                prefecture: ev.prefecture,
                city: document.getElementById('f-city').value.trim(),
                venue: document.getElementById('f-venue').value.trim(),
                area: document.getElementById('f-area').value,
                startDate: document.getElementById('f-start').value,
                endDate: document.getElementById('f-end').value,
                openTime: document.getElementById('f-open').value,
                closeTime: document.getElementById('f-close').value,
                lastEntry: document.getElementById('f-lastentry').value,
                fee: document.getElementById('f-fee').value.trim(),
                needsReservation: document.getElementById('f-reserve').checked,
                needsNumberedTicket: document.getElementById('f-ticket').checked,
                sameDayTicket: document.getElementById('f-sameday').checked,
                freeEntry: document.getElementById('f-free').checked,
                freeEntryFrom: document.getElementById('f-freefrom').value,
                officialUrl: document.getElementById('f-url').value.trim(),
                sources: pendingSources,
                status: ev.status || '開催中',
                notes: document.getElementById('f-notes').value.trim(),
                createdAt: ev.createdAt,
                lastVerifiedAt: document.getElementById('f-verified').checked ? S.nowIso() : (ev.lastVerifiedAt || '')
            };
            if (out.area) out.prefecture = (T.AREAS[out.area] || {}).pref || out.prefecture;
            if (!out.name || !out.venue || !out.area || !out.startDate) {
                alert('イベント名・会場名・エリア・開始日は必須です'); return;
            }
            /* 一意性チェック（要件18）: 名前×会場×開始日×主催者 */
            var dup = S.findDuplicate(out);
            if (dup) {
                var warn = document.getElementById('dup-warn');
                warn.innerHTML = '<div class="form-warn">⚠️ 同じ「イベント名×会場×開始日×主催者」の登録が既にあります（' + esc(dup.name) + ' @ ' + esc(dup.venue) + '）。<br>別イベントなら会場名か主催者を区別して保存してください。</div>';
                warn.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            S.upsertEvent(out);
            dlg.close();
            render();
        });

        dlg.showModal();
    }

    /* ---------- 推し ---------- */
    function renderOshi() {
        var list = S.listOshi().sort(function (a, b) { return a.priority - b.priority; });
        var prioLabel = { 1: '最推し', 2: '高', 3: '通常' };
        view.innerHTML =
            '<div class="add-row"><button class="btn btn-gold btn-wide" data-act="add-oshi">＋ 推しを登録</button></div>' +
            '<section class="sec"><div class="sec-title">推し・興味ジャンル<span class="count">' + list.length + '</span></div>' +
            (list.length ? list.map(function (o) {
                return '<div class="row"><div class="row-head">' +
                    '<div class="row-title">' + esc(o.name) + (o.group && o.group !== o.name ? ' <span style="font-weight:400;color:var(--muted);font-size:0.76rem">(' + esc(o.group) + ')</span>' : '') + '</div>' +
                    '<span class="prio p' + o.priority + '">' + prioLabel[o.priority] + '</span>' +
                    (o.notify ? '<span style="font-size:0.7rem">🔔</span>' : '') +
                    '<button class="btn btn-small" data-act="edit-oshi" data-id="' + o.id + '">編集</button></div>' +
                    ((o.keywords || []).length ? '<div class="row-sub">関連: ' + o.keywords.map(esc).join('、') + '</div>' : '') +
                    ((o.excludeKeywords || []).length ? '<div class="row-sub">除外: ' + o.excludeKeywords.map(esc).join('、') + '</div>' : '') +
                '</div>';
            }).join('') : '<div class="empty">推しを登録してください</div>') +
            '</section>';
    }

    function oshiForm(o) {
        o = o || { name: '', group: '', category: 'アイドル', priority: 2, keywords: [], excludeKeywords: [], notify: true };
        dlgBody.innerHTML =
            '<h2>' + (o.id ? '推しを編集' : '推しを登録') + '</h2>' +
            '<div class="f-group"><label>推し名 *</label><input type="text" id="o-name" value="' + esc(o.name) + '"></div>' +
            '<div class="f-inline">' +
              '<div class="f-group"><label>グループ名</label><input type="text" id="o-group" value="' + esc(o.group) + '"></div>' +
              '<div class="f-group"><label>カテゴリ</label><select id="o-category">' +
                ['アイドル', 'アーティスト', '俳優', '作品', 'ブランド', 'ジャンル', 'その他'].map(function (c) {
                    return '<option' + (c === o.category ? ' selected' : '') + '>' + c + '</option>';
                }).join('') + '</select></div>' +
            '</div>' +
            '<div class="f-group"><label>優先度</label><select id="o-priority">' +
                [[1, '最優先（最推し）'], [2, '高優先'], [3, '通常']].map(function (p) {
                    return '<option value="' + p[0] + '"' + (p[0] === o.priority ? ' selected' : '') + '>' + p[1] + '</option>';
                }).join('') + '</select></div>' +
            '<div class="f-group"><label>関連キーワード・表記揺れ <span class="hint">（読点・カンマ・改行区切り。検索対象になります）</span></label>' +
              '<textarea id="o-keywords">' + esc((o.keywords || []).join('、')) + '</textarea></div>' +
            '<div class="f-group"><label>除外キーワード</label><textarea id="o-exclude">' + esc((o.excludeKeywords || []).join('、')) + '</textarea></div>' +
            '<div class="f-check"><input type="checkbox" id="o-notify"' + (o.notify ? ' checked' : '') + '><label for="o-notify">通知ON（見逃し注意の対象にする）</label></div>' +
            '<div class="dlg-actions">' +
              (o.id ? '<button class="btn btn-danger" id="btn-del-oshi">削除</button>' : '') +
              '<button class="btn" id="btn-cancel">閉じる</button>' +
              '<button class="btn btn-gold" id="btn-save-oshi">保存</button>' +
            '</div>';

        function splitWords(s) {
            return s.split(/[、,\n]/).map(function (w) { return w.trim(); }).filter(Boolean);
        }
        document.getElementById('btn-cancel').addEventListener('click', function () { dlg.close(); });
        if (o.id) {
            document.getElementById('btn-del-oshi').addEventListener('click', function () {
                if (confirm('「' + o.name + '」を削除しますか？イベントとの紐付けも解除されます。')) {
                    S.deleteOshi(o.id); dlg.close(); render();
                }
            });
        }
        document.getElementById('btn-save-oshi').addEventListener('click', function () {
            var name = document.getElementById('o-name').value.trim();
            if (!name) { alert('推し名は必須です'); return; }
            S.upsertOshi({
                id: o.id || '', name: name,
                group: document.getElementById('o-group').value.trim(),
                category: document.getElementById('o-category').value,
                priority: +document.getElementById('o-priority').value,
                keywords: splitWords(document.getElementById('o-keywords').value),
                excludeKeywords: splitWords(document.getElementById('o-exclude').value),
                notify: document.getElementById('o-notify').checked,
                createdAt: o.createdAt
            });
            dlg.close(); render();
        });
        dlg.showModal();
    }

    /* ---------- 予定 ---------- */
    function renderSchedule() {
        var ctx = buildContext();
        var list = S.listSchedules().filter(function (s) { return s.date >= ctx.todayStr; });
        var past = S.listSchedules().filter(function (s) { return s.date < ctx.todayStr; });
        view.innerHTML =
            '<div class="add-row"><button class="btn btn-gold btn-wide" data-act="add-sched">＋ 外出予定を登録</button></div>' +
            '<section class="sec"><div class="sec-title">今後の予定<span class="count">' + list.length + '</span></div>' +
            (list.length ? list.map(schedRow).join('') : '<div class="empty">予定を登録すると、その日の行動範囲で行ける推しイベントを自動で洗い出します。</div>') +
            '</section>' +
            (past.length ? '<section class="sec"><div class="sec-title">過去の予定<span class="count">' + past.length + '</span></div>' + past.slice(-5).map(schedRow).join('') + '</section>' : '');

        function schedRow(s) {
            var items = (s.items || []).map(function (i) {
                return '<div class="sched-item"><span class="t">' + esc(i.time) + (i.endTime ? '〜' + esc(i.endTime) : '') + '</span><span>' + esc(i.title) + '（' + esc(i.area) + '）</span></div>';
            }).join('');
            return '<div class="row"><div class="row-head">' +
                '<div class="row-title">' + esc(s.date.replace(/-/g, '/')) + '</div>' +
                '<button class="btn btn-small btn-outline-gold" data-act="scan-sched" data-id="' + s.id + '">この日行けるイベント</button>' +
                '<button class="btn btn-small" data-act="edit-sched" data-id="' + s.id + '">編集</button></div>' +
                items + '<div class="scan-slot"></div></div>';
        }
    }

    /* 予定日のエリア拡張検索（要件8）: 各予定エリアから設定範囲内のエリアで開催中のイベント */
    function scanSchedule(sc, slot) {
        var ctx = buildContext();
        var range = ctx.settings.searchRangeMin || 30;
        var areas = {};
        (sc.items || []).forEach(function (i) {
            T.reachableAreas(i.area, range).forEach(function (a) { areas[a] = true; });
        });
        var hits = S.listEvents().filter(function (ev) {
            var inRange = (!ev.startDate || ev.startDate <= sc.date) && (!ev.endDate || ev.endDate >= sc.date);
            return inRange && areas[ev.area];
        });
        var dayCtx = Object.assign({}, ctx, { baseArea: (sc.items[0] || {}).area || ctx.baseArea });
        var scored = hits.map(function (ev) { return { ev: ev, s: L.scoreEvent(ev, dayCtx) }; })
            .sort(function (a, b) { return b.s.total - a.s.total; });
        slot.innerHTML = scored.length
            ? '<div style="margin-top:10px">' + scored.map(function (x) { return eventCard(x.ev, dayCtx, { editable: false }); }).join('') + '</div>'
            : '<div class="empty" style="margin-top:10px">この日の行動範囲（各予定地から' + range + '分以内）で行けるイベントは未登録です。</div>';
    }

    function scheduleForm(sc) {
        sc = sc || { date: todayStr(), items: [] };
        var areas = T.areaNames();
        function itemRow(i, idx) {
            i = i || { time: '', endTime: '', title: '', area: '' };
            return '<div class="row" data-item="' + idx + '">' +
                '<div class="f-inline">' +
                  '<div class="f-group"><label>開始</label><input type="time" class="i-time" value="' + esc(i.time) + '"></div>' +
                  '<div class="f-group"><label>終了</label><input type="time" class="i-end" value="' + esc(i.endTime) + '"></div>' +
                '</div>' +
                '<div class="f-inline">' +
                  '<div class="f-group"><label>予定名</label><input type="text" class="i-title" value="' + esc(i.title) + '" placeholder="例: 心斎橋PARCO"></div>' +
                  '<div class="f-group"><label>エリア</label><select class="i-area"><option value="">選択</option>' +
                    areas.map(function (a) { return '<option' + (a === i.area ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
                '</div>' +
                '<button class="btn btn-small btn-danger i-del">この予定を削除</button>' +
            '</div>';
        }
        dlgBody.innerHTML =
            '<h2>' + (sc.id ? '予定を編集' : '外出予定を登録') + '</h2>' +
            '<div class="f-group"><label>日付 *</label><input type="date" id="s-date" value="' + esc(sc.date) + '"></div>' +
            '<h3>スケジュール</h3>' +
            '<div id="item-list">' + (sc.items || []).map(itemRow).join('') + '</div>' +
            '<button class="btn btn-small" id="btn-add-item">＋ 予定を追加</button>' +
            '<div class="dlg-actions">' +
              (sc.id ? '<button class="btn btn-danger" id="btn-del-sched">削除</button>' : '') +
              '<button class="btn" id="btn-cancel">閉じる</button>' +
              '<button class="btn btn-gold" id="btn-save-sched">保存</button>' +
            '</div>';

        var itemList = document.getElementById('item-list');
        document.getElementById('btn-add-item').addEventListener('click', function () {
            itemList.insertAdjacentHTML('beforeend', itemRow(null, itemList.children.length));
        });
        itemList.addEventListener('click', function (e) {
            if (e.target.classList.contains('i-del')) e.target.closest('.row').remove();
        });
        document.getElementById('btn-cancel').addEventListener('click', function () { dlg.close(); });
        if (sc.id) {
            document.getElementById('btn-del-sched').addEventListener('click', function () {
                if (confirm('この予定を削除しますか？')) { S.deleteSchedule(sc.id); dlg.close(); render(); }
            });
        }
        document.getElementById('btn-save-sched').addEventListener('click', function () {
            var date = document.getElementById('s-date').value;
            if (!date) { alert('日付は必須です'); return; }
            var items = [];
            itemList.querySelectorAll('.row').forEach(function (r) {
                var time = r.querySelector('.i-time').value;
                var title = r.querySelector('.i-title').value.trim();
                var area = r.querySelector('.i-area').value;
                if (time || title) items.push({
                    time: time, endTime: r.querySelector('.i-end').value,
                    title: title || '予定', area: area
                });
            });
            items.sort(function (a, b) { return (a.time || '') < (b.time || '') ? -1 : 1; });
            S.upsertSchedule({ id: sc.id || '', date: date, items: items });
            dlg.close();
            /* 保存後、その日の行動範囲で行けるイベントを自動検索（要件7） */
            currentTab = 'schedule';
            render();
            var saved = S.getScheduleByDate(date);
            if (saved) {
                var btn = view.querySelector('[data-act="scan-sched"][data-id="' + saved.id + '"]');
                if (btn) btn.click();
            }
        });
        dlg.showModal();
    }

    /* ---------- 設定 ---------- */
    function renderSettings() {
        var s = S.getSettings();
        var areas = T.areaNames();
        view.innerHTML =
            '<section class="sec"><div class="sec-title">基本設定</div>' +
            '<div class="row">' +
              '<div class="f-group"><label>拠点エリア（現在地の既定値）</label><select id="set-home">' +
                areas.map(function (a) { return '<option' + (a === s.homeArea ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
              '<div class="f-group"><label>検索範囲（予定地からの移動時間）</label><select id="set-range">' +
                [[10, '徒歩10分圏'], [30, '30分圏'], [60, '60分圏']].map(function (r) {
                    return '<option value="' + r[0] + '"' + (r[0] === s.searchRangeMin ? ' selected' : '') + '>' + r[1] + '</option>';
                }).join('') + '</select></div>' +
              '<div class="f-group"><label>推奨滞在時間（分）</label><select id="set-stay">' +
                [15, 20, 30, 45, 60].map(function (m) {
                    return '<option value="' + m + '"' + (m === (s.defaultStayMin || 30) ? ' selected' : '') + '>' + m + '分</option>';
                }).join('') + '</select></div>' +
              '<button class="btn btn-gold" id="btn-save-set">設定を保存</button>' +
            '</div></section>' +
            '<section class="sec"><div class="sec-title">データのバックアップ</div>' +
            '<div class="row">' +
              '<p class="settings-note">データはこの端末のブラウザ内にのみ保存されています。機種変更やブラウザ変更の前に必ずエクスポートしてください。</p>' +
              '<div class="card-actions"><button class="btn" id="btn-export">エクスポート</button><button class="btn" id="btn-import">インポート</button></div>' +
              '<textarea class="export-area" id="io-area" placeholder="エクスポートを押すとここにJSONが出ます。インポートはここに貼り付けてから押してください。"></textarea>' +
            '</div></section>' +
            '<section class="sec"><div class="sec-title">このアプリについて</div>' +
            '<div class="row"><p class="settings-note">推し活レーダーOS Phase 1（自分専用MVP）。<br>' +
            '通知（プッシュ）は静的サイトの制約で未対応のため、外出予定がある日はアプリを開いて「今日の推し活チャンス」を確認してください。<br>' +
            '設計仕様: docs/OSHI_RADAR_SPEC.md</p></div></section>';

        document.getElementById('btn-save-set').addEventListener('click', function () {
            S.saveSettings({
                homeArea: document.getElementById('set-home').value,
                searchRangeMin: +document.getElementById('set-range').value,
                defaultStayMin: +document.getElementById('set-stay').value
            });
            alert('保存しました');
        });
        document.getElementById('btn-export').addEventListener('click', function () {
            document.getElementById('io-area').value = S.exportJson();
        });
        document.getElementById('btn-import').addEventListener('click', function () {
            var text = document.getElementById('io-area').value.trim();
            if (!text) { alert('インポートするJSONを貼り付けてください'); return; }
            if (!confirm('現在のデータを貼り付けた内容で置き換えます。よろしいですか？')) return;
            try { S.importJson(text); alert('インポートしました'); render(); }
            catch (e) { alert('インポートに失敗しました: ' + e.message); }
        });
    }

    /* ---------- ルーティング ---------- */
    function render() {
        if (currentTab === 'home') renderHome();
        else if (currentTab === 'events') renderEvents();
        else if (currentTab === 'oshi') renderOshi();
        else if (currentTab === 'schedule') renderSchedule();
        else renderSettings();
    }

    document.getElementById('tabbar').addEventListener('click', function (e) {
        var btn = e.target.closest('.tab');
        if (!btn) return;
        currentTab = btn.dataset.tab;
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t === btn); });
        render();
        window.scrollTo(0, 0);
    });

    /* カード内アクション（イベント共通・委譲） */
    view.addEventListener('click', function (e) {
        var el = e.target.closest('[data-act]');
        if (!el) return;
        var act = el.dataset.act, id = el.dataset.id;
        if (act === 'judge') {
            var slot = el.closest('.card').querySelector('.judge-slot');
            runJudge(id, slot);
        } else if (act === 'edit-ev') eventForm(S.getEvent(id));
        else if (act === 'add-ev') eventForm(null);
        else if (act === 'edit-oshi') oshiForm(S.getOshi(id));
        else if (act === 'add-oshi') oshiForm(null);
        else if (act === 'add-sched') scheduleForm(null);
        else if (act === 'edit-sched') scheduleForm(S.listSchedules().find(function (s) { return s.id === id; }));
        else if (act === 'scan-sched') {
            var sc = S.listSchedules().find(function (s) { return s.id === id; });
            var slot2 = el.closest('.row').querySelector('.scan-slot');
            if (sc && slot2) scanSchedule(sc, slot2);
        }
    });

    render();
})();
