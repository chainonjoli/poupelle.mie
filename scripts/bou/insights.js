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
        ['name', 'アカウント名'], ['genre', 'ジャンル'],
        ['followers', 'フォロワー数（確認済みの実数のみ。未確認なら「未確認」）'],
        ['followers_est', '参考推定メモ（未確認の数値・レンジはこちらに分離）'],
        ['source_name', '出所（source_name）'], ['source_url', '出所URL（source_url）'],
        ['checked_at', '確認日（checked_at・例 2026-08-29）'],
        ['formats', '主な投稿形式・比率'], ['freq', '投稿頻度'], ['text', '文字量'],
        ['show', 'キャラクターの見せ方'], ['bg', '背景の使い方'], ['themes', '投稿テーマ'],
        ['emotions', 'よく使われる感情'], ['save', '保存されやすい傾向'], ['share', 'シェアされやすい傾向'],
        ['comment', 'コメントが付きやすい傾向'], ['follow', 'フォローしたくなる要素'],
        ['world', '世界観の統一方法'], ['clarity', '初見で内容が伝わる工夫'], ['series', 'シリーズ化の方法']
    ];

    var DATA_TYPES = [
        ['verified', '確認済み（実測）'], ['estimated', '推定・未確認'],
        ['manual', '手動入力'], ['placeholder', '要調査枠']
    ];
    var DATA_TYPE_LABEL = { verified: '確認済み', estimated: '未確認・推定', manual: '手動入力', placeholder: '要調査枠' };

    var STRUCTURE_FIELDS = [
        ['theme', 'よく合う投稿テーマ'], ['hook', '1枚目のフック（どう止めるか）'],
        ['carousel', 'カルーセル構造（枚数・展開・着地）'], ['textAmount', '文章量（文字数・改行・強弱）'],
        ['empathy', '共感の作り方（断定しない・代弁・教訓化しない）'], ['afterFeel', '読後感'],
        ['charRole', 'キャラクターの役割'], ['scene', 'シーン'],
        ['extraction', 'なぜ刺さるか（構造抽出）'], ['bouConversion', 'ぼぅへの変換例（構造だけ使う）'],
        ['source_note', '参考元メモ（表現はコピーしない）']
    ];

    var state = { genreFilter: 'all', editingIndex: null, structFilter: 'all', editingStructIndex: null };

    /* ================= リサーチ：投稿構造ライブラリ ================= */

    function renderStructureFilter() {
        var r = store.getResearch();
        var box = $('structure-filter');
        box.innerHTML = '';
        ['all'].concat(r.structureTypes || []).forEach(function (t) {
            var b = document.createElement('button');
            b.className = 'filter-btn' + (state.structFilter === t ? ' active' : '');
            b.textContent = t === 'all' ? 'すべて' : t;
            b.addEventListener('click', function () { state.structFilter = t; renderStructureFilter(); renderStructureList(); });
            box.appendChild(b);
        });
    }

    function renderStructureList() {
        var r = store.getResearch();
        var box = $('structure-list');
        box.innerHTML = '';
        (r.structures || []).forEach(function (s, idx) {
            if (state.structFilter !== 'all' && s.type !== state.structFilter) return;
            var el = document.createElement('div');
            el.className = 'structure-card';
            el.innerHTML =
                '<div class="chips"><span class="chip theme">' + esc(s.type) + '</span>' +
                (s.isBaseline ? '<span class="chip">★ 生成の基準にする</span>' : '') +
                '<span class="badge-data ' + esc(s.data_type || 'manual') + '">' + (DATA_TYPE_LABEL[s.data_type] || '手動入力') + '</span></div>' +
                '<div class="structure-hook">' + esc(s.hook || '') + '</div>' +
                '<div class="structure-flow"><span class="conv-from">' + esc(s.extraction || '') + '</span>' +
                '<span class="conv-arrow">→</span><span class="conv-to">' + esc(s.bouConversion || '') + '</span></div>';
            el.addEventListener('click', function () { openStructureDetail(idx); });
            box.appendChild(el);
        });
        if (!box.children.length) box.innerHTML = '<p class="hint">この型の構造はまだありません。</p>';
    }

    function openStructureDetail(index) {
        var r = store.getResearch();
        var s = index === null ? {} : (r.structures || [])[index] || {};
        state.editingStructIndex = index;
        var box = $('structure-detail');
        var html = '<div class="page-card" style="margin-top:12px"><div class="page-card-head">' +
            '<span class="chip theme">' + (index === null ? '新しい構造' : esc(s.type || '')) + '</span><span class="spacer"></span>' +
            (index !== null ? '<button class="btn btn-ghost" id="struct-del-btn">削除</button>' : '') +
            '<button class="btn btn-ghost" id="struct-close-btn">閉じる</button></div>' +
            '<div class="field"><label>投稿の型</label><select id="struct-type">' +
            (r.structureTypes || []).map(function (t) {
                return '<option value="' + esc(t) + '"' + (s.type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
            }).join('') + '</select></div>';
        STRUCTURE_FIELDS.forEach(function (f) {
            html += '<div class="field"><label>' + f[1] + '</label>' +
                '<textarea data-struct-field="' + f[0] + '" style="min-height:44px">' + esc(s[f[0]] || '') + '</textarea></div>';
        });
        html += '<button class="btn btn-select" id="struct-save-btn">保存</button></div>';
        box.innerHTML = html;

        $('struct-save-btn').addEventListener('click', function () {
            var research = store.getResearch();
            var record = state.editingStructIndex === null ? { data_type: 'manual', id: 'st-' + Date.now().toString(36) }
                : research.structures[state.editingStructIndex];
            box.querySelectorAll('[data-struct-field]').forEach(function (el) { record[el.dataset.structField] = el.value.trim(); });
            record.type = $('struct-type').value;
            if (!record.extraction || !record.bouConversion) { toast('「なぜ刺さるか」と「ぼぅへの変換例」は必須です'); return; }
            if (state.editingStructIndex === null) research.structures.push(record);
            else research.structures[state.editingStructIndex] = record;
            store.saveResearch(research);
            toast('構造を保存しました。次の生成から参照されます');
            box.innerHTML = '';
            renderStructureFilter(); renderStructureList();
        });
        $('struct-close-btn').addEventListener('click', function () { box.innerHTML = ''; });
        var del = $('struct-del-btn');
        if (del) del.addEventListener('click', function () {
            if (!confirm('この構造をライブラリから削除しますか？')) return;
            var research = store.getResearch();
            research.structures.splice(state.editingStructIndex, 1);
            store.saveResearch(research);
            box.innerHTML = '';
            toast('削除しました');
            renderStructureFilter(); renderStructureList();
        });
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ================= リサーチ：参考アカウント ================= */

    function renderResearchNote() {
        var r = store.getResearch();
        var counts = { verified: 0, estimated: 0, manual: 0, placeholder: 0 };
        r.accounts.forEach(function (a) { counts[a.data_type] = (counts[a.data_type] || 0) + 1; });
        $('research-note').innerHTML = esc(r.note) +
            '<span class="chips" style="margin-top:8px;display:flex">' +
            '<span class="badge-data verified">確認済み ' + counts.verified + '件</span>' +
            '<span class="badge-data estimated">未確認・推定 ' + counts.estimated + '件</span>' +
            '<span class="badge-data manual">手動入力 ' + counts.manual + '件</span>' +
            '<span class="badge-data placeholder">要調査枠 ' + counts.placeholder + '件</span></span>';
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
            if (!a.verified) tr.className = 'row-unverified';
            var followersCell = a.verified
                ? esc(a.followers) + (a.checked_at ? '<span class="cell-note">' + esc(a.checked_at) + '時点</span>' : '')
                : '未確認' + (a.followers_est ? '<span class="cell-note">' + esc(a.followers_est) + '</span>' : '');
            tr.innerHTML = '<td><span class="badge-data ' + esc(a.data_type) + '">' + (DATA_TYPE_LABEL[a.data_type] || a.data_type) + '</span></td>' +
                '<td>' + esc(a.name) + '</td><td>' + esc(a.genre) + '</td><td>' + followersCell +
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
        var dataType = a.data_type || (index === null ? 'manual' : 'estimated');
        var html = '<div class="page-card" style="margin-top:12px"><div class="page-card-head">' +
            '<span class="chip theme">' + (index === null ? '新しいアカウント（手動入力）' : esc(a.name)) + '</span>' +
            '<span class="badge-data ' + esc(dataType) + '">' + (DATA_TYPE_LABEL[dataType] || dataType) + '</span>' +
            '<span class="spacer"></span>' +
            (index !== null ? '<button class="btn btn-ghost" id="acc-del-btn">削除</button>' : '') +
            '<button class="btn btn-ghost" id="acc-close-btn">閉じる</button></div>' +
            '<p class="hint">傾向欄は観察メモ（実測ではありません）。「確認済み」にするには出所URLと確認日が必要です。</p>' +
            '<div class="field"><label>データ種別（data_type）</label><select id="acc-data-type">' +
            DATA_TYPES.map(function (t) {
                return '<option value="' + t[0] + '"' + (dataType === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
            }).join('') + '</select></div>';
        ACCOUNT_FIELDS.forEach(function (f) {
            html += '<div class="field"><label>' + f[1] + '</label>' +
                '<textarea data-acc-field="' + f[0] + '" style="min-height:44px">' + esc(a[f[0]] || '') + '</textarea></div>';
        });
        html += '<button class="btn btn-select" id="acc-save-btn">保存</button></div>';
        box.innerHTML = html;

        $('acc-save-btn').addEventListener('click', function () {
            var research = store.getResearch();
            var record = state.editingIndex === null ? {} : research.accounts[state.editingIndex] || {};
            box.querySelectorAll('[data-acc-field]').forEach(function (el) { record[el.dataset.accField] = el.value.trim(); });
            record.data_type = $('acc-data-type').value;
            record.verified = (record.data_type === 'verified');
            if (!record.name) { toast('アカウント名を入れてください'); return; }
            if (record.verified && (!record.source_url || !record.checked_at)) {
                toast('「確認済み」にするには出所URLと確認日が必要です'); return;
            }
            if (!record.verified) {
                /* 未確認のまま数値を事実として保存しない */
                if (record.followers && record.followers !== '未確認') {
                    record.followers_est = record.followers_est || ('参考推定: ' + record.followers);
                    record.followers = '未確認';
                }
                if (!record.followers) record.followers = '未確認';
            }
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

    /* ================= リサーチ：投稿分析（アカウント研究・手動確認用） ================= */

    var STUDY_AXES = [
        ['hook', '1. 1枚目のフック（どの言葉で止めるか／言い切り・問いかけ・意外な定義のどれか／「これ私かも」の仕掛け）'],
        ['carousel', '2. カルーセル構造（枚数／1枚目の提示／理由の積み上げ／着地／余白を残しているか）'],
        ['textDesign', '3. 文字設計（1枚の文字量／1文の長さ／改行／強い言葉とやわらかい言葉のバランス）'],
        ['empathy', '4. 共感の作り方（代弁しているか／決めつけていないか／否定せず肯定へ着地／説教になっていないか）'],
        ['afterFeel', '5. 読後感（安心・共感・保存したい・送りたい・また読みたい のどれが強いか）'],
        ['charRole', '6. キャラクターの役割（説明役／感情の代弁役／ただそこにいる役／小物やポーズの補い）'],
        ['scene', '7. シーン（スマホ・布団・ソファ・仕事・一人時間などの使い方）']
    ];
    var STUDY_SAVE = [
        ['features', '元投稿の特徴'], ['why', 'なぜ刺さるか'], ['structure', '抽出した投稿構造'],
        ['bouConversion', 'ぼぅ向け変換例（表現は使わず構造だけ）'], ['doNotCopy', 'コピーしない要素']
    ];
    var STUDY_STATUS = { pending_manual: '手動確認待ち', analyzed: '分析済み' };

    function studyAnalyzed(st) {
        return !!(st.features && st.why && st.structure && st.bouConversion);
    }

    function renderStudies() {
        var r = store.getResearch();
        var box = $('study-list');
        box.innerHTML = '';
        (r.postStudies || []).forEach(function (st, idx) {
            var analyzed = studyAnalyzed(st);
            var el = document.createElement('div');
            el.className = 'structure-card';
            el.innerHTML =
                '<div class="chips"><span class="chip theme">' + esc(st.account) + '</span>' +
                '<span class="badge-data ' + (analyzed ? 'verified' : 'placeholder') + '">' + STUDY_STATUS[analyzed ? 'analyzed' : 'pending_manual'] + '</span></div>' +
                '<div class="structure-hook"><a href="' + esc(st.url) + '" target="_blank" rel="noopener">' + esc(st.url) + '</a></div>' +
                (st.confirmedFacts && st.confirmedFacts.length
                    ? '<ul class="fb-log">' + st.confirmedFacts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>'
                    : '') +
                (analyzed
                    ? '<div class="structure-flow"><span class="conv-from">' + esc(st.why) + '</span><span class="conv-arrow">→</span><span class="conv-to">' + esc(st.bouConversion) + '</span></div>'
                    : '<p class="hint">投稿を実際に見て、分析欄を記入してください（タップで開く）。</p>');
            el.addEventListener('click', function (e) {
                if (e.target.tagName === 'A') return;
                openStudyDetail(idx);
            });
            box.appendChild(el);
        });
        if (!box.children.length) box.innerHTML = '<p class="hint">分析対象はまだありません。</p>';
    }

    function openStudyDetail(index) {
        var r = store.getResearch();
        var st = index === null ? { confirmedFacts: [] } : (r.postStudies || [])[index] || {};
        var analyzed = studyAnalyzed(st);
        var box = $('study-detail');
        var html = '<div class="page-card" style="margin-top:12px"><div class="page-card-head">' +
            '<span class="chip theme">' + (index === null ? '新しい分析対象' : esc(st.account)) + '</span>' +
            '<span class="badge-data ' + (analyzed ? 'verified' : 'placeholder') + '">' + STUDY_STATUS[analyzed ? 'analyzed' : 'pending_manual'] + '</span>' +
            '<span class="spacer"></span>' +
            (index !== null ? '<button class="btn btn-ghost" id="study-del-btn">削除</button>' : '') +
            '<button class="btn btn-ghost" id="study-close-btn">閉じる</button></div>' +
            '<p class="hint">スクリーンショットを見ながら記入してください。事実と感想は分けて、確認していないことは書かないでください。</p>' +
            '<div class="field"><label>アカウント名</label><textarea data-study-field="account" style="min-height:40px">' + esc(st.account || '') + '</textarea></div>' +
            '<div class="field"><label>URL（手動確認用）</label><textarea data-study-field="url" style="min-height:40px">' + esc(st.url || '') + '</textarea></div>';
        STUDY_AXES.forEach(function (f) {
            html += '<div class="field"><label>' + f[1] + '</label><textarea data-study-field="' + f[0] + '" style="min-height:44px">' + esc(st[f[0]] || '') + '</textarea></div>';
        });
        html += '<p class="hint" style="margin:8px 0">▼ 保存する5項目（この4つが埋まると「分析済み」になります）</p>';
        STUDY_SAVE.forEach(function (f) {
            html += '<div class="field"><label>' + f[1] + '</label><textarea data-study-field="' + f[0] + '" style="min-height:44px">' + esc(st[f[0]] || '') + '</textarea></div>';
        });
        html += '<div class="field"><label>構造ライブラリに追加するときの型</label><select id="study-struct-type">' +
            (r.structureTypes || []).map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="status-actions">' +
            '<button class="btn btn-select" id="study-save-btn">保存</button>' +
            '<button class="btn btn-small" id="study-to-lib-btn"' + (analyzed ? '' : ' disabled') + '>構造ライブラリに追加（分析済みのみ）</button>' +
            '</div></div>';
        box.innerHTML = html;

        $('study-save-btn').addEventListener('click', function () {
            var research = store.getResearch();
            var record = index === null ? { id: 'study-' + Date.now().toString(36), confirmedFacts: [], data_type: 'manual' }
                : research.postStudies[index];
            box.querySelectorAll('[data-study-field]').forEach(function (el) { record[el.dataset.studyField] = el.value.trim(); });
            if (!record.account || !record.url) { toast('アカウント名とURLを入れてください'); return; }
            record.status = studyAnalyzed(record) ? 'analyzed' : 'pending_manual';
            if (index === null) research.postStudies.push(record);
            else research.postStudies[index] = record;
            store.saveResearch(research);
            toast(record.status === 'analyzed' ? '保存しました（分析済み）' : '保存しました（手動確認待ち）');
            box.innerHTML = '';
            renderStudies();
        });
        $('study-close-btn').addEventListener('click', function () { box.innerHTML = ''; });
        var del = $('study-del-btn');
        if (del) del.addEventListener('click', function () {
            if (!confirm('この分析対象を削除しますか？')) return;
            var research = store.getResearch();
            research.postStudies.splice(index, 1);
            store.saveResearch(research);
            box.innerHTML = '';
            toast('削除しました');
            renderStudies();
        });
        var toLib = $('study-to-lib-btn');
        if (toLib) toLib.addEventListener('click', function () {
            if (!studyAnalyzed(st)) { toast('先に「なぜ刺さるか」等の4項目を記入・保存してください'); return; }
            var research = store.getResearch();
            research.structures.push({
                id: 'st-' + Date.now().toString(36),
                type: $('study-struct-type').value,
                theme: st.scene || '', hook: st.hook || st.features,
                carousel: st.carousel || '', textAmount: st.textDesign || '',
                empathy: st.empathy || '', afterFeel: st.afterFeel || '',
                charRole: st.charRole || '', scene: st.scene || '',
                extraction: st.why, bouConversion: st.bouConversion,
                source_note: st.account + ' の投稿分析より（' + (st.doNotCopy || '表現はコピーしない') + '）',
                data_type: 'manual'
            });
            store.saveResearch(research);
            toast('構造ライブラリに追加しました。次の生成から参照されます');
            box.innerHTML = '';
            renderStructureFilter(); renderStructureList(); renderStudies();
        });
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

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
        var html = '<h3 class="stat-h">投稿構造別（反応されやすい構造を生成で優先します）</h3>' + statRows(adoption.byStructure) +
            '<h3 class="stat-h">案タイプ別（A=王道共感/B=本質/C=保存・シェア）</h3>' + statRows(adoption.byType) +
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

    $('add-structure-btn').addEventListener('click', function () { openStructureDetail(null); });
    $('add-study-btn').addEventListener('click', function () { openStudyDetail(null); });

    /* ================= 初期表示 ================= */
    renderResearchNote();
    renderStructureFilter();
    renderStructureList();
    renderStudies();
    renderGenreFilter();
    renderAccountTable();
    renderPatterns();
    renderConversion();
    renderResearchLog();
    renderPhase();
    renderStrategyForm();
    renderStrategyStats();
})();
