/* 推し活レーダーOS データ層
   localStorage 単一キーに保存。読み書きはこのモジュール経由に限定し、
   将来 GAS/Supabase 等へ差し替える際もこのAPIを維持する。 */
(function (global) {
    'use strict';

    var KEY = 'oshiRadar.v1';

    function uid(prefix) {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function nowIso() { return new Date().toISOString(); }

    /* ---- 初期データ（シード） ----
       イベントのシードは「使い方が分かる見本」であり、開催情報の断定ではない。
       非公式ソースのみのため【要確認】として表示される。 */
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

    function load() {
        if (cache) return cache;
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                cache = JSON.parse(raw);
                if (!cache.settings) cache.settings = seedData().settings;
                if (!cache.oshi) cache.oshi = [];
                if (!cache.events) cache.events = [];
                if (!cache.schedules) cache.schedules = [];
                return cache;
            }
        } catch (e) {
            console.error('storage load error', e);
        }
        cache = seedData();
        save();
        return cache;
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(cache));
        } catch (e) {
            console.error('storage save error', e);
            alert('保存に失敗しました。端末の空き容量を確認してください。');
        }
    }

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
        return oshi;
    }
    function deleteOshi(id) {
        var db = load();
        db.oshi = db.oshi.filter(function (o) { return o.id !== id; });
        db.events.forEach(function (ev) {
            ev.oshiLinks = (ev.oshiLinks || []).filter(function (l) { return l.oshiId !== id; });
        });
        save();
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
        return ev;
    }
    function deleteEvent(id) {
        var db = load();
        db.events = db.events.filter(function (e) { return e.id !== id; });
        save();
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
        return sc;
    }
    function deleteSchedule(id) {
        var db = load();
        db.schedules = db.schedules.filter(function (s) { return s.id !== id; });
        save();
    }

    /* ---- 設定 ---- */
    function getSettings() { return load().settings; }
    function saveSettings(s) { load().settings = s; save(); }

    /* ---- バックアップ ---- */
    function exportJson() { return JSON.stringify(load(), null, 2); }
    function importJson(text) {
        var data = JSON.parse(text); /* 不正JSONはここで例外 */
        if (!data || data.version !== 1) throw new Error('対応していないデータ形式です');
        cache = data;
        save();
    }

    global.OshiStore = {
        load: load, save: save, uid: uid, nowIso: nowIso,
        listOshi: listOshi, getOshi: getOshi, upsertOshi: upsertOshi, deleteOshi: deleteOshi,
        listEvents: listEvents, getEvent: getEvent, upsertEvent: upsertEvent,
        deleteEvent: deleteEvent, findDuplicate: findDuplicate,
        listSchedules: listSchedules, getScheduleByDate: getScheduleByDate,
        upsertSchedule: upsertSchedule, deleteSchedule: deleteSchedule,
        getSettings: getSettings, saveSettings: saveSettings,
        exportJson: exportJson, importJson: importJson
    };
})(window);
