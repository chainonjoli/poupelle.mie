/* ============================================================
   十色神社 TOIRO SHRINE
   推しカラー選択／墨・紙の切替／絵馬奉納（localStorage保存）
   ============================================================ */
(function () {
    'use strict';

    var COLORS = [
        { id: 'black',     jp: 'ブラック',     hex: '#4a4658' },
        { id: 'red',       jp: 'レッド',       hex: '#c8433d' },
        { id: 'pink',      jp: 'ピンク',       hex: '#d9628a' },
        { id: 'orange',    jp: 'オレンジ',     hex: '#c97a34' },
        { id: 'yellow',    jp: 'イエロー',     hex: '#b99320' },
        { id: 'green',     jp: 'グリーン',     hex: '#3f8f5e' },
        { id: 'blue',      jp: 'ブルー',       hex: '#3f66c9' },
        { id: 'lightblue', jp: 'ライトブルー', hex: '#2f97b8' },
        { id: 'purple',    jp: 'パープル',     hex: '#7a51b8' },
        { id: 'white',     jp: 'ホワイト',     hex: '#a89a72' }
    ];

    var WISH_EXAMPLES = [
        'ライブが当たりますように',
        '推しが今日も笑っていますように',
        '推しにまた会えますように',
        '推しが健康でありますように',
        'グッズが無事に届きますように',
        '最高の思い出ができますように'
    ];

    var TODAY_MESSAGES = [
        '今日も、あなたの「好き」がそっと輝いていますように。',
        '推しを想うその時間も、ちゃんとここに残ります。',
        '何気ない一日も、推し活の記録の一部になります。',
        '今日の空の色は、あなたの推し色でした。',
        '小さな「好き」を、大切に持ち帰ってください。',
        '推しがいるだけで、今日という日は少し特別です。',
        '誰かを想う気持ちは、ちゃんと美しいものです。',
        '今日のあなたの「好き」、参道に届きました。',
        '焦らず、あなたのペースで推し活を楽しんでください。',
        'この参道は、いつでもあなたを待っています。',
        '推しへの想いは、そのままであなたの宝物です。',
        '今日という日を、そっと記録しておきましょう。'
    ];

    var STORAGE_COLOR = 'toiro-color';
    var STORAGE_MODE = 'toiro-mode';
    var STORAGE_FONTSIZE = 'toiro-fontsize';
    var STORAGE_EMA = 'toiro-ema';
    var MAX_EMA = 24;

    var body = document.body;
    var gate = document.getElementById('gate');
    var main = document.getElementById('main');

    function findColor(id) {
        for (var i = 0; i < COLORS.length; i++) {
            if (COLORS[i].id === id) return COLORS[i];
        }
        return null;
    }

    function load(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }
    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* プライベートモード等では保存しない */ }
    }
    function escAttr(s) { return String(s).replace(/["<>&]/g, ''); }

    function dayOfYear() {
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        return Math.floor(diff / 86400000);
    }

    /* ---- スクロール連動リビール ---- */
    function setupReveal() {
        var targets = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            targets.forEach(function (t) { t.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        targets.forEach(function (t) { io.observe(t); });
    }

    /* ---- 固定の上部バーに見出しが隠れないよう、余白を実測して合わせる ---- */
    function syncScrollOffset() {
        var topbarEl = document.querySelector('.topbar');
        if (!topbarEl) return;
        document.documentElement.style.scrollPaddingTop = (topbarEl.getBoundingClientRect().height + 16) + 'px';
    }

    /* ---- 1. 推しカラー選択 ---- */
    function renderColorGrid() {
        var grid = document.querySelector('.color-grid');
        grid.innerHTML = '';
        COLORS.forEach(function (c) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-swatch';
            btn.setAttribute('data-color-id', c.id);
            btn.setAttribute('aria-label', c.jp + 'を推しカラーに選ぶ');
            btn.innerHTML = '<span class="swatch-dot" style="--sw:' + c.hex + '"></span><span class="swatch-label">' + c.jp + '</span>';
            btn.addEventListener('click', function () { chooseColor(c.id); });
            grid.appendChild(btn);
        });
    }

    function chooseColor(id) {
        var color = findColor(id);
        if (!color) return;
        body.setAttribute('data-color', color.id);
        save(STORAGE_COLOR, color.id);
        document.getElementById('hero-color-name').textContent = color.jp;
        gate.classList.add('hidden');
        main.classList.remove('hidden');
        document.getElementById('btn-recolor').classList.remove('hidden');
        setTimeout(syncScrollOffset, 0);
    }

    function reopenGate() {
        gate.classList.remove('hidden');
        main.classList.add('hidden');
        window.scrollTo(0, 0);
    }

    /* ---- 墨／紙の切替 ---- */
    function applyMode(mode) {
        body.setAttribute('data-mode', mode);
        document.getElementById('btn-mode').textContent =
            mode === 'ink' ? '紙の参拝へ' : '墨の参拝へ';
        save(STORAGE_MODE, mode);
    }

    /* ---- 文字サイズ切替（幅広い年代への配慮） ---- */
    function applyFontSize(size) {
        var html = document.documentElement;
        var btn = document.getElementById('btn-fontsize');
        if (size === 'large') {
            html.setAttribute('data-fontsize', 'large');
            btn.textContent = '文字を標準に';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            html.removeAttribute('data-fontsize');
            btn.textContent = '文字を大きく';
            btn.setAttribute('aria-pressed', 'false');
        }
        save(STORAGE_FONTSIZE, size);
    }

    /* ---- 2. 参道ページ ---- */
    function renderTodayMessage() {
        var idx = dayOfYear() % TODAY_MESSAGES.length;
        document.getElementById('today-message').textContent = TODAY_MESSAGES[idx];
    }

    /* ---- 3. 願いごとページ（絵馬） ----
       絵馬はメモリ上のリスト（emaList）を正とし、localStorageは永続化にのみ使う。
       プライベートブラウズ等で保存できない環境でも、その場での表示は反映される。 */
    var emaList = load(STORAGE_EMA, []);
    function saveEma() { save(STORAGE_EMA, emaList.slice(0, MAX_EMA)); }

    function renderWishChips() {
        var wrap = document.getElementById('wish-chips');
        wrap.innerHTML = '';
        WISH_EXAMPLES.forEach(function (w) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'wish-chip';
            chip.textContent = w;
            chip.addEventListener('click', function () {
                document.getElementById('ema-wish').value = w;
            });
            wrap.appendChild(chip);
        });
    }

    function renderEmaRack() {
        var rack = document.getElementById('ema-rack');
        rack.innerHTML = '';
        emaList.forEach(function (item) {
            var plaque = document.createElement('div');
            plaque.className = 'ema-plaque';
            plaque.style.setProperty('--ema', findColor(item.color) ? findColor(item.color).hex : 'var(--gold)');
            var wishEl = document.createElement('p');
            wishEl.className = 'ema-wish-text';
            wishEl.textContent = item.wish;
            var sigEl = document.createElement('p');
            sigEl.className = 'ema-signature';
            sigEl.textContent = (item.name || '名無し') + ' より';
            plaque.appendChild(wishEl);
            plaque.appendChild(sigEl);
            rack.appendChild(plaque);
        });
    }

    function dedicateEma() {
        var name = document.getElementById('ema-name').value.trim();
        var wish = document.getElementById('ema-wish').value.trim();
        var errorEl = document.getElementById('ema-error');
        if (!name || !wish) {
            errorEl.classList.remove('hidden');
            return;
        }
        errorEl.classList.add('hidden');
        emaList.unshift({ name: escAttr(name), wish: escAttr(wish), color: body.getAttribute('data-color') || 'black', date: new Date().toISOString() });
        if (emaList.length > MAX_EMA) emaList.length = MAX_EMA;
        saveEma();
        renderEmaRack();
        var doneEl = document.getElementById('ema-done');
        doneEl.textContent = name + 'さんの絵馬を奉納しました。';
        doneEl.classList.remove('hidden');
        document.getElementById('ema-wish').value = '';
    }

    /* ---- 初期化 ---- */
    renderColorGrid();
    renderWishChips();
    renderEmaRack();
    renderTodayMessage();
    setupReveal();

    applyMode(load(STORAGE_MODE, 'ink'));
    applyFontSize(load(STORAGE_FONTSIZE, 'normal'));

    var savedColor = load(STORAGE_COLOR, null);
    if (savedColor && findColor(savedColor)) {
        chooseColor(savedColor);
    }

    syncScrollOffset();
    window.addEventListener('resize', syncScrollOffset);
    window.addEventListener('load', syncScrollOffset);

    document.getElementById('btn-recolor').addEventListener('click', reopenGate);
    document.getElementById('btn-mode').addEventListener('click', function () {
        applyMode(body.getAttribute('data-mode') === 'ink' ? 'paper' : 'ink');
        setTimeout(syncScrollOffset, 0);
    });
    document.getElementById('btn-fontsize').addEventListener('click', function () {
        applyFontSize(document.documentElement.getAttribute('data-fontsize') === 'large' ? 'normal' : 'large');
        setTimeout(syncScrollOffset, 320);
    });
    document.getElementById('btn-sanpai').addEventListener('click', function () {
        document.getElementById('ema-section').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btn-dedicate').addEventListener('click', dedicateEma);
})();
