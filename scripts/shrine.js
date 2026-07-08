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

    var MAMORI_BLESSINGS = [
        '推しへの想いが、まっすぐ届きますように。',
        '推し活の毎日に、小さな幸運がありますように。',
        '会いたい気持ちが、いつか叶いますように。',
        '推しも自分も、健やかでありますように。',
        '今日という日に、良いご縁がありますように。',
        '無理をしすぎず、推し活を楽しめますように。'
    ];

    var EMPATHY_WISHES = [
        '今日も推しが幸せでありますように。',
        '推しの笑顔がずっと続きますように。',
        '推しに直接ありがとうを伝えられますように。',
        '推し活を頑張る自分のことも大切にできますように。',
        '推しと過ごす時間が、これからも増えますように。',
        '推しのステージがずっと輝いていますように。',
        '遠くにいても、想いはちゃんと届きますように。',
        '無理せず、長く推し活を続けられますように。'
    ];

    var STORAGE_COLOR = 'toiro-color';
    var STORAGE_MODE = 'toiro-mode';
    var STORAGE_FONTSIZE = 'toiro-fontsize';
    var STORAGE_EMA = 'toiro-ema';
    var STORAGE_GOSHUIN_LOG = 'toiro-goshuin-log';
    var STORAGE_GOSHUIN_TODAY = 'toiro-goshuin-today';
    var STORAGE_ANNIV = 'toiro-anniversaries';
    var MAX_EMA = 24;
    var MAX_ANNIV = 5;
    var PAGE_URL = 'https://chainonjoli.github.io/poupelle.mie/shrine.html';

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
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    function currentColor() { return findColor(body.getAttribute('data-color')) || COLORS[0]; }

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
    function nextOccurrenceDays(month, day) {
        var now = new Date();
        var todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var target = new Date(now.getFullYear(), month - 1, day);
        if (target < todayZero) target = new Date(now.getFullYear() + 1, month - 1, day);
        return Math.round((target - todayZero) / 86400000);
    }

    /* ---- 推しカラーごとの参拝者数（目安のシミュレーション値。日替わりで変化する） ---- */
    function estimatedVisitors(colorId) {
        var str = colorId + '-' + dayOfYear();
        var seed = 0;
        for (var i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
        return 820 + (seed % 4200);
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
        renderMamoriCard();
        renderGoshuinArea();
        renderGoshuinBook();
        renderAnnivRows();
        renderAnnivList();
        renderEmpathyFeed();
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
        renderMamoriCard();
        renderEmpathyFeed();
    }

    /* ---- 4. お守りページ ---- */
    function renderMamoriCard() {
        var color = currentColor();
        var now = new Date();
        var dateText = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
        var latestEma = emaList[0];
        var theme = latestEma ? latestEma.wish : 'まだ願いごとが書かれていません';
        var blessing = MAMORI_BLESSINGS[Math.floor(Math.random() * MAMORI_BLESSINGS.length)];
        var card = document.getElementById('mamori-card');
        card.innerHTML =
            '<p class="mamori-title">推し守</p>' +
            '<p class="mamori-blessing">' + blessing + '</p>' +
            '<div class="mamori-meta">' +
            '<p>日付：<strong>' + dateText + '</strong></p>' +
            '<p>推しカラー：<strong>' + color.jp + '</strong></p>' +
            '<p>願いのテーマ：<strong>' + theme + '</strong></p>' +
            '</div>';
    }

    /* ---- 5. 御朱印ページ ---- */
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
    function wrapCenterText(ctx, text, x, y, lineHeight, maxWidth) {
        var lines = [];
        var line = '';
        for (var i = 0; i < text.length; i++) {
            var test = line + text[i];
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = text[i];
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        var startY = y - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach(function (l, idx) { ctx.fillText(l, x, startY + idx * lineHeight); });
    }
    function makeGoshuin(name, wish, visitCount, anivLabel) {
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
        ctx.fillStyle = 'rgba(60, 50, 30, 0.04)';
        for (var i = 0; i < 700; i++) {
            ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
        }

        /* 二重枠（通常は墨＋推し色。記念日は金の限定仕様） */
        var GOLD = '#b8923a';
        if (anivLabel) {
            ctx.strokeStyle = GOLD;
            ctx.lineWidth = 3;
            ctx.strokeRect(28, 28, W - 56, H - 56);
            ctx.lineWidth = 1;
            ctx.strokeRect(40, 40, W - 80, H - 80);
            /* 四隅の飾り（金の小さな山形） */
            ctx.lineWidth = 2;
            [[52, 52, 1, 1], [W - 52, 52, -1, 1], [52, H - 52, 1, -1], [W - 52, H - 52, -1, -1]].forEach(function (c) {
                ctx.beginPath();
                ctx.moveTo(c[0] + 22 * c[2], c[1]);
                ctx.lineTo(c[0], c[1]);
                ctx.lineTo(c[0], c[1] + 22 * c[3]);
                ctx.stroke();
            });
        } else {
            ctx.strokeStyle = '#3a2f22';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, W - 60, H - 60);
            ctx.strokeStyle = color.hex;
            ctx.lineWidth = 1;
            ctx.strokeRect(42, 42, W - 84, H - 84);
        }

        var mincho = '"Shippori Mincho", "Hiragino Mincho ProN", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* 推しカラーの角印（中央の縦書き社名と重ならない位置に） */
        ctx.save();
        ctx.translate(W / 2, H / 2 + 195);
        ctx.rotate(-0.04);
        ctx.fillStyle = color.hex;
        var r = 85;
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(-r, -r, r * 2, r * 2, 10); } else { ctx.rect(-r, -r, r * 2, r * 2); }
        ctx.fill();
        ctx.fillStyle = '#fdf9ee';
        ctx.font = '600 110px ' + mincho;
        ctx.fillText('推', 0, 5);
        ctx.restore();

        ctx.fillStyle = '#3a2f22';
        ctx.font = '600 32px ' + mincho;
        drawVertical(ctx, '奉拝', 92, 108, 42);

        ctx.font = '600 96px ' + mincho;
        drawVertical(ctx, '十色神社', W / 2, 200, 124);

        var now = new Date();
        var dateText = kanjiNum(now.getFullYear()) + '年' + kanjiNum(now.getMonth() + 1) + '月' + kanjiNum(now.getDate()) + '日';
        ctx.font = '600 34px ' + mincho;
        drawVertical(ctx, dateText, W - 92, 300, 42);

        if (name) {
            ctx.font = '600 38px ' + mincho;
            drawVertical(ctx, name + ' 様', 92, 320, 48);
        }

        /* 願いごと */
        ctx.font = '500 26px ' + mincho;
        ctx.fillStyle = color.hex;
        wrapCenterText(ctx, wish || '推しへの想いとともに', W / 2, H - 190, 34, 560);

        if (anivLabel) {
            ctx.font = '600 22px ' + mincho;
            ctx.fillStyle = GOLD;
            ctx.fillText('— ' + anivLabel + ' 記念 —', W / 2, H - 140);
            /* 右上に「限定」の小さな記し */
            ctx.font = '600 20px ' + mincho;
            drawVertical(ctx, '限定', W - 92, 108, 26);
        }

        ctx.font = '500 24px ' + mincho;
        ctx.fillStyle = '#6d6350';
        ctx.fillText('参拝 ' + visitCount + '回目', W / 2, H - 108);
        ctx.font = '400 18px sans-serif';
        ctx.fillText('TOIRO SHRINE — ' + color.jp.toUpperCase(), W / 2, H - 76);

        return cv.toDataURL('image/png');
    }

    function recordVisit(dateStr) {
        var log = load(STORAGE_GOSHUIN_LOG, []);
        if (log.indexOf(dateStr) === -1) {
            log.push(dateStr);
            save(STORAGE_GOSHUIN_LOG, log);
        }
        return log;
    }

    function shareGoshuin() {
        var text = '十色神社で今日の推し色御朱印をいただきました。';
        if (navigator.share) {
            navigator.share({ text: text, url: PAGE_URL }).catch(function () { /* ユーザーがキャンセルした場合など */ });
        } else {
            window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(PAGE_URL), '_blank', 'noopener');
        }
    }

    function showGoshuinResult(img, alreadyClaimed) {
        var area = document.getElementById('goshuin-area');
        area.innerHTML =
            (alreadyClaimed ? '<p class="goshuin-note">本日の御朱印はいただき済みです。また明日、参拝にいらしてください。</p>' : '') +
            '<img class="goshuin-img" src="' + img + '" alt="今日の推し色御朱印">' +
            '<div class="goshuin-actions">' +
            '<a class="pill-btn" id="btn-goshuin-save" href="' + img + '" download="toiro-goshuin.png">画像として保存</a>' +
            '<button type="button" class="pill-btn" id="btn-goshuin-share">SNSで共有</button>' +
            '</div>';
        document.getElementById('btn-goshuin-share').addEventListener('click', shareGoshuin);
    }

    function claimGoshuin() {
        var today = todayStr();
        var latestEma = emaList[0];
        var name = latestEma ? latestEma.name : '';
        var wish = latestEma ? latestEma.wish : '';
        var aniv = todaysAnniversary();
        var log = recordVisit(today);
        var img = makeGoshuin(name, wish, log.length, aniv ? aniv.label : null);
        save(STORAGE_GOSHUIN_TODAY, { date: today, img: img });
        showGoshuinResult(img, false);
        renderGoshuinBook();
    }

    function renderGoshuinArea() {
        var today = todayStr();
        var claimed = load(STORAGE_GOSHUIN_TODAY, null);
        if (claimed && claimed.date === today && claimed.img) {
            showGoshuinResult(claimed.img, true);
            return;
        }
        var aniv = todaysAnniversary();
        var area = document.getElementById('goshuin-area');
        area.innerHTML =
            (aniv ? '<p class="goshuin-note aniv">🎉 今日は「' + aniv.label + '」の記念日です。特別な御朱印をどうぞ。</p>' : '') +
            '<button id="btn-goshuin-make" class="btn-main btn-block" type="button">御朱印をいただく</button>';
        document.getElementById('btn-goshuin-make').addEventListener('click', claimGoshuin);
    }

    /* ---- 6. 御朱印帳ページ ---- */
    function computeStreak(log) {
        var set = {};
        log.forEach(function (d) { set[d] = true; });
        var streak = 0;
        var cursor = new Date();
        if (!set[todayStr()]) cursor.setDate(cursor.getDate() - 1);
        while (true) {
            var ds = cursor.getFullYear() + '-' + pad2(cursor.getMonth() + 1) + '-' + pad2(cursor.getDate());
            if (set[ds]) { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
        }
        return streak;
    }

    /* 御朱印帳の表示中の月（月送りで過去の参拝を振り返れる） */
    var bookView = { year: new Date().getFullYear(), month: new Date().getMonth() };

    function shiftBookMonth(delta) {
        var d = new Date(bookView.year, bookView.month + delta, 1);
        var now = new Date();
        if (d > new Date(now.getFullYear(), now.getMonth(), 1)) return; /* 未来の月へは進めない */
        bookView.year = d.getFullYear();
        bookView.month = d.getMonth();
        renderGoshuinBook();
    }

    function renderGoshuinBook() {
        var log = load(STORAGE_GOSHUIN_LOG, []);
        var streak = computeStreak(log);
        document.getElementById('goshuinbook-lead').textContent = 'これまでに ' + log.length + ' 日、参拝しています。';

        var badges = [
            { need: 7, label: '7日連続参拝' },
            { need: 30, label: '30日連続参拝' }
        ];
        var badgesEl = document.getElementById('streak-badges');
        badgesEl.innerHTML = '';
        badges.forEach(function (b) {
            var achieved = streak >= b.need;
            var el = document.createElement('span');
            el.className = 'streak-badge' + (achieved ? ' achieved' : '');
            el.textContent = (achieved ? '✓ ' : '') + b.label;
            badgesEl.appendChild(el);
        });

        var now = new Date();
        var y = bookView.year, m = bookView.month;
        document.getElementById('goshuinbook-month').textContent = y + '年' + (m + 1) + '月';
        var isCurrentMonth = (y === now.getFullYear() && m === now.getMonth());
        document.getElementById('btn-book-next').disabled = isCurrentMonth;
        var firstWeekday = new Date(y, m, 1).getDay();
        var daysInMonth = new Date(y, m + 1, 0).getDate();
        var grid = document.getElementById('goshuinbook-grid');
        grid.innerHTML = '';
        for (var i = 0; i < firstWeekday; i++) {
            var empty = document.createElement('span');
            empty.className = 'book-cell empty';
            grid.appendChild(empty);
        }
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = y + '-' + pad2(m + 1) + '-' + pad2(d);
            var got = log.indexOf(ds) !== -1;
            var cell = document.createElement('span');
            cell.className = 'book-cell' + (got ? ' got' : '');
            cell.textContent = d;
            grid.appendChild(cell);
        }
    }

    /* ---- 7. 記念日登録ページ ---- */
    function renderAnnivRows() {
        var list = loadAnniversaries();
        var wrap = document.getElementById('anniv-rows');
        wrap.innerHTML = '';
        for (var i = 0; i < MAX_ANNIV; i++) {
            var a = list[i] || null;
            var labelVal = a ? escAttr(a.label) : '';
            var dateVal = a ? ('2000-' + pad2(a.month) + '-' + pad2(a.day)) : '';
            var row = document.createElement('div');
            row.className = 'form-group anniv-row';
            row.innerHTML =
                '<label for="anniv-label-' + i + '">記念日 ' + (i + 1) + '</label>' +
                '<div class="anniv-row-inputs">' +
                '<input type="text" id="anniv-label-' + i + '" maxlength="20" value="' + labelVal + '" placeholder="例：推しの生誕日">' +
                '<input type="date" id="anniv-date-' + i + '" value="' + dateVal + '">' +
                '</div>';
            wrap.appendChild(row);
        }
    }

    function renderAnnivList() {
        var list = loadAnniversaries();
        var wrap = document.getElementById('anniv-list');
        if (!list.length) {
            wrap.innerHTML = '<p class="anniv-empty">まだ記念日が登録されていません。</p>';
            return;
        }
        var withDiff = list.map(function (a) { return { a: a, diff: nextOccurrenceDays(a.month, a.day) }; });
        withDiff.sort(function (x, y) { return x.diff - y.diff; });
        wrap.innerHTML = withDiff.map(function (item) {
            var countText = item.diff === 0 ? '今日' : 'あと ' + item.diff + ' 日';
            return '<div class="anniv-card' + (item.diff === 0 ? ' today' : '') + '">' +
                '<p class="anniv-card-label">' + item.a.label + '</p>' +
                '<p class="anniv-card-count">' + countText + '</p>' +
                '</div>';
        }).join('');
    }

    function saveAnniversaries() {
        var result = [];
        for (var i = 0; i < MAX_ANNIV; i++) {
            var label = document.getElementById('anniv-label-' + i).value.trim();
            var dateVal = document.getElementById('anniv-date-' + i).value;
            if (label && dateVal) {
                var parts = dateVal.split('-');
                result.push({ label: escAttr(label), month: +parts[1], day: +parts[2] });
            }
        }
        save(STORAGE_ANNIV, result);
        renderAnnivList();
        renderGoshuinArea();
    }

    /* ---- 8. 共感ページ ---- */
    function renderEmpathyFeed() {
        var color = currentColor();
        document.getElementById('empathy-color-name').textContent = color.jp;
        document.getElementById('empathy-count').textContent =
            '全国で今日、' + estimatedVisitors(color.id).toLocaleString() + ' 人が' + color.jp + 'の参道を歩いています。（※目安の人数です）';

        var mine = emaList.slice(0, 6).map(function (item) { return item.wish; });
        var combined = mine.concat(EMPATHY_WISHES).slice(0, 10);
        var feed = document.getElementById('empathy-feed');
        feed.innerHTML = '';
        combined.forEach(function (wish) {
            var line = document.createElement('p');
            line.className = 'empathy-line';
            line.textContent = '「' + wish + '」';
            feed.appendChild(line);
        });
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
    document.getElementById('btn-mamori-renew').addEventListener('click', renderMamoriCard);
    document.getElementById('btn-anniv-save').addEventListener('click', saveAnniversaries);
    document.getElementById('btn-book-prev').addEventListener('click', function () { shiftBookMonth(-1); });
    document.getElementById('btn-book-next').addEventListener('click', function () { shiftBookMonth(1); });

    /* ---- 参道へもどる（1画面分スクロールしたら現れる） ---- */
    var backBtn = document.getElementById('btn-backtotop');
    backBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
        backBtn.classList.toggle('show', window.scrollY > window.innerHeight && !main.classList.contains('hidden'));
    }, { passive: true });
})();
