/* ぼぅ 投稿スタジオ リサーチ・投稿戦略ページの配線 */
(function () {
    'use strict';

    var store = window.BouStore;

    function $(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    function toast(msg) {
        var el = $('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
    }
    function fmtDate(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
    }

    var ACCOUNT_FIELDS = [
        ['name', 'アカウント名'], ['genre', 'ジャンル'], ['followers', 'フォロワー規模（概算）'],
        ['formats', '主な投稿形式・比率'], ['freq', '投稿頻度'], ['text', '文字量'],
        ['show', 'キャラクターの見せ方'], ['bg', '背景の使い方'], ['themes', '投稿テーマ'],
        ['emotions', 'よく使われる感情'], ['save', '保存されやすい傾向'], ['share', 'シェアされやすい傾向'],
        ['comment', 'コメントが付きやすい傾向'], ['follow', 'フォローしたくなる要素'],
        ['world', '世界観の統一方法'], ['clarity', '初見で内容が伝わる工夫'], ['series', 'シリーズ化の方法']
    ];

    var state = { genreFilter: 'all', editingIndex: null };

    /* ================= リサーチ：参考アカウント ================= */

    function renderResearchNote() {
        var r = store.getResearch();
        $('research-note').textContent = r.note + '（初期データ ' + r.updated_at + ' 時点・' + r.accounts.length + '件）';
    }

    function renderGenreFilter() {
        var r = store.getResearch();
        var genres = {};
        r.accounts.forEach(function (a) { genres[a.genre] = true; });
        var box = $('genre-filter');
        box.innerHTML = '';
        ['all'].concat(Object.keys(genres)).forEach(function (g) {
            var b = document.createElement('button');
            b.className = 'filter-btn' + (state.genreFilter === g ? ' active' : '');
            b.textContent = g === 'all' ? 'すべて' : g;
            b.addEventListener('click', function () { state.genreFilter = g; renderGenreFilter(); renderAccountTable(); });
            box.appendChild(b);
        });
    }

    function renderAccountTable() {
        var r = store.getResearch();
        var tbody = $('account-table').querySelector('tbody');
        tbody.innerHTML = '';
        r.accounts.forEach(function (a, idx) {
            if (state.genreFilter !== 'all' && a.genre !== state.genreFilter) return;
            var tr = document.createElement('tr');
            tr.innerHTML = '<td>' + esc(a.name) + '</td><td>' + esc(a.genre) + '</td><td>' + esc(a.followers) +
                '</td><td>' + esc(a.formats) + '</td><td>' + esc(a.freq) + '</td>';
            tr.addEventListener('click', function () { openAccountDetail(idx); });
            tbody.appendChild(tr);
        });
    }

    function openAccountDetail(index) {
        var r = store.getResearch();
        var a = index === null ? {} : r.accounts[index];
        state.editingIndex = index;
        var box = $('account-detail');
        var html = '<div class="page-card" style="margin-top:12px"><div class="page-card-head">' +
            '<span class="chip theme">' + (index === null ? '新しいアカウント' : esc(a.name)) + '</span><span class="spacer"></span>' +
            (index !== null ? '<button class="btn btn-ghost" id="acc-del-btn">削除</button>' : '') +
            '<button class="btn btn-ghost" id="acc-close-btn">閉じる</button></div>';
        ACCOUNT_FIELDS.forEach(function (f) {
            html += '<div class="field"><label>' + f[1] + '</label>' +
                '<textarea data-acc-field="' + f[0] + '" style="min-height:44px">' + esc(a[f[0]] || '') + '</textarea></div>';
        });
        html += '<button class="btn btn-select" id="acc-save-btn">保存</button></div>';
        box.innerHTML = html;

        $('acc-save-btn').addEventListener('click', function () {
            var research = store.getResearch();
            var record = {};
            box.querySelectorAll('[data-acc-field]').forEach(function (el) { record[el.dataset.accField] = el.value.trim(); });
            if (!record.name) { toast('アカウント名を入れてください'); return; }
            if (state.editingIndex === null) research.accounts.push(record);
            else research.accounts[state.editingIndex] = record;
            store.saveResearch(research);
            toast('保存しました');
            box.innerHTML = '';
            renderResearchNote(); renderGenreFilter(); renderAccountTable();
        });
        $('acc-close-btn').addEventListener('click', function () { box.innerHTML = ''; });
        var del = $('acc-del-btn');
        if (del) del.addEventListener('click', function () {
            if (!confirm('このアカウントをリストから削除しますか？')) return;
            var research = store.getResearch();
            research.accounts.splice(state.editingIndex, 1);
            store.saveResearch(research);
            box.innerHTML = '';
            toast('削除しました');
            renderResearchNote(); renderGenreFilter(); renderAccountTable();
        });
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    $('add-account-btn').addEventListener('click', function () { openAccountDetail(null); });
    $('reset-research-btn').addEventListener('click', function () {
        if (!confirm('リサーチデータを初期状態に戻します。手動で追加・編集した内容は消えます。よろしいですか？')) return;
        store.resetResearch();
        toast('初期データに戻しました');
        renderResearchNote(); renderGenreFilter(); renderAccountTable();
        renderPatterns(); renderConversion();
    });

    /* ================= リサーチ：パターン分析 ================= */

    function listBlock(title, items, cls) {
        if (!items || !items.length) return '';
        var html = '<div class="pattern-block' + (cls ? ' ' + cls : '') + '"><h3>' + esc(title) + '</h3><ul>';
        items.forEach(function (it) { html += '<li>' + esc(it) + '</li>'; });
        return html + '</ul></div>';
    }

    function renderPatterns() {
        var p = store.getResearch().patterns;
        var r = store.getResearch();
        $('pattern-analysis').innerHTML =
            listBlock('1枚目のフック（型）', p.hooks) +
            listBlock('最初の1秒で伝わる工夫', p.firstSecond) +
            listBlock('文字量・形式・構図の傾向', p.textAndForm) +
            listBlock('保存されやすい構成', p.whySave) +
            listBlock('シェアされやすい構成', p.whyShare) +
            listBlock('コメントが付きやすい構成', p.whyComment) +
            listBlock('フォローされる理由', p.whyFollow) +
            listBlock('伸びる可能性が高い要素', p.growing, 'good') +
            listBlock('使いすぎると飽きられる要素', p.fatigue, 'warn') +
            listBlock('ぼぅには合わない要素', p.notForBou, 'bad') +
            listBlock('ぼぅに使える要素', r.bouUsable, 'good') +
            listBlock('ぼぅには使わない要素', r.bouAvoid, 'bad') +
            listBlock('今後試すべき投稿フォーマット', p.futureFormats);
    }

    function renderConversion() {
        var conv = store.getResearch().conversion || [];
        var html = '';
        conv.forEach(function (c) {
            html += '<div class="conv-row"><div class="conv-from">' + esc(c.from) + '</div>' +
                '<div class="conv-arrow">→</div><div class="conv-to">' + esc(c.to) + '</div></div>';
        });
        $('conversion-rules').innerHTML = html;
    }

    /* ================= リサーチ：定期記録 ================= */

    function renderResearchLog() {
        var log = store.getResearchLog();
        var ul = $('rlog-list');
        ul.innerHTML = log.length ? '' : '<li>まだ記録がありません。</li>';
        log.forEach(function (e) {
            var li = document.createElement('li');
            li.textContent = fmtDate(e.at) + '：' + e.note + (e.diff ? '｜差分: ' + e.diff : '');
            ul.appendChild(li);
        });
    }

    $('rlog-add-btn').addEventListener('click', function () {
        var note = $('rlog-note').value.trim();
        var diff = $('rlog-diff').value.trim();
        if (!note) { toast('調査メモを入れてください'); return; }
        store.addResearchLog({ note: note, diff: diff });
        $('rlog-note').value = ''; $('rlog-diff').value = '';
        toast('リサーチを記録しました');
        renderResearchLog();
    });

    /* ================= 投稿戦略 ================= */

    var STRATEGY_FIELDS = ['positioning', 'audience', 'followReasons', 'growThemes', 'holdThemes', 'nextFormats', 'weeklyPolicy', 'monthlyExperiment'];

    function renderPhase() {
        var research = store.getResearch();
        var strategy = store.getStrategy();
        var box = $('phase-buttons');
        box.innerHTML = '';
        research.phases.forEach(function (ph) {
            var b = document.createElement('button');
            b.className = 'filter-btn' + (strategy.phase === ph.id ? ' active' : '');
            b.textContent = 'Phase ' + ph.id + '（' + ph.range + '）';
            b.addEventListener('click', function () {
                var s = store.getStrategy();
                s.phase = ph.id;
                store.saveStrategy(s);
                toast('Phase ' + ph.id + ' に切り替えました');
                renderPhase();
            });
            box.appendChild(b);
        });
        var current = research.phases.filter(function (ph) { return ph.id === strategy.phase; })[0];
        if (!current) { $('phase-detail').innerHTML = ''; return; }
        var rows = [
            ['目的', current.goal], ['投稿頻度', current.freq], ['投稿テーマ', current.themes],
            ['カルーセル比率', current.carouselRatio], ['リール比率', current.reelRatio],
            ['シリーズ投稿', current.series], ['コメント誘導', current.commentCta], ['ファン参加型施策', current.fanActivity]
        ];
        var html = '<div class="page-card" style="margin-top:10px">';
        rows.forEach(function (row) {
            html += '<div class="phase-row"><span class="phase-label">' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
        });
        $('phase-detail').innerHTML = html + '</div>';
    }

    function renderStrategyForm() {
        var s = store.getStrategy();
        STRATEGY_FIELDS.forEach(function (f) { $('st-' + f).value = s[f] || ''; });
    }

    $('save-strategy-btn').addEventListener('click', function () {
        var s = store.getStrategy();
        STRATEGY_FIELDS.forEach(function (f) { s[f] = $('st-' + f).value.trim(); });
        store.saveStrategy(s);
        toast('戦略を保存しました。次の生成から反映されます');
    });

    function statRows(map) {
        var keys = Object.keys(map);
        if (!keys.length) return '<p class="hint">まだデータがありません。採用・不採用が増えると集計されます。</p>';
        keys.sort(function (a, b) { return (map[b].adopted + map[b].rejected) - (map[a].adopted + map[a].rejected); });
        var html = '<div class="table-wrap"><table class="research-table"><thead><tr><th></th><th>採用</th><th>不採用</th></tr></thead><tbody>';
        keys.forEach(function (k) {
            html += '<tr><td>' + esc(k) + '</td><td>' + map[k].adopted + '</td><td>' + map[k].rejected + '</td></tr>';
        });
        return html + '</tbody></table></div>';
    }

    function renderStrategyStats() {
        var adoption = store.getAdoptionStats();
        var usage = store.getUsageStats();
        var html = '<h3 class="stat-h">投稿タイプ別（A=王道共感/B=本質/C=保存・シェア）</h3>' + statRows(adoption.byType) +
            '<h3 class="stat-h">テーマ別</h3>' + statRows(adoption.byTheme);
        html += '<h3 class="stat-h">使いすぎ注意（直近' + usage.sampleSize + '件）</h3>';
        var warn = [];
        usage.overusedThemes.forEach(function (t) { warn.push('テーマ「' + t.key + '」×' + t.count); });
        usage.overusedScenes.forEach(function (s) { warn.push('シーン「' + s.key + '」×' + s.count); });
        usage.overusedEndings.forEach(function (e) { warn.push('語尾「' + e.key + '」×' + e.count); });
        html += warn.length
            ? '<div class="chips">' + warn.map(function (w) { return '<span class="chip ng">' + esc(w) + '</span>'; }).join('') + '</div>'
            : '<p class="hint">いまのところ偏りはありません。生成時にも自動で分散させています。</p>';
        $('strategy-stats').innerHTML = html;
    }

    /* タブが開かれるたびに最新の集計を出す */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.dataset.view === 'strategy') { renderPhase(); renderStrategyForm(); renderStrategyStats(); }
            if (btn.dataset.view === 'research') { renderResearchLog(); }
        });
    });

    /* ================= 初期表示 ================= */
    renderResearchNote();
    renderGenreFilter();
    renderAccountTable();
    renderPatterns();
    renderConversion();
    renderResearchLog();
    renderPhase();
    renderStrategyForm();
    renderStrategyStats();
})();
