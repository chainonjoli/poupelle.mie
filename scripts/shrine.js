/* ============================================================
   推し色神社 - Oshiiro Shrine
   推しカラー選択／昼夜切替／絵馬奉納（localStorage保存）
   ============================================================ */
(function () {
    'use strict';

    var COLORS = [
        { id: 'red',       jp: 'レッド',       en: 'Red',        hex: '#e8544f', deep: '#b3312d' },
        { id: 'pink',      jp: 'ピンク',       en: 'Pink',       hex: '#ff7fa8', deep: '#d94f7e' },
        { id: 'orange',    jp: 'オレンジ',     en: 'Orange',     hex: '#ff9744', deep: '#d96f1e' },
        { id: 'yellow',    jp: 'イエロー',     en: 'Yellow',     hex: '#f5c93a', deep: '#c79a12' },
        { id: 'green',     jp: 'グリーン',     en: 'Green',      hex: '#4ec97a', deep: '#2b9e57' },
        { id: 'lightblue', jp: 'ライトブルー', en: 'Light Blue', hex: '#5fd0f0', deep: '#2fa3c9' },
        { id: 'blue',      jp: 'ブルー',       en: 'Blue',       hex: '#4f7df0', deep: '#2f55c9' },
        { id: 'purple',    jp: 'パープル',     en: 'Purple',     hex: '#a06ae8', deep: '#7a3fc9' },
        { id: 'white',     jp: 'ホワイト',     en: 'White',      hex: '#eee9dc', deep: '#b5ac96' },
        { id: 'black',     jp: 'ブラック',     en: 'Black',      hex: '#3c3c50', deep: '#16161f' }
    ];

    var WISH_EXAMPLES = [
        'ライブに当選しますように',
        '神席にご縁がありますように',
        '推しにまた会えますように',
        'ファンサをもらえますように',
        '推しが健康で笑顔で過ごせますように',
        'ツアーが無事に完走しますように',
        '最高の思い出ができますように'
    ];

    var STORAGE_COLOR = 'oshiiro-color';
    var STORAGE_MODE = 'oshiiro-mode';
    var STORAGE_EMA = 'oshiiro-ema';
    var MAX_EMA = 24;

    var body = document.body;
    var gate = document.getElementById('color-gate');
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

    /* ---- キネティック・タイポグラフィ（一文字ずつ登場） ---- */
    function splitKinetic(el) {
        var text = el.textContent;
        el.textContent = '';
        el.setAttribute('aria-label', text);
        for (var i = 0; i < text.length; i++) {
            var span = document.createElement('span');
            span.className = 'k-char';
            span.setAttribute('aria-hidden', 'true');
            span.style.setProperty('--i', i);
            span.textContent = text[i];
            el.appendChild(span);
        }
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

    /* ---- 推しカラー選択の門（十色の輪） ---- */
    function previewColor(c) {
        /* 選ぶ前のライブプレビュー: 保存はせず世界の色だけ変える */
        body.setAttribute('data-color', c.id);
        document.getElementById('ring-label').textContent = c.jp;
    }

    function endPreview() {
        var saved = load(STORAGE_COLOR, null);
        if (saved && findColor(saved)) {
            body.setAttribute('data-color', saved);
        } else {
            body.removeAttribute('data-color');
        }
        document.getElementById('ring-label').textContent = '色をえらぶ';
    }

    function renderGate() {
        var list = document.getElementById('color-list');
        list.innerHTML = '';
        COLORS.forEach(function (c, idx) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-swatch';
            btn.style.setProperty('--i', idx);
            btn.style.setProperty('--ang', (idx * 36) + 'deg');
            btn.setAttribute('data-color-id', c.id);
            btn.setAttribute('aria-label', c.jp + '（' + c.en + '）を推しカラーに選ぶ');
            btn.innerHTML = '<span class="swatch-dot" style="--sw:' + c.hex + ';--sw-deep:' + c.deep + '"></span>';
            btn.addEventListener('click', function () { chooseColor(c.id, true); });
            btn.addEventListener('mouseenter', function () { previewColor(c); });
            btn.addEventListener('focus', function () { previewColor(c); });
            btn.addEventListener('mouseleave', endPreview);
            btn.addEventListener('blur', endPreview);
            list.appendChild(btn);
        });
    }

    function chooseColor(id, animate) {
        var color = findColor(id);
        if (!color) return;
        body.setAttribute('data-color', color.id);
        save(STORAGE_COLOR, color.id);
        document.getElementById('hero-color-name').textContent = color.jp;
        main.classList.remove('hidden');
        if (animate) {
            gate.classList.add('closing');
            setTimeout(function () { gate.classList.add('hidden'); }, 900);
        } else {
            gate.classList.add('hidden');
        }
    }

    function reopenGate() {
        gate.classList.remove('hidden');
        gate.classList.remove('closing');
        window.scrollTo(0, 0);
    }

    /* ---- 昼夜切替 ---- */
    function applyMode(mode) {
        body.setAttribute('data-mode', mode);
        document.getElementById('btn-mode').textContent =
            mode === 'night' ? '☀ 昼の参拝へ' : '🌙 夜の参拝へ';
        save(STORAGE_MODE, mode);
    }

    /* ---- 舞い散る光の粒 ---- */
    function renderParticles() {
        var wrap = document.getElementById('particles');
        for (var i = 0; i < 28; i++) {
            var p = document.createElement('span');
            p.className = 'particle';
            var size = 2 + Math.random() * 5;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = 9 + Math.random() * 14 + 's';
            p.style.animationDelay = -Math.random() * 20 + 's';
            wrap.appendChild(p);
        }
    }

    /* ---- 絵馬 ---- */
    function renderWishChips() {
        var wrap = document.getElementById('wish-chips');
        WISH_EXAMPLES.forEach(function (text) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'wish-chip';
            chip.textContent = text;
            chip.addEventListener('click', function () {
                document.getElementById('ema-wish').value = text;
                document.getElementById('ema-wish').focus();
            });
            wrap.appendChild(chip);
        });
    }

    /* 絵馬はメモリ上のリストを正とし、localStorageは永続化にのみ使う。
       （プライベートブラウズ等で保存できない環境でも、奉納した絵馬が
       その場で絵馬掛けに表示されるように） */
    var emaList = load(STORAGE_EMA, []);

    function renderEmaRack() {
        var rack = document.getElementById('ema-rack');
        rack.innerHTML = '';
        emaList.forEach(function (ema) {
            var color = findColor(ema.color) || COLORS[0];
            var plaque = document.createElement('div');
            plaque.className = 'ema-plaque';
            plaque.style.setProperty('--ema', color.hex);
            plaque.style.setProperty('--ema-deep', color.deep);

            var ribbon = document.createElement('span');
            ribbon.className = 'ema-ribbon';

            var wish = document.createElement('p');
            wish.className = 'ema-wish-text';
            wish.textContent = ema.wish;

            var sig = document.createElement('p');
            sig.className = 'ema-signature';
            sig.textContent = ema.name + ' より';

            plaque.appendChild(ribbon);
            plaque.appendChild(wish);
            plaque.appendChild(sig);
            rack.appendChild(plaque);
        });
    }

    function dedicateEma() {
        var nameInput = document.getElementById('ema-name');
        var wishInput = document.getElementById('ema-wish');
        var error = document.getElementById('ema-error');
        var done = document.getElementById('ema-done');
        var name = nameInput.value.trim();
        var wish = wishInput.value.trim();

        if (!name || !wish) {
            error.classList.remove('hidden');
            done.classList.add('hidden');
            return;
        }
        error.classList.add('hidden');

        emaList.unshift({
            name: name,
            wish: wish,
            color: body.getAttribute('data-color') || 'red',
            at: Date.now()
        });
        if (emaList.length > MAX_EMA) emaList = emaList.slice(0, MAX_EMA);
        save(STORAGE_EMA, emaList);

        renderEmaRack();
        wishInput.value = '';
        done.textContent = name + 'さんの絵馬を奉納しました。あなたの願いが、推しに届きますように ✦';
        done.classList.remove('hidden');
        done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ---- 初期化 ---- */
    splitKinetic(document.getElementById('gate-title'));
    setupReveal();
    renderGate();
    renderWishChips();
    renderEmaRack();
    renderParticles();

    applyMode(load(STORAGE_MODE, 'night'));

    var savedColor = load(STORAGE_COLOR, null);
    if (savedColor && findColor(savedColor)) {
        chooseColor(savedColor, false);
    }

    document.getElementById('btn-recolor').addEventListener('click', reopenGate);
    document.getElementById('btn-mode').addEventListener('click', function () {
        applyMode(body.getAttribute('data-mode') === 'night' ? 'day' : 'night');
    });
    document.getElementById('btn-dedicate').addEventListener('click', dedicateEma);
})();
