/* 推し活レーダーOS 判定ロジック
   スコアリング（100点）・通知レベル・「今から行ける」判定エンジン。
   仕様は docs/OSHI_RADAR_SPEC.md STEP5/STEP6 に準拠。 */
(function (global) {
    'use strict';

    var Travel = global.OshiTravel;

    /* ---- 日付ユーティリティ（すべてローカル時刻基準） ---- */
    function toDateStr(d) {
        var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2);
        return y + '-' + m + '-' + day;
    }
    function parseDate(s) {
        if (!s) return null;
        var p = s.split('-');
        return new Date(+p[0], +p[1] - 1, +p[2]);
    }
    function daysBetween(fromStr, toStr) {
        var a = parseDate(fromStr), b = parseDate(toStr);
        if (!a || !b) return null;
        return Math.round((b - a) / 86400000);
    }
    function timeToMin(t) {
        if (!t) return null;
        var p = t.split(':');
        return (+p[0]) * 60 + (+p[1] || 0);
    }
    function minToTime(m) {
        m = Math.round(m);
        var h = Math.floor(m / 60) % 24, mm = m % 60;
        return h + ':' + ('0' + mm).slice(-2);
    }

    /* ---- 情報の公式性（要件5） ---- */
    function hasOfficialSource(ev) {
        return (ev.sources || []).some(function (s) { return s.official; });
    }
    function needsVerification(ev) { return !hasOfficialSource(ev); }

    /* ---- イベントの開催状態 ---- */
    function eventDayState(ev, todayStr) {
        if (!ev.startDate) return 'unknown';
        var start = daysBetween(todayStr, ev.startDate); /* 正なら未来 */
        var end = ev.endDate ? daysBetween(todayStr, ev.endDate) : start;
        if (end != null && end < 0) return 'ended';
        if (start != null && start > 0) return 'upcoming';
        return 'ongoing';
    }

    /* ---- スコアリング（STEP5） ---- */
    function oshiMatchScore(ev, oshiList) {
        var pts = { '本人': 40, 'グループ': 35, 'コラボ': 30, '関連作品': 20 };
        var best = 0, bestOshi = null;
        (ev.oshiLinks || []).forEach(function (l) {
            var p = pts[l.matchType] || 0;
            if (p > best) {
                best = p;
                bestOshi = oshiList.find(function (o) { return o.id === l.oshiId; }) || null;
            }
        });
        return { points: best, oshi: bestOshi };
    }

    function dateScore(ev, todayStr) {
        var state = eventDayState(ev, todayStr);
        if (state === 'ended') return 0;
        if (state === 'ongoing') return 25;
        var d = daysBetween(todayStr, ev.startDate);
        if (d === 1) return 22;
        if (d <= 3) return 18;
        if (d <= 7) return 12;
        return 5;
    }

    function distanceScore(travelMin) {
        if (travelMin == null || travelMin >= 999) return 2;
        if (travelMin <= 10) return 20;
        if (travelMin <= 15) return 18;
        if (travelMin <= 30) return 15;
        if (travelMin <= 60) return 8;
        return 2;
    }

    function urgencyScore(ev, todayStr) {
        if (!ev.endDate) return 3;
        var d = daysBetween(todayStr, ev.endDate);
        if (d == null || d < 0) return 0;
        if (d === 0) return 15;
        if (d <= 3) return 12;
        if (d <= 7) return 8;
        return 3;
    }

    /* baseArea: 距離の基準（今日の予定エリア > 拠点エリア） */
    function scoreEvent(ev, ctx) {
        var todayStr = ctx.todayStr;
        var travelMin = Travel.minutesBetween(ctx.baseArea, ev.area);
        var m = oshiMatchScore(ev, ctx.oshiList);
        var s = {
            oshi: m.points,
            date: dateScore(ev, todayStr),
            distance: distanceScore(travelMin),
            urgency: urgencyScore(ev, todayStr)
        };
        s.total = s.oshi + s.date + s.distance + s.urgency;
        s.travelMin = travelMin;
        s.matchedOshi = m.oshi;
        return s;
    }

    /* ---- 通知レベル（要件11） ---- */
    function notifyLevel(total) {
        if (total >= 90) return { key: 'must',  label: '🔥絶対チェック' };
        if (total >= 80) return { key: 'warn',  label: '🔥見逃し注意' };
        if (total >= 60) return { key: 'reco',  label: '⭐おすすめ' };
        if (total >= 40) return { key: 'near',  label: '💡近くなら' };
        return { key: 'normal', label: '' };
    }

    /* ---- 見逃し防止ブースト（要件17）
       A: 最推し(priority1) + 30分以内
       B: 最推し + 今日/明日終了
       C: 予定地と同都市 + 開催中
       D: 30分以内 + 次予定まで90分以上の空き */
    function missPreventionBoost(ev, score, ctx) {
        var reasons = [];
        var isTopOshi = score.matchedOshi && score.matchedOshi.priority === 1;
        var near = score.travelMin != null && score.travelMin <= 30;
        var endsSoon = ev.endDate && daysBetween(ctx.todayStr, ev.endDate) <= 1 && daysBetween(ctx.todayStr, ev.endDate) >= 0;
        var ongoing = eventDayState(ev, ctx.todayStr) === 'ongoing';
        if (isTopOshi && near) reasons.push('最推し × 現在地から30分以内');
        if (isTopOshi && endsSoon) reasons.push('最推し × まもなく終了');
        if (ctx.scheduleRegion && Travel.regionOf(ev.area) === ctx.scheduleRegion && ongoing) reasons.push('予定地と同じ都市で開催中');
        if (near && ctx.freeGapMin != null && ctx.freeGapMin >= 90) reasons.push('30分以内 × 空き時間90分以上');
        return reasons;
    }

    /* ---- 「今から行ける」判定エンジン（STEP6） ----
       返り値: { verdict: '◎'|'○'|'△'|'×'|'?', label, timeline[], notes[] } */
    function judgeNow(ev, opts) {
        var nowMin = opts.nowMin;               /* 現在時刻（分） */
        var fromArea = opts.fromArea;           /* 現在エリア */
        var next = opts.next || null;           /* {startMin, area, title} 次の予定 */
        var stay = opts.stayMin || 30;          /* 推奨滞在 */
        var notes = [], timeline = [];

        var travelTo = Travel.minutesBetween(fromArea, ev.area);
        if (travelTo == null || travelTo >= 999) {
            return { verdict: '?', label: '移動時間不明', timeline: [], notes: ['エリア「' + (ev.area || '未設定') + '」への移動時間が算出できません。イベントのエリア設定を確認してください。'] };
        }

        if (ev.needsReservation && !ev.freeEntry) {
            notes.push('事前予約制です。予約状況を必ず確認してください。');
        }
        if (ev.needsNumberedTicket) {
            notes.push('整理券が必要な場合があります。フリー入場時間帯を確認してください。');
        }

        /* 入場開始（フリー入場開始 or 開場）が先の場合は、それに合わせて出発を遅らせる */
        var gate = timeToMin(ev.freeEntryFrom) != null ? timeToMin(ev.freeEntryFrom) : timeToMin(ev.openTime);
        var departAt = nowMin;
        if (gate != null && gate - travelTo > nowMin) {
            departAt = gate - travelTo;
            notes.push('入場開始（' + minToTime(gate) + '）に合わせて ' + minToTime(departAt) + ' 出発の計画です。');
        }
        var arrive = departAt + travelTo;
        var entry = gate != null ? Math.max(arrive, gate) : arrive;

        var lastIn = timeToMin(ev.lastEntry);
        var close = timeToMin(ev.closeTime);
        var hardLimit = null;
        if (lastIn != null) hardLimit = lastIn;
        if (close != null) hardLimit = hardLimit == null ? close - 15 : Math.min(hardLimit, close - 15);

        if (hardLimit != null && entry > hardLimit) {
            return {
                verdict: '×', label: '難しい（入場時間に間に合いません）',
                timeline: [minToTime(departAt) + ' 出発 → ' + minToTime(arrive) + ' 到着（最終入場 ' + minToTime(hardLimit) + ' を超過）'],
                notes: notes
            };
        }

        function buildTimeline(stayMin) {
            var leave = entry + stayMin;
            if (close != null && leave > close) leave = close;
            var tl = [
                minToTime(departAt) + ' 出発（' + fromArea + '）',
                minToTime(arrive) + ' 到着（' + (ev.venue || ev.area) + '・移動約' + travelTo + '分）'
            ];
            if (entry > arrive) tl.push(minToTime(entry) + ' 入場');
            tl.push(minToTime(leave) + ' 退店');
            return { tl: tl, leave: leave };
        }

        if (!next || next.startMin == null) {
            var t0 = buildTimeline(stay);
            return { verdict: '◎', label: '行けます（この後の予定はありません）', timeline: t0.tl, notes: notes };
        }

        var travelNext = Travel.minutesBetween(ev.area, next.area);
        if (travelNext == null || travelNext >= 999) { travelNext = 30; notes.push('次予定への移動時間が不明なため30分と仮定しています。'); }

        function slackWithStay(stayMin) {
            var b = buildTimeline(stayMin);
            var arriveNext = b.leave + travelNext;
            return { slack: next.startMin - arriveNext, build: b, arriveNext: arriveNext };
        }

        var full = slackWithStay(stay);
        var verdict, label, chosen = full;
        if (full.slack >= 30) { verdict = '◎'; label = '行けます（余裕あり）'; }
        else if (full.slack >= 10) { verdict = '○'; label = '行ける可能性が高い（少し時間制約あり）'; }
        else if (full.slack >= 0) { verdict = '△'; label = 'タイト（移動は迷わず・滞在短めに）'; }
        else {
            var short = slackWithStay(15);
            if (short.slack >= 0) {
                verdict = '△'; label = 'タイト（滞在15分に短縮なら間に合います）'; chosen = short;
            } else {
                verdict = '×'; label = '難しい（次の予定に間に合いません）'; chosen = full;
            }
        }

        var tl = chosen.build.tl.slice();
        tl.push(minToTime(chosen.arriveNext) + ' ' + (next.title || '次の予定') + '（' + next.area + '・開始 ' + minToTime(next.startMin) + '）');
        return { verdict: verdict, label: label, timeline: tl, notes: notes };
    }

    /* 今日の予定から「今の空き時間」と「次の予定」を推定する */
    function currentContextFromSchedule(schedule, nowMin, homeArea) {
        var ctx = { fromArea: homeArea, next: null, freeGapMin: null, region: null };
        if (!schedule || !schedule.items || !schedule.items.length) return ctx;
        var items = schedule.items.slice().sort(function (a, b) {
            return timeToMin(a.time) - timeToMin(b.time);
        });
        ctx.region = Travel.regionOf(items[0].area) || null;
        var current = null, next = null;
        for (var i = 0; i < items.length; i++) {
            var st = timeToMin(items[i].time);
            var en = timeToMin(items[i].endTime) != null ? timeToMin(items[i].endTime) : st;
            if (st <= nowMin) current = items[i];
            if (st > nowMin) { next = items[i]; break; }
        }
        if (current) ctx.fromArea = current.area || ctx.fromArea;
        if (next) {
            ctx.next = { startMin: timeToMin(next.time), area: next.area || ctx.fromArea, title: next.title };
            ctx.freeGapMin = ctx.next.startMin - nowMin;
        }
        return ctx;
    }

    global.OshiLogic = {
        toDateStr: toDateStr, parseDate: parseDate, daysBetween: daysBetween,
        timeToMin: timeToMin, minToTime: minToTime,
        hasOfficialSource: hasOfficialSource, needsVerification: needsVerification,
        eventDayState: eventDayState,
        scoreEvent: scoreEvent, notifyLevel: notifyLevel,
        missPreventionBoost: missPreventionBoost,
        judgeNow: judgeNow,
        currentContextFromSchedule: currentContextFromSchedule
    };
})(window);
