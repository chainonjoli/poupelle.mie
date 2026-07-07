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

    var MAMORI_BLESSINGS = [
        '推しへの想いが、まっすぐ届きますように。',
        '推し活の毎日に、小さな幸運がありますように。',
        '会いたい気持ちが、いつか叶いますように。',
        '推しも自分も、健やかでありますように。',
        '今日という日に、良いご縁がありますように。',
        '無理をしすぎず、推し活を楽しめますように。'
    ];

    var STORAGE_COLOR = 'oshiiro-color';
    var STORAGE_MODE = 'oshiiro-mode';
    var STORAGE_FONTSIZE = 'oshiiro-fontsize';
    var STORAGE_EMA = 'oshiiro-ema';
    var STORAGE_ANNIV = 'oshiiro-anniversaries';
    var STORAGE_GOSHUIN_LOG = 'oshiiro-goshuin-log';
    var STORAGE_GOSHUIN_TODAY = 'oshiiro-goshuin-today';
    var MAX_EMA = 24;
    var MAX_ANNIV = 5;

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

    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    function escAttr(s) { return String(s).replace(/["<>&]/g, ''); }

    /* ---- 記念日（自分の記念日・推しの記念日を最大5件登録） ---- */
    function loadAnniversaries() { return load(STORAGE_ANNIV, []); }
    function todaysAnniversary() {
        var list = loadAnniversaries();
        var now = new Date();
        var m = now.getMonth() + 1, d = now.getDate();
        for (var i = 0; i < list.length; i++) {
            if (list[i].month === m && list[i].day === d) return list[i];
        }
        return null;
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

    /* ---- 固定の上部バーに見出しが隠れないよう、アンカー移動時の余白を実測して合わせる ---- */
    function syncScrollOffset() {
        var topbarEl = document.querySelector('.topbar');
        if (!topbarEl) return;
        document.documentElement.style.scrollPaddingTop = (topbarEl.getBoundingClientRect().height + 16) + 'px';
    }

    /* ---- 昼夜切替 ---- */
    function applyMode(mode) {
        body.setAttribute('data-mode', mode);
        document.getElementById('btn-mode').textContent =
            mode === 'night' ? '☀ 昼の参拝へ' : '🌙 夜の参拝へ';
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

    /* ---- 花手水: ふれると波紋・花びら・ご利益のことば ---- */
    var CHOZU_BLESSINGS = [
        '心が清められました ✧',
        '良いご縁が近づいています',
        '推しからの風を感じました',
        '今日の現場運が上がりました',
        '願いが水面に届きました',
        'やさしい気持ちが満ちていきます'
    ];
    function rippleChozu(card) {
        var visual = card.querySelector('.spot-visual');
        var water = card.querySelector('.water');
        var cx = water.offsetLeft + water.offsetWidth / 2;
        var cy = water.offsetTop + water.offsetHeight / 2;

        var ring = document.createElement('span');
        ring.className = 'ripple-ring';
        ring.style.left = cx + 'px';
        ring.style.top = cy + 'px';
        visual.appendChild(ring);
        ring.addEventListener('animationend', function () { ring.remove(); });

        /* 推し色の花びらが舞い上がる */
        for (var i = 0; i < 8; i++) {
            var petal = document.createElement('span');
            petal.className = 'petal-float';
            petal.style.left = cx + (Math.random() * 70 - 35) + 'px';
            petal.style.top = cy - 6 + 'px';
            petal.style.setProperty('--px', (Math.random() * 60 - 30) + 'px');
            petal.style.animationDelay = (Math.random() * 0.3) + 's';
            visual.appendChild(petal);
            petal.addEventListener('animationend', function (e) { e.target.remove(); });
        }

        /* ご利益のことば */
        var old = visual.querySelector('.chozu-msg');
        if (old) old.remove();
        var msg = document.createElement('span');
        msg.className = 'chozu-msg';
        msg.textContent = CHOZU_BLESSINGS[Math.floor(Math.random() * CHOZU_BLESSINGS.length)];
        visual.appendChild(msg);
        msg.addEventListener('animationend', function () { msg.remove(); });
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

    /* ---- 推し活みくじ ----
       ランク順は神社本庁の基本順位（大吉>吉>中吉>小吉>末吉）に準拠。
       s は星1〜5が出る確率。ランクが上なほど星も高くなるよう連動させ、
       小吉・末吉では星5が出ない（「小吉なのに星5」の違和感を防ぐ）。
       全体の星の期待値は約4.08（>= 3.9） */
    var OMIKUJI_RANKS = [
        { r: '推し大吉', w: 4,  tier: 'high', s: [0, 0, 0,    0,    1] },
        { r: '大吉',     w: 12, tier: 'high', s: [0, 0, 0,    0.25, 0.75] },
        { r: '吉',       w: 20, tier: 'mid',  s: [0, 0, 0.10, 0.45, 0.45] },
        { r: '中吉',     w: 26, tier: 'mid',  s: [0, 0, 0.20, 0.55, 0.25] },
        { r: '小吉',     w: 28, tier: 'low',  s: [0, 0, 0.25, 0.75, 0] },
        { r: '末吉',     w: 10, tier: 'low',  s: [0, 0, 0.65, 0.35, 0] }
    ];
    var LUCKY_ITEMS = [
        'ペンライト', '銀テープ', '推しのうちわ', 'トレカ', '双眼鏡',
        'モバイルバッテリー', 'マフラータオル', 'チェキ', '缶バッジ',
        '推し色のネイル', 'アクリルスタンド', '会場限定ドリンク'
    ];
    var LUCKY_ACTIONS = [
        '開演前に深呼吸を3回する',
        '推しの初期曲を聴いてから出発する',
        '遠征のお供に甘いものを持っていく',
        'SNSで推しの好きなところを一つ語る',
        '物販列では水分補給を忘れずに',
        '会場には右足から入ってみる',
        '今夜は推しの写真を見てから眠る',
        'アクスタと一緒に空の写真を撮る',
        '友だちに推しの布教をしてみる'
    ];
    /* お告げもランク帯（tier）に連動させる */
    var OMIKUJI_MSGS = {
        high: [
            '今日の現場は、最高の思い出になる予感。',
            '諦めかけたチケットに、ご縁が巡ってきそう。',
            '積んだ徳は、神席となって返ってくるでしょう。',
            '推しと目が合う日。ファンサの準備を忘れずに。'
        ],
        mid: [
            '推しの新しい一面に出会えるかも。',
            '推しの笑顔が、あなたの一週間を守ってくれます。',
            '同担との素敵な出会いがありそう。',
            '遠征の空も味方するでしょう。忘れ物にはご注意を。'
        ],
        low: [
            '今日は無理せず、おうちで推しを摂取する日。',
            '焦らなくて大丈夫。推しはずっとそこにいます。',
            '小さな幸せを集めると、大きなご縁につながります。',
            '今は充電のとき。次の現場で輝けるように。'
        ]
    };
    function drawOmikuji() {
        var total = 0, i;
        for (i = 0; i < OMIKUJI_RANKS.length; i++) total += OMIKUJI_RANKS[i].w;
        var roll = Math.random() * total;
        var entry = OMIKUJI_RANKS[0];
        for (i = 0; i < OMIKUJI_RANKS.length; i++) {
            roll -= OMIKUJI_RANKS[i].w;
            if (roll <= 0) { entry = OMIKUJI_RANKS[i]; break; }
        }
        /* ランク固有の分布から星を引く（ランクと星の整合を保証） */
        function stars() {
            var r = Math.random(), cum = 0, n = 5;
            for (var k = 0; k < 5; k++) {
                cum += entry.s[k];
                if (r < cum) { n = k + 1; break; }
            }
            return '★★★★★'.slice(0, n).padEnd(5, '☆');
        }
        var msgs = OMIKUJI_MSGS[entry.tier];
        return {
            rank: entry.r,
            msg: msgs[Math.floor(Math.random() * msgs.length)],
            item: LUCKY_ITEMS[Math.floor(Math.random() * LUCKY_ITEMS.length)],
            action: LUCKY_ACTIONS[Math.floor(Math.random() * LUCKY_ACTIONS.length)],
            luck: [
                { label: '当選運', v: stars() },
                { label: '神席運', v: stars() },
                { label: 'ファンサ運', v: stars() },
                { label: '遠征運', v: stars() }
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
        ctx.fillText('ラッキーアイテム：' + o.item, W / 2, y + 26);
        ctx.font = '500 22px ' + mincho;
        ctx.fillText('開運アクション', W / 2, y + 66);
        ctx.fillStyle = '#4a3b28';
        ctx.fillText(o.action, W / 2, y + 100);

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
        var shareText = '十色神社の推し活みくじは【' + o.rank + '】、ラッキーアイテムは「' + o.item + '」でした ⛩ あなたの推しは、何色ですか。';
        var img = makeOmikujiImage(o);
        openModal(
            '<p class="modal-kicker">推し活みくじ</p>' +
            '<div class="mikuji-paper">' +
            '<p class="mikuji-rank">' + o.rank + '</p>' +
            '<p class="mikuji-msg">' + o.msg + '</p>' +
            '<div class="mikuji-luck">' + rows + '</div>' +
            '<p class="mikuji-lucky">ラッキーアイテム：<strong>' + o.item + '</strong></p>' +
            '<p class="mikuji-lucky">開運アクション：' + o.action + '</p>' +
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

    /* ---- 記念日登録モーダル ---- */
    function openAnniversaryEditor() {
        var list = loadAnniversaries();
        var rows = [];
        for (var i = 0; i < MAX_ANNIV; i++) {
            var a = list[i] || null;
            var labelVal = a ? escAttr(a.label) : '';
            var dateVal = a ? ('2000-' + pad2(a.month) + '-' + pad2(a.day)) : '';
            rows.push(
                '<div class="form-group anniv-row">' +
                '<label for="anniv-label-' + i + '">記念日 ' + (i + 1) + '</label>' +
                '<div class="anniv-row-inputs">' +
                '<input type="text" id="anniv-label-' + i + '" maxlength="20" value="' + labelVal + '" placeholder="例：推しの生誕日">' +
                '<input type="date" id="anniv-date-' + i + '" value="' + dateVal + '">' +
                '</div></div>'
            );
        }
        openModal(
            '<p class="modal-kicker">記念日登録</p>' +
            '<p class="modal-lead">自分の記念日や推しの記念日を最大5件まで登録できます。登録した日に参拝すると、特別な御朱印と演出が現れます（年は使わず、毎年同じ月日で判定します）。</p>' +
            rows.join('') +
            '<button type="button" class="btn-main" id="btn-anniv-save">保存する</button>'
        );
        document.getElementById('btn-anniv-save').addEventListener('click', function () {
            var result = [];
            for (var i = 0; i < MAX_ANNIV; i++) {
                var label = document.getElementById('anniv-label-' + i).value.trim();
                var dateVal = document.getElementById('anniv-date-' + i).value;
                if (label && dateVal) {
                    var parts = dateVal.split('-');
                    result.push({ label: label, month: +parts[1], day: +parts[2] });
                }
            }
            save(STORAGE_ANNIV, result);
            closeModal();
            checkAnniversaryBanner();
        });
    }

    /* ---- 記念日バナー ---- */
    function checkAnniversaryBanner() {
        var aniv = todaysAnniversary();
        if (!aniv) return;
        var seenKey = 'oshiiro-aniv-seen-' + todayStr();
        if (load(seenKey, false)) return;
        save(seenKey, true);
        var el = document.createElement('div');
        el.className = 'aniv-banner';
        el.textContent = '🎉 今日は「' + aniv.label + '」の記念日です。特別な御朱印がいただけます。';
        var topbarEl = document.querySelector('.topbar');
        el.style.top = (topbarEl ? topbarEl.getBoundingClientRect().bottom + 10 : 70) + 'px';
        document.body.appendChild(el);
        setTimeout(function () { el.classList.add('show'); }, 30);
        setTimeout(function () {
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 700);
        }, 5200);
    }

    /* ---- 推し守 ---- */
    function openMamori() {
        var blessing = MAMORI_BLESSINGS[Math.floor(Math.random() * MAMORI_BLESSINGS.length)];
        openModal(
            '<p class="modal-kicker">推し守</p>' +
            '<div class="mamori-charm" aria-hidden="true">' +
            '<span class="omamori"><span class="omamori-knot"></span><span class="omamori-text">推し守</span></span>' +
            '</div>' +
            '<p class="modal-lead" style="text-align:center;">' + blessing + '</p>' +
            '<p class="modal-hint" style="text-align:center;">推し守は、何度でもこちらで授かれます。</p>'
        );
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
    function makeGoshuin(name, anivLabel) {
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
        if (anivLabel) {
            ctx.font = '600 26px ' + mincho;
            ctx.fillStyle = color.hex;
            ctx.fillText('— ' + anivLabel + ' 記念 —', W / 2, H - 172);
        }
        ctx.font = '500 26px ' + mincho;
        ctx.fillStyle = color.id === 'white' ? '#948a70' : color.deep;
        ctx.fillText('あなたの推しは、何色ですか。', W / 2, H - 130);
        ctx.font = '400 20px sans-serif';
        ctx.fillStyle = '#8d8062';
        ctx.fillText('TOIRO SHRINE — ' + color.en.toUpperCase(), W / 2, H - 84);

        return cv.toDataURL('image/png');
    }

    /* ---- 御朱印帳（参拝日をカレンダーで振り返る） ---- */
    function recordGoshuin(dateStr, img) {
        save(STORAGE_GOSHUIN_TODAY, { date: dateStr, img: img });
        var log = load(STORAGE_GOSHUIN_LOG, []);
        if (log.indexOf(dateStr) === -1) {
            log.push(dateStr);
            if (log.length > 120) log = log.slice(log.length - 120);
            save(STORAGE_GOSHUIN_LOG, log);
        }
    }
    function openGoshuinBook() {
        var log = load(STORAGE_GOSHUIN_LOG, []);
        var now = new Date();
        var y = now.getFullYear(), m = now.getMonth();
        var firstWeekday = new Date(y, m, 1).getDay();
        var daysInMonth = new Date(y, m + 1, 0).getDate();
        var cells = '';
        for (var i = 0; i < firstWeekday; i++) cells += '<span class="book-cell empty"></span>';
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = y + '-' + pad2(m + 1) + '-' + pad2(d);
            var got = log.indexOf(ds) !== -1;
            cells += '<span class="book-cell' + (got ? ' got' : '') + '">' + d + (got ? '<span class="book-stamp">推</span>' : '') + '</span>';
        }
        openModal(
            '<p class="modal-kicker">御朱印帳</p>' +
            '<p class="modal-lead">これまでに ' + log.length + ' 日、参拝しています。</p>' +
            '<p class="modal-hint">' + y + '年' + (m + 1) + '月</p>' +
            '<div class="goshuin-book">' + cells + '</div>'
        );
    }

    function showGoshuinResult(url, alreadyClaimed) {
        var color = currentColor();
        var shareText = '十色神社で ' + color.jp + ' の御朱印をいただきました ⛩ あなたの推しは、何色ですか。';
        openModal(
            '<p class="modal-kicker">推し色御朱印</p>' +
            (alreadyClaimed ? '<p class="modal-lead">本日の御朱印はいただき済みです。また明日、参拝にいらしてください。</p>' : '') +
            '<img id="goshuin-img" class="goshuin-img" src="' + url + '" alt="' + color.jp + 'の御朱印">' +
            '<p class="modal-hint">スマホでは画像を長押しすると保存できます。保存した画像を添えてポストしてください。</p>' +
            '<div class="modal-actions">' +
            '<a class="pill-btn" id="btn-goshuin-save" href="' + url + '" download="toiro-goshuin.png">画像を保存</a>' +
            '<a class="btn-x" href="' + xShareUrl(shareText) + '" target="_blank" rel="noopener">𝕏 でポストする</a>' +
            '</div>' +
            '<button type="button" class="pill-btn btn-x-small" id="btn-goshuin-book">御朱印帳を見る</button>'
        );
        document.getElementById('btn-goshuin-book').addEventListener('click', openGoshuinBook);
    }

    function openGoshuin() {
        var today = todayStr();
        var claimed = load(STORAGE_GOSHUIN_TODAY, null);
        if (claimed && claimed.date === today && claimed.img) {
            showGoshuinResult(claimed.img, true);
            return;
        }
        var prefill = document.getElementById('ema-name').value.trim();
        var aniv = todaysAnniversary();
        openModal(
            '<p class="modal-kicker">推し色御朱印</p>' +
            '<p class="modal-lead">' +
            (aniv ? '🎉 今日は「' + aniv.label + '」の記念日です。特別な御朱印をどうぞ。' : 'お名前と今日の日付が入った、あなたの推し色の御朱印画像をお作りします。') +
            ' 御朱印は1日に1枚までです。</p>' +
            '<div class="form-group"><label for="goshuin-name">お名前・ニックネーム（任意）</label>' +
            '<input type="text" id="goshuin-name" maxlength="12" value="' + escAttr(prefill) + '" placeholder="例：あず"></div>' +
            '<button type="button" class="btn-main" id="btn-goshuin-make">御朱印をいただく</button>' +
            '<button type="button" class="pill-btn btn-x-small" id="btn-goshuin-book">御朱印帳を見る</button>'
        );
        document.getElementById('btn-goshuin-book').addEventListener('click', openGoshuinBook);
        document.getElementById('btn-goshuin-make').addEventListener('click', function () {
            var name = document.getElementById('goshuin-name').value.trim();
            var render = function () {
                var url = makeGoshuin(name, aniv ? aniv.label : null);
                recordGoshuin(today, url);
                showGoshuinResult(url, false);
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
                else if (action === 'mamori') openMamori();
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
    applyFontSize(load(STORAGE_FONTSIZE, 'normal'));

    var savedColor = load(STORAGE_COLOR, null);
    if (savedColor && findColor(savedColor)) {
        chooseColor(savedColor, false);
    }
    checkAnniversaryBanner();

    syncScrollOffset();
    window.addEventListener('resize', syncScrollOffset);
    window.addEventListener('load', syncScrollOffset);

    document.getElementById('btn-recolor').addEventListener('click', reopenGate);
    document.getElementById('btn-mode').addEventListener('click', function () {
        applyMode(body.getAttribute('data-mode') === 'night' ? 'day' : 'night');
        setTimeout(syncScrollOffset, 0);
    });
    document.getElementById('btn-fontsize').addEventListener('click', function () {
        applyFontSize(document.documentElement.getAttribute('data-fontsize') === 'large' ? 'normal' : 'large');
        setTimeout(syncScrollOffset, 320);
    });
    document.getElementById('btn-anniv').addEventListener('click', openAnniversaryEditor);
    document.getElementById('btn-dedicate').addEventListener('click', dedicateEma);
})();
