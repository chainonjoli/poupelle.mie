/* ぼぅ 投稿スタジオ 画面の配線 */
(function () {
    'use strict';

    var store = window.BouStore;
    var gen = window.BouGenerator;

    var STATUS_LABEL = {
        draft: '下書き', selected: '採用', generated: '画像作成済み',
        posted: '投稿済み', rejected: '不採用'
    };

    var state = { filter: 'all', openPostId: null };

    function $(id) { return document.getElementById(id); }

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
        return (d.getMonth() + 1) + '/' + d.getDate();
    }

    /* ================= タブ ================= */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
            document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
            btn.classList.add('active');
            $('view-' + btn.dataset.view).classList.add('active');
        });
    });

    /* ================= 生成 ================= */
    function renderModeNote() {
        var s = store.getSettings();
        $('mode-note').textContent = s.mode === 'api'
            ? '生成モード: Claude API（固定設定＋過去のフィードバックを参照します）'
            : '生成モード: 内蔵（書き溜めたぼぅの言葉から選びます・APIキー不要）';
    }

    $('generate-btn').addEventListener('click', function () {
        var btn = $('generate-btn');
        var status = $('gen-status');
        var settings = store.getSettings();
        btn.disabled = true;
        status.classList.remove('gen-error');
        status.textContent = 'ぼぅが考え中……（急がせないであげてください）';

        gen.generateBatch(store, settings.mode, settings.apiKey)
            .then(function (drafts) {
                store.addPosts(drafts);
                status.textContent = '3案できました。ゆっくり選んでください。';
                renderBatch();
                renderPostList();
            })
            .catch(function (err) {
                status.classList.add('gen-error');
                status.textContent = 'うまくいきませんでした：' + err.message;
            })
            .then(function () { btn.disabled = false; });
    });

    /* ================= 今日の3案 ================= */
    function renderBatch() {
        var grid = $('batch-grid');
        var character = store.getCharacter();
        var batch = store.getLatestBatch();
        grid.innerHTML = '';
        if (!batch.length) {
            grid.innerHTML = '<div class="empty-note">まだ今日の案がありません。上のボタンでどうぞ。</div>';
            return;
        }
        batch.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'draft-card' +
                (p.status === 'selected' || p.status === 'generated' || p.status === 'posted' ? ' is-selected' : '') +
                (p.status === 'rejected' ? ' is-rejected' : '');
            var ng = gen.checkPost(p, character);
            card.innerHTML =
                '<span class="variant">' + p.variant + '案</span>' +
                '<div class="chips"><span class="chip theme">' + esc(p.theme) + '</span>' +
                '<span class="badge ' + p.status + '">' + STATUS_LABEL[p.status] + '</span>' +
                (ng.length ? '<span class="chip ng">NG表現: ' + esc(ng.join('、')) + '</span>' : '') +
                '</div>' +
                '<div class="draft-main">' + esc(p.main_text) + '</div>' +
                '<div class="hint">' + esc(p.scene || '') + '</div>' +
                '<div class="draft-actions"></div>';
            var actions = card.querySelector('.draft-actions');
            if (p.status === 'draft') {
                var sel = document.createElement('button');
                sel.className = 'btn btn-select';
                sel.textContent = 'この案にする';
                sel.addEventListener('click', function (e) {
                    e.stopPropagation();
                    store.selectPost(p.id);
                    toast('この案を採用しました');
                    renderBatch(); renderPostList();
                });
                actions.appendChild(sel);
            }
            var open = document.createElement('button');
            open.className = 'btn btn-ghost';
            open.textContent = 'くわしく';
            open.addEventListener('click', function (e) { e.stopPropagation(); openModal(p.id); });
            actions.appendChild(open);
            card.addEventListener('click', function () { openModal(p.id); });
            grid.appendChild(card);
        });
    }

    /* ================= 過去投稿 ================= */
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            state.filter = btn.dataset.filter;
            renderPostList();
        });
    });

    function renderPostList() {
        var list = $('post-list');
        var posts = store.getPosts();
        if (state.filter !== 'all') posts = posts.filter(function (p) { return p.status === state.filter; });
        list.innerHTML = '';
        if (!posts.length) {
            list.innerHTML = '<div class="empty-note">ここには、まだ何もありません。</div>';
            return;
        }
        posts.forEach(function (p) {
            var row = document.createElement('div');
            row.className = 'post-row';
            row.innerHTML =
                '<span class="badge ' + p.status + '">' + STATUS_LABEL[p.status] + '</span>' +
                '<span class="text">' + esc((p.main_text || '').replace(/\n/g, '　')) + '</span>' +
                '<span class="chip theme">' + esc(p.theme || '') + '</span>' +
                '<span class="date">' + fmtDate(p.created_at) + '</span>';
            row.addEventListener('click', function () { openModal(p.id); });
            list.appendChild(row);
        });
    }

    /* ================= 投稿詳細モーダル ================= */
    function openModal(id) {
        var p = store.getPost(id);
        if (!p) return;
        state.openPostId = id;
        $('m-status').textContent = STATUS_LABEL[p.status];
        $('m-status').className = 'badge ' + p.status;
        $('m-variant').textContent = (p.variant ? p.variant + '案' : '') + (p.generator === 'api' ? '（API生成）' : '（内蔵生成）');
        $('m-date').textContent = fmtDate(p.created_at);
        $('m-theme').value = p.theme || '';
        $('m-main').value = p.main_text || '';
        $('m-scene').value = p.scene || '';
        $('m-caption').value = p.caption || '';
        $('m-hashtags').value = (p.hashtags || []).join(' ');
        $('m-prompt').value = p.image_prompt || '';
        $('m-feedback').value = '';
        renderNgWarning(p);
        renderFeedbackLog(p);
        renderStatusActions(p);
        $('modal-bg').classList.add('open');
    }

    function closeModal() {
        state.openPostId = null;
        $('modal-bg').classList.remove('open');
        renderBatch(); renderPostList();
    }

    function renderNgWarning(p) {
        var box = $('m-ng-warning');
        var ng = gen.checkPost(p, store.getCharacter());
        box.innerHTML = ng.length
            ? '<span class="chip ng">使わない約束の表現が入っています: ' + esc(ng.join('、')) + '（修正するか、作り直してください）</span>'
            : '';
    }

    function renderFeedbackLog(p) {
        var log = $('m-fb-log');
        log.innerHTML = '';
        (p.user_feedback || []).slice().reverse().forEach(function (f) {
            var li = document.createElement('li');
            li.textContent = f.text + '（' + fmtDate(f.at) + '）';
            log.appendChild(li);
        });
    }

    function renderStatusActions(p) {
        var box = $('m-actions');
        box.innerHTML = '';
        function action(label, cls, fn) {
            var b = document.createElement('button');
            b.className = 'btn ' + cls;
            b.textContent = label;
            b.addEventListener('click', fn);
            box.appendChild(b);
        }
        if (p.status === 'draft') {
            action('この案にする', 'btn-select', function () { store.selectPost(p.id); toast('採用しました'); openModal(p.id); });
        }
        if (p.status === 'selected') {
            action('画像を作った', 'btn-select', function () { store.setStatus(p.id, 'generated'); toast('画像作成済みにしました'); openModal(p.id); });
        }
        if (p.status === 'generated') {
            action('投稿した', 'btn-select', function () { store.setStatus(p.id, 'posted'); toast('投稿済みにしました。おつかれさまでした'); openModal(p.id); });
        }
        if (p.status !== 'rejected' && p.status !== 'posted') {
            action('不採用にする', 'btn-ghost', function () { store.setStatus(p.id, 'rejected'); toast('不採用にしました'); openModal(p.id); });
        }
        if (p.status === 'rejected') {
            action('下書きに戻す', 'btn-ghost', function () { store.setStatus(p.id, 'draft'); toast('下書きに戻しました'); openModal(p.id); });
        }
    }

    $('modal-close').addEventListener('click', closeModal);
    $('m-close-btn').addEventListener('click', closeModal);
    $('modal-bg').addEventListener('click', function (e) { if (e.target === $('modal-bg')) closeModal(); });

    $('m-save-btn').addEventListener('click', function () {
        if (!state.openPostId) return;
        var tags = $('m-hashtags').value.split(/[\s,、]+/).filter(Boolean).slice(0, 5);
        store.updatePost(state.openPostId, {
            theme: $('m-theme').value.trim(),
            main_text: $('m-main').value,
            scene: $('m-scene').value.trim(),
            caption: $('m-caption').value,
            hashtags: tags,
            image_prompt: $('m-prompt').value
        });
        toast('修正を保存しました');
        renderNgWarning(store.getPost(state.openPostId));
        renderBatch(); renderPostList();
    });

    $('copy-prompt-btn').addEventListener('click', function () {
        var text = $('m-prompt').value;
        function done() { toast('画像生成用プロンプトをコピーしました'); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
    });

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* あきらめる */ }
        document.body.removeChild(ta);
    }

    /* フィードバック */
    document.querySelectorAll('.fb-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            if (!state.openPostId) return;
            store.addFeedback(state.openPostId, chip.dataset.fb);
            toast('「' + chip.dataset.fb + '」を記録しました');
            renderFeedbackLog(store.getPost(state.openPostId));
        });
    });

    $('send-feedback-btn').addEventListener('click', function () {
        var text = $('m-feedback').value.trim();
        if (!text || !state.openPostId) return;
        store.addFeedback(state.openPostId, text);
        $('m-feedback').value = '';
        toast('フィードバックを記録しました');
        renderFeedbackLog(store.getPost(state.openPostId));
    });

    /* ================= データの書き出し/読み込み ================= */
    $('export-btn').addEventListener('click', function () {
        var blob = new Blob([store.exportAll()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bou-data-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    $('import-btn').addEventListener('click', function () { $('import-file').click(); });
    $('import-file').addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var n = store.importAll(reader.result);
                toast(n + '件の投稿候補を読み込みました');
                renderBatch(); renderPostList(); renderCharacterForm();
            } catch (e) { toast('読み込めませんでした：' + e.message); }
        };
        reader.readAsText(file);
        this.value = '';
    });

    /* ================= 設定画面 ================= */
    function lines(v) { return v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }

    function renderSettingsForm() {
        var s = store.getSettings();
        document.querySelectorAll('input[name="gen-mode"]').forEach(function (r) { r.checked = (r.value === s.mode); });
        $('api-key').value = s.apiKey || '';
    }

    $('save-settings-btn').addEventListener('click', function () {
        var mode = document.querySelector('input[name="gen-mode"]:checked').value;
        var apiKey = $('api-key').value.trim();
        if (mode === 'api' && !apiKey) { toast('Claude APIモードにはAPIキーが必要です'); return; }
        store.saveSettings({ mode: mode, apiKey: apiKey });
        toast('生成モードを保存しました');
        renderModeNote();
    });

    function renderCharacterForm() {
        var c = store.getCharacter();
        $('ch-concept').value = c.concept;
        $('ch-role').value = c.role;
        $('ch-personality').value = c.personality.join('\n');
        $('ch-rules').value = c.speech.rules.join('\n');
        $('ch-examples').value = c.speech.examples.join('\n');
        $('ch-ng').value = c.ngWords.join('\n');
        $('ch-themes').value = c.themes.join('\n');
        $('ch-hashtags').value = c.hashtagPool.join('\n');
        $('ch-visual').value = c.visual.base.concat(c.visual.taste).join('\n');
        $('ch-forbidden').value = c.visual.forbidden.join('\n');
        $('ch-template').value = c.imagePromptTemplate;

        var colors = c.visual.colors;
        var names = { body: 'からだ', belly: 'おなか', line: 'ヒレ・輪郭', cheek: 'ほっぺ' };
        var row = $('color-row');
        row.innerHTML = '';
        Object.keys(colors).forEach(function (k) {
            var item = document.createElement('div');
            item.className = 'color-item';
            item.innerHTML = '<span class="color-dot" style="background:' + esc(colors[k]) + '"></span>' +
                esc(names[k] || k) + ' ' + esc(colors[k]);
            row.appendChild(item);
        });
    }

    $('save-character-btn').addEventListener('click', function () {
        var c = store.getCharacter();
        c.concept = $('ch-concept').value.trim();
        c.role = $('ch-role').value.trim();
        c.personality = lines($('ch-personality').value);
        c.speech.rules = lines($('ch-rules').value);
        c.speech.examples = lines($('ch-examples').value);
        c.ngWords = lines($('ch-ng').value);
        c.themes = lines($('ch-themes').value);
        c.hashtagPool = lines($('ch-hashtags').value);
        c.visual.forbidden = lines($('ch-forbidden').value);
        c.imagePromptTemplate = $('ch-template').value.trim();
        store.saveCharacter(c);
        toast('ぼぅの設定を保存しました');
    });

    $('reset-character-btn').addEventListener('click', function () {
        if (!confirm('ぼぅの設定を初期設定に戻します。よろしいですか？')) return;
        store.resetCharacter();
        renderCharacterForm();
        toast('初期設定に戻しました');
    });

    /* ================= util ================= */
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ================= 初期表示 ================= */
    renderModeNote();
    renderBatch();
    renderPostList();
    renderSettingsForm();
    renderCharacterForm();
})();
