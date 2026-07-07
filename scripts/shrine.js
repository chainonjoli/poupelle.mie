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
        var share = document.createElement('a');
        share.className = 'btn-x btn-x-small';
        share.href = xShareUrl('十色神社に絵馬を奉納しました ⛩「' + wish + '」あなたの推しは、何色ですか。');
        share.target = '_blank';
        share.rel = 'noopener';
        share.textContent = '𝕏 で願いをポスト';
        done.appendChild(share);
        done.classList.remove('hidden');
        done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ============================================================
       SNSシェアの仕掛け（みくじ・御朱印・シェア導線）
       ============================================================ */
    var PAGE_URL = 'https://chainonjoli.github.io/poupelle.mie/shrine.html';

    function xShareUrl(text) {
        return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) +
            '&url=' + encodeURIComponent(PAGE_URL) +
            '&hashtags=' + encodeURIComponent('十色神社,推し活');
    }

    function currentColor() {
        return findColor(body.getAttribute('data-color')) || COLORS[0];
    }

    /* ---- モーダル ---- */
    var modal = document.getElementById('modal');
    var modalBody = document.getElementById('modal-body');

    function openModal(html) {
        modalBody.innerHTML = html;
        modal.classList.remove('hidden');
    }
    function closeModal() {
        modal.classList.add('hidden');
        modalBody.innerHTML = '';
    }

    /* ---- 花手水: ふれると波紋 ---- */
    function rippleChozu(card) {
        var water = card.querySelector('.water');
        var ring = document.createElement('span');
        ring.className = 'ripple-ring';
        water.parentNode.appendChild(ring);
        ring.style.left = water.offsetLeft + water.offsetWidth / 2 + 'px';
        ring.style.top = water.offsetTop + water.offsetHeight / 2 + 'px';
        ring.addEventListener('animationend', function () { ring.remove(); });
    }

    /* ---- 風鈴: ふれると鳴る ---- */
    var audioCtx = null;
    function chime() {
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            [2093, 2637].forEach(function (freq, i) {
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(i === 0 ? 0.12 : 0.05, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.4);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 1.5);
            });
        } catch (e) { /* 音が出せない環境では視覚演出のみ */ }
    }
    function ringFurin(card) {
        var visual = card.querySelector('.furin-visual');
        visual.classList.remove('ringing');
        void visual.offsetWidth; /* 連打でもアニメーションを再発火 */
        visual.classList.add('ringing');
        chime();
    }

    /* ---- 推し活みくじ ---- */
    var OMIKUJI_RANKS = [
        { r: '推し大吉', w: 4 }, { r: '大吉', w: 12 }, { r: '中吉', w: 26 },
        { r: '小吉', w: 28 }, { r: '吉', w: 20 }, { r: '末吉', w: 10 }
    ];
    var OMIKUJI_MSGS = [
        '今日の現場は、最高の思い出になる予感。',
        '推しの新しい一面に出会えるかも。',
        '諦めかけたチケットに、ご縁が巡ってきそう。',
        '推しの笑顔が、あなたの一週間を守ってくれます。',
        '遠征の空も味方するでしょう。忘れ物にはご注意を。',
        '同担との素敵な出会いがありそう。',
        '積んだ徳は、神席となって返ってくるでしょう。',
        '今日は無理せず、おうちで推しを摂取する日。'
    ];
    function drawOmikuji() {
        var total = 0, i;
        for (i = 0; i < OMIKUJI_RANKS.length; i++) total += OMIKUJI_RANKS[i].w;
        var roll = Math.random() * total;
        var rank = OMIKUJI_RANKS[0].r;
        for (i = 0; i < OMIKUJI_RANKS.length; i++) {
            roll -= OMIKUJI_RANKS[i].w;
            if (roll <= 0) { rank = OMIKUJI_RANKS[i].r; break; }
        }
        /* 星は加重抽選（5:42% / 4:32% / 3:18% / 2:8% = 平均4.08 ≥ 3.9）。
           ファンの背中を押すみくじなので、悪い結果は出しすぎない */
        function stars() {
            var r = Math.random();
            var n = r < 0.42 ? 5 : r < 0.74 ? 4 : r < 0.92 ? 3 : 2;
            return '★★★★★'.slice(0, n).padEnd(5, '☆');
        }
        var all5 = rank === '推し大吉';
        function star5() { return all5 ? '★★★★★' : stars(); }
        return {
            rank: rank,
            msg: OMIKUJI_MSGS[Math.floor(Math.random() * OMIKUJI_MSGS.length)],
            luck: [
                { label: '当選運', v: star5() },
                { label: '神席運', v: star5() },
                { label: 'ファンサ運', v: star5() },
                { label: '遠征運', v: star5() }
            ]
        };
    }

    /* みくじ紙の画像（保存してSNSに添付できる） */
    function makeOmikujiImage(o) {
        var color = currentColor();
        var W = 480, H = 960;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        var bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#fdf9ee');
        bg.addColorStop(1, '#f0e6cf');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(120, 100, 60, 0.05)';
        for (var i = 0; i < 500; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
        ctx.strokeStyle = color.hex;
        ctx.lineWidth = 4;
        ctx.strokeRect(18, 18, W - 36, H - 36);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(30, 30, W - 60, H - 60);

        var mincho = '"Shippori Mincho", "Hiragino Mincho ProN", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#6d6350';
        ctx.font = '600 24px ' + mincho;
        ctx.fillText('十色神社 推し活みくじ', W / 2, 78);

        ctx.fillStyle = color.id === 'white' ? '#948a70' : color.deep;
        ctx.font = '600 ' + (o.rank.length > 2 ? 84 : 108) + 'px ' + mincho;
        ctx.fillText(o.rank, W / 2, 190);

        ctx.fillStyle = '#4a3b28';
        ctx.font = '500 26px ' + mincho;
        var line = '', lines = [], ch;
        for (i = 0; i < o.msg.length; i++) {
            ch = o.msg[i];
            line += ch;
            if (line.length >= 14 || i === o.msg.length - 1) { lines.push(line); line = ''; }
        }
        lines.forEach(function (l, idx) { ctx.fillText(l, W / 2, 290 + idx * 40); });

        var y = 430;
        ctx.font = '600 30px ' + mincho;
        o.luck.forEach(function (l) {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#4a3b28';
            ctx.fillText(l.label, 84, y);
            ctx.textAlign = 'right';
            ctx.fillStyle = color.id === 'white' ? '#948a70' : color.deep;
            ctx.fillText(l.v, W - 84, y);
            ctx.strokeStyle = '#d8c9a8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(72, y + 28);
            ctx.lineTo(W - 72, y + 28);
            ctx.stroke();
            y += 68;
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#6d6350';
        ctx.font = '500 24px ' + mincho;
        ctx.fillText('ラッキーカラー：' + color.jp, W / 2, y + 30);

        var now = new Date();
        ctx.font = '400 20px sans-serif';
        ctx.fillStyle = '#8d8062';
        ctx.fillText(now.getFullYear() + '.' + (now.getMonth() + 1) + '.' + now.getDate() + '  TOIRO SHRINE', W / 2, H - 70);
        return cv.toDataURL('image/png');
    }

    function burstSparkles() {
        var panel = modal.querySelector('.modal-panel');
        var color = currentColor();
        for (var i = 0; i < 20; i++) {
            var s = document.createElement('span');
            s.className = 'kira';
            s.style.background = i % 3 === 0 ? '#ffe9a8' : color.hex;
            s.style.setProperty('--kx', (Math.random() * 260 - 130) + 'px');
            s.style.setProperty('--ky', (Math.random() * -240 - 40) + 'px');
            s.style.animationDelay = (Math.random() * 0.25) + 's';
            panel.appendChild(s);
            s.addEventListener('animationend', function (e) { e.target.remove(); });
        }
    }

    function showOmikujiResult() {
        if (modal.classList.contains('hidden')) return; /* 演出中に閉じられたら何もしない */
        var o = drawOmikuji();
        var color = currentColor();
        var rows = o.luck.map(function (l) {
            return '<div class="mikuji-row"><span>' + l.label + '</span><span class="mikuji-stars">' + l.v + '</span></div>';
        }).join('');
        var shareText = '十色神社の推し活みくじは【' + o.rank + '】でした ⛩ あなたの推しは、何色ですか。';
        var img = makeOmikujiImage(o);
        openModal(
            '<p class="modal-kicker">推し活みくじ</p>' +
            '<div class="mikuji-paper">' +
            '<p class="mikuji-rank">' + o.rank + '</p>' +
            '<p class="mikuji-msg">' + o.msg + '</p>' +
            '<div class="mikuji-luck">' + rows + '</div>' +
            '<p class="mikuji-lucky">ラッキーカラー：あなたの推し色（' + color.jp + '）</p>' +
            '</div>' +
            '<div class="modal-actions">' +
            '<a class="pill-btn" id="btn-mikuji-save" href="' + img + '" download="toiro-omikuji.png">画像を保存</a>' +
            '<a class="btn-x" href="' + xShareUrl(shareText) + '" target="_blank" rel="noopener">𝕏 で結果をポスト</a>' +
            '<button type="button" class="pill-btn" id="btn-redraw">もう一度引く</button>' +
            '</div>'
        );
        if (o.rank === '推し大吉' || o.rank === '大吉') burstSparkles();
        document.getElementById('btn-redraw').addEventListener('click', openOmikuji);
    }

    function openOmikuji() {
        /* 儀式演出: みくじ筒を振ってから結果が出る */
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { modal.classList.remove('hidden'); showOmikujiResult(); return; }
        openModal(
            '<p class="modal-kicker">推し活みくじ</p>' +
            '<div class="mikuji-tube" aria-hidden="true">' +
            '<span class="tube-stick"></span>' +
            '<span class="tube-body">御神籤</span>' +
            '</div>' +
            '<p class="mikuji-wait">心の中で、推しを想いながら…</p>'
        );
        setTimeout(showOmikujiResult, 1500);
    }

    /* ---- 推し色御朱印メーカー ---- */
    function kanjiNum(n) {
        var k = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        if (n >= 10 && n < 100) {
            var t = Math.floor(n / 10), o = n % 10;
            return (t > 1 ? k[t] : '') + '十' + (o ? k[o] : '');
        }
        return String(n).split('').map(function (d) { return k[+d]; }).join('');
    }
    function drawVertical(ctx, text, x, y, lineH) {
        for (var i = 0; i < text.length; i++) ctx.fillText(text[i], x, y + i * lineH);
    }
    function makeGoshuin(name) {
        var color = currentColor();
        var W = 720, H = 1000;
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');

        /* 和紙の下地 */
        var bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#fdf9ee');
        bg.addColorStop(1, '#f0e6cf');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(120, 100, 60, 0.05)';
        for (var i = 0; i < 900; i++) {
            ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
        }
        /* 推し色の二重枠 */
        ctx.strokeStyle = color.hex;
        ctx.lineWidth = 5;
        ctx.strokeRect(26, 26, W - 52, H - 52);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 40, W - 80, H - 80);

        /* 十色の輪（うすく背景に） */
        ctx.save();
        ctx.globalAlpha = 0.16;
        for (i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.strokeStyle = COLORS[i].hex;
            ctx.lineWidth = 16;
            ctx.arc(W / 2, H / 2 - 40, 215, (i * 36 - 90) * Math.PI / 180, ((i + 1) * 36 - 90) * Math.PI / 180);
            ctx.stroke();
        }
        ctx.restore();

        var mincho = '"Shippori Mincho", "Hiragino Mincho ProN", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* 御朱印（推し色の印）— 本物の御朱印のように、印を先に押して墨書きを上に */
        ctx.save();
        ctx.translate(W / 2, H / 2 - 40);
        ctx.rotate(-0.05);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color.hex;
        var r = 108;
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(-r, -r, r * 2, r * 2, 26); } else { ctx.rect(-r, -r, r * 2, r * 2); }
        ctx.fill();
        ctx.fillStyle = color.id === 'white' ? '#948a70' : '#fdf9ee';
        ctx.font = '600 140px ' + mincho;
        ctx.fillText('推', 0, 8);
        ctx.restore();

        ctx.fillStyle = '#3a2f22';

        /* 奉拝 */
        ctx.font = '600 34px ' + mincho;
        drawVertical(ctx, '奉拝', 96, 110, 44);

        /* 社名（中央・縦書き） */
        ctx.font = '600 104px ' + mincho;
        drawVertical(ctx, '十色神社', W / 2, 210, 132);

        /* 日付（右・縦書き） */
        var now = new Date();
        var dateText = kanjiNum(now.getFullYear()) + '年' + kanjiNum(now.getMonth() + 1) + '月' + kanjiNum(now.getDate()) + '日';
        ctx.fillStyle = '#3a2f22';
        ctx.font = '600 36px ' + mincho;
        drawVertical(ctx, dateText, W - 96, 320, 44);

        /* 名前（左・縦書き） */
        if (name) {
            ctx.font = '600 40px ' + mincho;
            drawVertical(ctx, name + ' 様', 96, 330, 50);
        }

        /* 下部 */
        ctx.font = '500 26px ' + mincho;
        ctx.fillStyle = color.id === 'white' ? '#948a70' : color.deep;
        ctx.fillText('あなたの推しは、何色ですか。', W / 2, H - 130);
        ctx.font = '400 20px sans-serif';
        ctx.fillStyle = '#8d8062';
        ctx.fillText('TOIRO SHRINE — ' + color.en.toUpperCase(), W / 2, H - 84);

        return cv.toDataURL('image/png');
    }
    function openGoshuin() {
        var prefill = document.getElementById('ema-name').value.trim();
        openModal(
            '<p class="modal-kicker">推し色御朱印</p>' +
            '<p class="modal-lead">お名前と今日の日付が入った、あなたの推し色の御朱印画像をお作りします。</p>' +
            '<div class="form-group"><label for="goshuin-name">お名前・ニックネーム（任意）</label>' +
            '<input type="text" id="goshuin-name" maxlength="12" value="' + prefill.replace(/["<>&]/g, '') + '" placeholder="例：あず"></div>' +
            '<button type="button" class="btn-main" id="btn-goshuin-make">御朱印をいただく</button>'
        );
        document.getElementById('btn-goshuin-make').addEventListener('click', function () {
            var name = document.getElementById('goshuin-name').value.trim();
            var render = function () {
                var url = makeGoshuin(name);
                var color = currentColor();
                var shareText = '十色神社で ' + color.jp + ' の御朱印をいただきました ⛩ あなたの推しは、何色ですか。';
                openModal(
                    '<p class="modal-kicker">推し色御朱印</p>' +
                    '<img id="goshuin-img" class="goshuin-img" src="' + url + '" alt="' + color.jp + 'の御朱印">' +
                    '<p class="modal-hint">スマホでは画像を長押しすると保存できます。保存した画像を添えてポストしてください。</p>' +
                    '<div class="modal-actions">' +
                    '<a class="pill-btn" id="btn-goshuin-save" href="' + url + '" download="toiro-goshuin.png">画像を保存</a>' +
                    '<a class="btn-x" href="' + xShareUrl(shareText) + '" target="_blank" rel="noopener">𝕏 でポストする</a>' +
                    '</div>'
                );
            };
            if (document.fonts && document.fonts.load) {
                Promise.all([
                    document.fonts.load('600 104px "Shippori Mincho"'),
                    document.fonts.load('600 36px "Shippori Mincho"')
                ]).then(render, render);
            } else {
                render();
            }
        });
    }

    /* ---- みどころカードのタップ ---- */
    function setupSpots() {
        document.querySelectorAll('.spot-tap').forEach(function (card) {
            var action = card.getAttribute('data-action');
            var run = function () {
                if (action === 'chozu') rippleChozu(card);
                else if (action === 'furin') ringFurin(card);
                else if (action === 'omikuji') openOmikuji();
                else if (action === 'goshuin') openGoshuin();
            };
            card.addEventListener('click', run);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); }
            });
        });
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-backdrop').addEventListener('click', closeModal);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });
    }

    /* ---- 初期化 ---- */
    splitKinetic(document.getElementById('gate-title'));
    setupReveal();
    setupSpots();
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
