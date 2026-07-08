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

    /* 日替わりのひとこと。毎日参拝する人が「見たことある」に当たりにくいよう
       約100日で一巡する在庫を持つ */
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
        '今日という日を、そっと記録しておきましょう。',
        '推しの笑顔を思い出した瞬間、今日はもう良い日です。',
        '遠くにいても、想いは光のように届いています。',
        '今日のあなたが元気でいることも、立派な推し活です。',
        '好きなものを好きと言える毎日で、ありますように。',
        '推しの声を思い出せるうちは、心は近くにあります。',
        '今日は、推しの写真を一枚だけ見返してみませんか。',
        'あなたの応援は、ちゃんと誰かの力になっています。',
        '推しの頑張りに、今日のあなたの頑張りを重ねて。',
        '会えない日々も、好きでいる時間は積もっていきます。',
        '今日という日は、二度と来ない推し活の一日です。',
        '雨の日も、推しの色を思えば少し明るくなります。',
        '推しを見つけたあの日の自分に、ありがとうを。',
        '好きなものの話をする時のあなたは、きっと輝いています。',
        '推し活に正解はありません。あなたの形がいちばんです。',
        '今日の小さな幸せを、ひとつだけ数えてみましょう。',
        '推しの新しい報せが、良いものでありますように。',
        '待つ時間も、推し活のたいせつな一部です。',
        '今日のあなたの「好き」は、昨日より少し深い。',
        '無理はせず、でも好きは諦めず。それでいきましょう。',
        '推しの色を身につけると、背筋が少し伸びますね。',
        '想いを言葉にした分だけ、記憶は色濃く残ります。',
        '今日は自分にも、推しにあげるくらいの優しさを。',
        'あなたの推し語りを、聞きたい人がきっといます。',
        '遠征の計画を立てる夜も、もう旅の一部です。',
        '推しの過去の映像も、今日見ればそれは今日の思い出。',
        '好きでいることに、理由はいりません。',
        '今日も参道の灯りは、あなたの色で灯っています。',
        '推しの誕生日を数える日々が、あなたの暦になります。',
        'グッズを飾ったその棚が、あなたの小さな社です。',
        '当落の報せの前は、深呼吸をひとつ。',
        '推しが今日も無事でありますように。あなたも。',
        '「尊い」の一言に、今日の全部が詰まっています。',
        '思い出は増える一方で、減ることはありません。',
        '今日の参拝が、いつか懐かしい一日になりますように。',
        '推しの努力を知っているから、あなたも頑張れる。',
        '好きなものが同じ人と、いつか静かに語れますように。',
        '推し色の空を見つけたら、それは良い兆しです。',
        '現場のない日も、心の中にステージはあります。',
        '積み重ねた「好き」の日々は、裏切りません。',
        '推しの写真の整理は、思い出の棚卸しです。',
        '今日のあなたの一日に、推しの分も幸あれ。',
        '声に出さない応援も、ちゃんと応援です。',
        '推しを好きな自分のことも、好きでいてください。',
        '新しいグッズの開封は、いつだって小さな祭りです。',
        'ライブの余韻は、何日でも味わっていいのです。',
        '推しの言葉に救われた日のことを、忘れずに。',
        '今日は推しの好きなものを、あなたも食べてみる日。',
        '遠い空の下、同じ推しを想う人がきっといます。',
        '寝る前の推し想いは、良い夢への近道です。',
        '推し活の予定がある月は、暦がきらめいて見えます。',
        'チケットの半券も、立派な宝物です。',
        '推しの成長を見守れることは、しあわせなことです。',
        '今日の疲れは、推しの声で少し軽くなります。',
        '「また明日も好きでいよう」それだけで十分です。',
        '推しに恥じない自分でいたい、その気持ちが尊い。',
        '応援うちわを作る夜なべも、愛の形です。',
        '推しの記念日が近づくと、心の準備が始まりますね。',
        '好きが高じて広がった世界を、大切に。',
        '推しのいる時代に生まれたことに、感謝を。',
        '今日の「好き」を明日に持ち越して、また参拝へ。',
        '推し色のものを一つ持って出かけると、御守りになります。',
        '誰かの推し語りに頷ける日は、良い日です。',
        '推しの活躍を祈る心は、そのまま祈りです。',
        '長く好きでいるために、今日はゆっくり休むのも吉。',
        '初めて推しを知った日のときめきを、時々思い出して。',
        '推しからもらった元気は、ちゃんと生活に使いましょう。',
        '「好き」を書き残すと、未来の自分への手紙になります。',
        '今日すれ違った誰かも、誰かの推しかもしれません。',
        '推し活の数だけ、あなたの人生は彩られています。',
        '発表を待つ間のそわそわも、あとで良い思い出に。',
        '推しの見る景色を、いつかあなたも見られますように。',
        '心が疲れた日は、推しの優しい場面だけを見る日に。',
        '推しの名前を綺麗な字で書けると、少し嬉しい。',
        '過去の自分の絵馬を見返すと、歩いた道が見えます。',
        '今日の参拝も、ちゃんと積み重なっています。',
        '推しへの「ありがとう」は、何度言ってもいい言葉です。',
        '遠征の朝の高揚感は、何度味わっても新しい。',
        '推しがくれた「初めて」を、いくつ数えられますか。',
        '好きなものを守るために、まず自分を守ってください。',
        '推しの色が街で目に入る日は、少し得した気分に。',
        '「今日も好きだ」と思えたら、それが今日の収穫です。',
        '推し活仲間の幸せも、そっと祈れるあなたは素敵です。',
        'いつかの神席を夢見る夜も、幸せのうちです。',
        '推しの休養の報せは、安心して見送りましょう。',
        'あなたの「好き」は、この境内が覚えています。',
        '明日の参拝でも、お待ちしています。'
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
    var STORAGE_GOSHUIN_RECORDS = 'toiro-goshuin-records';
    var STORAGE_ANNIV = 'toiro-anniversaries';
    var STORAGE_OSHI_PROFILE = 'toiro-oshi-profile';
    var STORAGE_MIKUJI = 'toiro-mikuji';
    var MAX_EMA = 24;
    var MAX_ANNIV = 5;
    var PAGE_URL = 'https://chainonjoli.github.io/poupelle.mie/shrine.html';

    /* お賽銭の決済リンク。Stripe Payment Link / OFUSE / Ko-fi などのURLを
       ここに設定すると、境内に「お賽銭」のセクションが現れる。
       空のままなら表示されない。 */
    var SAISEN_URL = '';

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
        renderMemory();
        renderMikujiArea();
        renderCountdown();
        restoreOshiProfile();
        renderFirstGuide();
        renderBackupReminder();
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

    function toggleFulfilled(index) {
        if (!emaList[index]) return;
        emaList[index].fulfilled = !emaList[index].fulfilled;
        saveEma();
        renderEmaRack();
    }

    function renderEmaRack() {
        var rack = document.getElementById('ema-rack');
        rack.innerHTML = '';
        emaList.forEach(function (item, index) {
            var plaque = document.createElement('div');
            plaque.className = 'ema-plaque' + (item.fulfilled ? ' fulfilled' : '');
            plaque.style.setProperty('--ema', findColor(item.color) ? findColor(item.color).hex : 'var(--gold)');
            var wishEl = document.createElement('p');
            wishEl.className = 'ema-wish-text';
            wishEl.textContent = item.wish;
            var sigEl = document.createElement('p');
            sigEl.className = 'ema-signature';
            sigEl.textContent = (item.name || '名無し') + ' より';
            plaque.appendChild(wishEl);
            plaque.appendChild(sigEl);
            if (item.fulfilled) {
                var seal = document.createElement('span');
                seal.className = 'ema-kanau-seal';
                seal.textContent = '叶';
                seal.setAttribute('aria-label', '叶いました');
                plaque.appendChild(seal);
            }
            var toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'ema-kanau-btn';
            toggleBtn.textContent = item.fulfilled ? '取り消す' : '叶いました';
            toggleBtn.addEventListener('click', function () { toggleFulfilled(index); });
            plaque.appendChild(toggleBtn);
            rack.appendChild(plaque);
        });
    }

    /* ---- あの日の願いとの再会（30日以上前の絵馬をそっと差し出す） ---- */
    function renderMemory() {
        var card = document.getElementById('memory-card');
        var now = new Date();
        var todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var best = null;
        var bestScore = -1;
        emaList.forEach(function (item) {
            if (!item.date) return;
            var d = new Date(item.date);
            if (isNaN(d)) return;
            var days = Math.round((todayZero - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
            if (days < 30) return;
            /* 一年前・半年前・三月前・一月前の「節目」を優先し、なければ最も古いもの */
            var score = days;
            if (Math.abs(days - 365) <= 5) score += 100000;
            else if (Math.abs(days - 180) <= 5) score += 50000;
            else if (Math.abs(days - 90) <= 5) score += 20000;
            else if (Math.abs(days - 30) <= 3) score += 10000;
            if (score > bestScore) { bestScore = score; best = { item: item, days: days }; }
        });
        if (!best) { card.classList.add('hidden'); return; }
        var label;
        if (Math.abs(best.days - 365) <= 5) label = '一年前の今日';
        else if (Math.abs(best.days - 180) <= 5) label = '半年前の今日';
        else if (Math.abs(best.days - 90) <= 5) label = '三月前の今日';
        else if (Math.abs(best.days - 30) <= 3) label = 'ひと月前の今日';
        else label = best.days + '日前';
        card.innerHTML = '';
        var kicker = document.createElement('p');
        kicker.className = 'memory-kicker';
        kicker.textContent = label + '、あなたはこう願っていました。';
        var wishEl = document.createElement('p');
        wishEl.className = 'memory-wish';
        wishEl.textContent = '「' + best.item.wish + '」';
        var note = document.createElement('p');
        note.className = 'memory-note';
        note.textContent = 'その願いは、いま どうなりましたか。叶っていたら、絵馬掛けで「叶いました」の印を。';
        card.appendChild(kicker);
        card.appendChild(wishEl);
        card.appendChild(note);
        card.classList.remove('hidden');
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
        renderFirstGuide();
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
    /* ---- 季節の意匠（月ごとに差し替え可能。新しい月の意匠はここに追加する） ---- */
    function drawPetal(ctx, x, y, scale, rot, fill) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.quadraticCurveTo(9, -4, 0, 12);
        ctx.quadraticCurveTo(-9, -4, 0, -12);
        ctx.fill();
        ctx.restore();
    }
    function drawSpring(ctx, W, H) {
        /* 桜の花びら */
        [[86, 150, 1.1, 0.4], [130, 105, 0.8, -0.6], [615, 130, 1.0, 0.9], [650, 190, 0.7, -0.3],
         [95, 850, 0.9, 1.2], [640, 870, 1.1, -0.8], [600, 915, 0.7, 0.5]].forEach(function (p) {
            drawPetal(ctx, p[0], p[1], p[2], p[3], 'rgba(222, 158, 176, 0.55)');
        });
    }
    function drawSummer(ctx, W, H) {
        /* 青海波（下辺に静かな波） */
        ctx.strokeStyle = 'rgba(120, 158, 184, 0.4)';
        ctx.lineWidth = 2;
        for (var row = 0; row < 2; row++) {
            for (var x = 70; x <= W - 70; x += 64) {
                ctx.beginPath();
                ctx.arc(x + (row % 2 ? 32 : 0), H - 66 + row * 18, 30, Math.PI, 0);
                ctx.stroke();
            }
        }
    }
    function drawAutumn(ctx, W, H) {
        /* 紅葉の葉 */
        [[95, 130, 1.0, 0.5, '#c9773a'], [140, 175, 0.75, -0.9, '#b3543a'], [625, 110, 0.9, 1.1, '#b3543a'],
         [590, 165, 0.7, 0.2, '#c9773a'], [100, 870, 0.85, -0.5, '#c9773a'], [635, 880, 1.0, 0.8, '#b3543a']].forEach(function (p) {
            ctx.save();
            ctx.translate(p[0], p[1]);
            ctx.rotate(p[3]);
            ctx.scale(p[2], p[2]);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = p[4];
            for (var i = 0; i < 5; i++) {
                ctx.save();
                ctx.rotate((i - 2) * 0.55);
                ctx.beginPath();
                ctx.moveTo(0, 2);
                ctx.lineTo(-4, -8);
                ctx.lineTo(0, -16);
                ctx.lineTo(4, -8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        });
    }
    function drawWinter(ctx, W, H) {
        /* 雪（結晶と粉雪） */
        ctx.strokeStyle = 'rgba(148, 168, 186, 0.5)';
        ctx.lineWidth = 1.5;
        [[100, 135, 13], [630, 115, 16], [585, 175, 9], [120, 865, 15], [640, 875, 11]].forEach(function (p) {
            for (var i = 0; i < 3; i++) {
                var a = i * Math.PI / 3 + 0.3;
                ctx.beginPath();
                ctx.moveTo(p[0] - Math.cos(a) * p[2], p[1] - Math.sin(a) * p[2]);
                ctx.lineTo(p[0] + Math.cos(a) * p[2], p[1] + Math.sin(a) * p[2]);
                ctx.stroke();
            }
        });
        ctx.fillStyle = 'rgba(148, 168, 186, 0.35)';
        [[160, 110, 3], [600, 145, 2.5], [90, 190, 2], [660, 850, 3], [95, 900, 2.5]].forEach(function (p) {
            ctx.beginPath();
            ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
            ctx.fill();
        });
    }
    /* 月→意匠。特定の月だけ特別な意匠に差し替えたい場合はこの表に追加する */
    var MONTHLY_MOTIFS = {
        1: drawWinter, 2: drawWinter, 3: drawSpring, 4: drawSpring, 5: drawSpring,
        6: drawSummer, 7: drawSummer, 8: drawSummer,
        9: drawAutumn, 10: drawAutumn, 11: drawAutumn, 12: drawWinter
    };

    /* 連続参拝の詣で印（限定の証） */
    function streakTierLabel(streak) {
        if (streak >= 100) return '百日詣';
        if (streak >= 30) return '三十日詣';
        if (streak >= 7) return '七日詣';
        return null;
    }

    /* 明朝体の読み込みを待ってから描く（初回訪問時に代替フォントで
       描かれてしまうのを防ぐ） */
    function withFonts(cb) {
        if (document.fonts && document.fonts.load) {
            Promise.all([
                document.fonts.load('600 90px "Shippori Mincho"'),
                document.fonts.load('400 19px "Noto Serif JP"')
            ]).then(cb, cb);
        } else {
            cb();
        }
    }

    /* rec = { name, wish, visit, aniv, color(色ID), date('YYYY-MM-DD'),
               oshi(推しの名前), group, live, streak }
       過去の御朱印も、この記録から同じ絵柄を再生成できる。
       opts.noSeal: 朱印を押す前の姿（授与の儀式演出用） */
    function makeGoshuin(rec, opts) {
        var name = rec.name;
        var wish = rec.wish;
        var visitCount = rec.visit;
        var anivLabel = rec.aniv;
        var color = findColor(rec.color) || currentColor();
        var W = 720, H = 1000;
        var SCALE = 2; /* シェア・印刷に耐える高解像度で出力 */
        var cv = document.createElement('canvas');
        cv.width = W * SCALE; cv.height = H * SCALE;
        var ctx = cv.getContext('2d');
        ctx.scale(SCALE, SCALE);

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

        var dateParts0 = (rec.date || todayStr()).split('-');
        var motif = MONTHLY_MOTIFS[+dateParts0[1]];
        if (motif) motif(ctx, W, H);

        var mincho = '"Shippori Mincho", "Hiragino Mincho ProN", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* 角印（推しの名前が入っていれば名前のハンコに。
           本物の印章と同じく朱色で、右の列から上→下へ文字を刻む） */
        var VERMILION = '#c43124';
        if (!(opts && opts.noSeal)) {
            ctx.save();
            ctx.translate(W / 2, H / 2 + 160);
            ctx.rotate(-0.04);
            ctx.fillStyle = VERMILION;
            var r = 75;
            ctx.beginPath();
            if (ctx.roundRect) { ctx.roundRect(-r, -r, r * 2, r * 2, 10); } else { ctx.rect(-r, -r, r * 2, r * 2); }
            ctx.fill();
            ctx.fillStyle = '#fdf9ee';
            var sealText = rec.oshi || '推';
            var sealChars = Array.from(sealText);
            var cols = Math.ceil(Math.sqrt(sealChars.length));
            var rows = Math.ceil(sealChars.length / cols);
            var cell = (r * 2 - 26) / Math.max(cols, rows);
            ctx.font = '600 ' + Math.floor(cell * 0.86) + 'px ' + mincho;
            sealChars.forEach(function (ch, idx) {
                var colIdx = Math.floor(idx / rows);       /* 右の列から */
                var rowIdx = idx % rows;                   /* 上から下へ */
                var x = ((cols - 1) / 2 - colIdx) * cell;
                var y = (rowIdx - (rows - 1) / 2) * cell;
                ctx.fillText(ch, x, y + cell * 0.04);
            });
            ctx.restore();
        }

        ctx.fillStyle = '#3a2f22';
        ctx.font = '600 32px ' + mincho;
        drawVertical(ctx, '奉拝', 92, 108, 42);

        ctx.font = '600 90px ' + mincho;
        drawVertical(ctx, '十色神社', W / 2, 185, 116);

        var dateParts = (rec.date || todayStr()).split('-');
        var dateText = kanjiNum(+dateParts[0]) + '年' + kanjiNum(+dateParts[1]) + '月' + kanjiNum(+dateParts[2]) + '日';
        ctx.font = '600 34px ' + mincho;
        drawVertical(ctx, dateText, W - 92, 300, 42);

        if (name) {
            ctx.font = '600 38px ' + mincho;
            drawVertical(ctx, name + ' 様', 92, 320, 48);
        }

        /* グループ名・ライブ名（推しの名前は角印に刻まれるため文字では重ねない） */
        var subParts = [];
        if (rec.group) subParts.push(rec.group);
        if (rec.live) subParts.push(rec.live);
        if (subParts.length) {
            ctx.font = '400 19px ' + mincho;
            ctx.fillStyle = '#8d8062';
            ctx.fillText(subParts.join(' ｜ '), W / 2, H - 200);
        }

        /* 願いごと */
        ctx.font = '500 25px ' + mincho;
        ctx.fillStyle = color.hex;
        wrapCenterText(ctx, wish || '推しへの想いとともに', W / 2, H - 160, 32, 560);

        if (anivLabel) {
            ctx.font = '600 20px ' + mincho;
            ctx.fillStyle = GOLD;
            ctx.fillText('— ' + anivLabel + ' 記念 —', W / 2, H - 118);
            /* 右上に「限定」の小さな記し */
            drawVertical(ctx, '限定', W - 92, 108, 26);
        }

        /* 参拝回数と、連続参拝の詣で印 */
        var tier = streakTierLabel(rec.streak || 0);
        var visitText = '参拝 ' + visitCount + '回目';
        ctx.font = '500 22px ' + mincho;
        if (tier) {
            var tierText = ' ・ ' + tier;
            var w1 = ctx.measureText(visitText).width;
            var w2 = ctx.measureText(tierText).width;
            var startX = W / 2 - (w1 + w2) / 2;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#6d6350';
            ctx.fillText(visitText, startX, H - 86);
            ctx.fillStyle = GOLD;
            ctx.fillText(tierText, startX + w1, H - 86);
            ctx.textAlign = 'center';
        } else {
            ctx.fillStyle = '#6d6350';
            ctx.fillText(visitText, W / 2, H - 86);
        }
        ctx.font = '400 16px sans-serif';
        ctx.fillStyle = '#8d8062';
        ctx.fillText('TOIRO SHRINE — ' + color.jp.toUpperCase(), W / 2, H - 56);

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

    function showGoshuinResult(img, alreadyClaimed, noteText) {
        var area = document.getElementById('goshuin-area');
        var note = noteText || (alreadyClaimed ? '本日の御朱印はいただき済みです。上の欄で推しのお名前を入れ直したら、「入力内容を反映し直す」で今日の1枚にすぐ反映できます。' : '');
        area.innerHTML =
            (note ? '<p class="goshuin-note">' + note + '</p>' : '') +
            '<img class="goshuin-img" src="' + img + '" alt="今日の推し色御朱印">' +
            '<div class="goshuin-actions">' +
            '<a class="pill-btn" id="btn-goshuin-save" href="' + img + '" download="toiro-goshuin.png">画像として保存</a>' +
            '<button type="button" class="pill-btn" id="btn-goshuin-share">SNSで共有</button>' +
            '<button type="button" class="pill-btn" id="btn-goshuin-refresh">入力内容を反映し直す</button>' +
            '</div>';
        document.getElementById('btn-goshuin-share').addEventListener('click', shareGoshuin);
        document.getElementById('btn-goshuin-refresh').addEventListener('click', refreshTodayGoshuin);
    }

    /* 御朱印をいただいた後に推しの名前などを入れ直しても、
       今日の1枚にすぐ反映できる（発行枚数は増えない） */
    function refreshTodayGoshuin() {
        var today = todayStr();
        var records = loadGoshuinRecords();
        var rec = records[today];
        if (!rec) {
            /* 旧バージョンで御朱印を取得済みの場合、絵柄の記録が残っていない。
               その場で記録を作り直して反映できるようにする */
            var log = recordVisit(today);
            var aniv = todaysAnniversary();
            rec = {
                name: '', wish: '', visit: log.length,
                aniv: aniv ? aniv.label : null,
                color: currentColor().id, date: today,
                streak: computeStreak(log)
            };
        }
        saveOshiProfile();
        var profile = loadOshiProfile();
        var latestEma = emaList[0];
        rec.oshi = profile.oshi;
        rec.group = profile.group;
        rec.live = profile.live;
        rec.name = latestEma ? latestEma.name : rec.name;
        rec.wish = latestEma ? latestEma.wish : rec.wish;
        rec.color = currentColor().id;
        records[today] = rec;
        save(STORAGE_GOSHUIN_RECORDS, records);
        withFonts(function () {
            var img = makeGoshuin(rec);
            save(STORAGE_GOSHUIN_TODAY, { date: today, img: img });
            var note = profile.oshi
                ? '入力内容を反映しました。角印が「' + profile.oshi + '」のハンコになっています。'
                : '入力内容を反映しました。角印を推しの名前のハンコにするには、上の「推しのお名前」欄に入力してからもう一度押してください。';
            showGoshuinResult(img, true, note);
            document.querySelector('#goshuin-area .goshuin-img').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    function loadGoshuinRecords() { return load(STORAGE_GOSHUIN_RECORDS, {}); }

    /* 推しプロフィール（推しの名前・グループ名・ライブ名）の保存と復元 */
    function loadOshiProfile() { return load(STORAGE_OSHI_PROFILE, { oshi: '', group: '', live: '' }); }
    function saveOshiProfile() {
        save(STORAGE_OSHI_PROFILE, {
            oshi: escAttr(document.getElementById('oshi-name').value.trim()),
            group: escAttr(document.getElementById('oshi-group').value.trim()),
            live: escAttr(document.getElementById('oshi-live').value.trim())
        });
    }
    function restoreOshiProfile() {
        var p = loadOshiProfile();
        document.getElementById('oshi-name').value = p.oshi || '';
        document.getElementById('oshi-group').value = p.group || '';
        document.getElementById('oshi-live').value = p.live || '';
    }

    function claimGoshuin() {
        var today = todayStr();
        var latestEma = emaList[0];
        var aniv = todaysAnniversary();
        saveOshiProfile();
        var profile = loadOshiProfile();
        var log = recordVisit(today);
        var rec = {
            name: latestEma ? latestEma.name : '',
            wish: latestEma ? latestEma.wish : '',
            visit: log.length,
            aniv: aniv ? aniv.label : null,
            color: currentColor().id,
            date: today,
            oshi: profile.oshi,
            group: profile.group,
            live: profile.live,
            streak: computeStreak(log)
        };
        var records = loadGoshuinRecords();
        records[today] = rec;
        save(STORAGE_GOSHUIN_RECORDS, records);
        withFonts(function () {
            var img = makeGoshuin(rec);
            save(STORAGE_GOSHUIN_TODAY, { date: today, img: img });
            var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduce) {
                showGoshuinResult(img, false);
            } else {
                playStampCeremony(makeGoshuin(rec, { noSeal: true }), img);
            }
            renderGoshuinBook();
            renderFirstGuide();
            renderBackupReminder();
        });
    }

    /* 授与の儀式: 墨書きの姿が現れ、一拍おいて朱印が「トン」と押される */
    function playStampCeremony(baseImg, finalImg) {
        var area = document.getElementById('goshuin-area');
        area.innerHTML =
            '<div class="goshuin-stage">' +
            '<img class="goshuin-img" src="' + baseImg + '" alt="御朱印をしたためています">' +
            '<span class="stamp-press" style="background-image:url(' + finalImg + ')"></span>' +
            '</div>' +
            '<p class="goshuin-note">御朱印をしたためています…</p>';
        var stage = area.querySelector('.goshuin-stage');
        stage.addEventListener('animationend', function onEnd(e) {
            if (e.target.classList.contains('stamp-press')) {
                stage.removeEventListener('animationend', onEnd);
                setTimeout(function () { showGoshuinResult(finalImg, false); }, 500);
            }
        });
        /* 演出が何らかの理由で完了しなくても、必ず結果は表示する */
        setTimeout(function () {
            if (document.querySelector('#goshuin-area .goshuin-stage')) showGoshuinResult(finalImg, false);
        }, 3200);
    }

    function renderGoshuinArea() {
        var today = todayStr();
        var records = loadGoshuinRecords();
        var cached = load(STORAGE_GOSHUIN_TODAY, null);
        if (cached && cached.date === today && cached.img) {
            showGoshuinResult(cached.img, true);
            return;
        }
        if (records[today]) {
            /* 別端末から記録を読み込んだ直後など、画像キャッシュがない場合は記録から再生成 */
            withFonts(function () {
                showGoshuinResult(makeGoshuin(records[today]), true);
            });
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
            { need: 7, label: '7日連続参拝 — 七日詣' },
            { need: 30, label: '30日連続参拝 — 三十日詣' },
            { need: 100, label: '100日連続参拝 — 百日詣' }
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
        var records = loadGoshuinRecords();
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = y + '-' + pad2(m + 1) + '-' + pad2(d);
            var got = log.indexOf(ds) !== -1;
            var hasRecord = got && records[ds];
            var cell = document.createElement(hasRecord ? 'button' : 'span');
            cell.className = 'book-cell' + (got ? ' got' : '') + (hasRecord ? ' has-record' : '');
            cell.textContent = d;
            if (hasRecord) {
                cell.type = 'button';
                cell.setAttribute('aria-label', ds + ' の御朱印を見る');
                cell.addEventListener('click', showBookViewer.bind(null, ds));
            }
            grid.appendChild(cell);
        }
    }

    /* 御朱印帳: 過去の御朱印を記録から再生成して表示 */
    function showBookViewer(ds) {
        var records = loadGoshuinRecords();
        var rec = records[ds];
        if (!rec) return;
        withFonts(function () { showBookViewerImage(ds, rec); });
    }
    function showBookViewerImage(ds, rec) {
        var img = makeGoshuin(rec);
        var parts = ds.split('-');
        var viewer = document.getElementById('book-viewer');
        viewer.classList.remove('hidden');
        viewer.innerHTML =
            '<p class="book-viewer-date">' + (+parts[0]) + '年' + (+parts[1]) + '月' + (+parts[2]) + '日の御朱印</p>' +
            '<img class="goshuin-img" src="' + img + '" alt="' + ds + 'の御朱印">' +
            '<div class="goshuin-actions">' +
            '<a class="pill-btn" href="' + img + '" download="toiro-goshuin-' + ds + '.png">画像として保存</a>' +
            '<button type="button" class="pill-btn" id="btn-viewer-close">とじる</button>' +
            '</div>';
        document.getElementById('btn-viewer-close').addEventListener('click', function () {
            viewer.classList.add('hidden');
            viewer.innerHTML = '';
        });
        viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ---- 記録のお引越し（書き出し・読み込み） ---- */
    var EXPORT_KEYS = [
        STORAGE_COLOR, STORAGE_MODE, STORAGE_FONTSIZE, STORAGE_EMA,
        STORAGE_GOSHUIN_LOG, STORAGE_GOSHUIN_RECORDS, STORAGE_ANNIV,
        STORAGE_OSHI_PROFILE, STORAGE_MIKUJI
    ];

    function exportRecords() {
        var payload = { app: 'toiro-shrine', version: 1, exportedAt: new Date().toISOString(), data: {} };
        EXPORT_KEYS.forEach(function (k) {
            var v = load(k, null);
            if (v !== null) payload.data[k] = v;
        });
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'toiro-shrine-kiroku-' + todayStr() + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function importRecords(file) {
        var errEl = document.getElementById('import-error');
        errEl.classList.add('hidden');
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var parsed = JSON.parse(reader.result);
                if (!parsed || parsed.app !== 'toiro-shrine' || !parsed.data) throw new Error('invalid');
                EXPORT_KEYS.forEach(function (k) {
                    if (k in parsed.data) save(k, parsed.data[k]);
                });
                location.reload();
            } catch (e) {
                errEl.classList.remove('hidden');
            }
        };
        reader.onerror = function () { errEl.classList.remove('hidden'); };
        reader.readAsText(file);
    }

    /* ---- 5. 推しみくじページ（1日1回。結果は日ごとに保存） ---- */
    var MIKUJI_RANKS = [
        { rank: '推し大吉', weight: 6, msgs: [
            '推しとの縁がひときわ深まる一日。迷ったら、心が動くほうへ。',
            'めったに出ない大当たりの日。今日の直感は信じてよい日です。',
            '想いがまっすぐ届く兆し。ずっと言えなかった「好き」を形にしてみて。'
        ] },
        { rank: '大吉', weight: 14, msgs: [
            '願いが届きやすい日です。大切な応募や連絡は今日のうちに。',
            '巡り合わせの良い日。ふと開いた告知に、良い報せがあるかも。',
            '推し活の段取りがするすると進む日。後回しの予定を片づける好機。'
        ] },
        { rank: '中吉', weight: 30, msgs: [
            'おだやかな追い風が吹いています。いつもの推し活がいちばんの吉。',
            '無理のない範囲がちょうどいい日。定位置の幸せを味わって。',
            '小さな準備が実を結ぶ日。遠征の下調べや貯金に向いています。'
        ] },
        { rank: '小吉', weight: 30, msgs: [
            '小さな幸せを拾える日。推しの写真を見返す時間が福を呼びます。',
            'ゆっくり進むのが吉。急がず、推しの過去作を一つ味わう日に。',
            '身近なところに福あり。部屋のグッズをすこし整えると運気が整います。'
        ] },
        { rank: '末吉', weight: 20, msgs: [
            '焦らなくて大丈夫。今日は自分をいたわることが、明日の推し活の力になります。',
            '待つ運気の日。結果を追いかけず、ゆっくり湯船に浸かって吉。',
            '今日は充電の日。推しの優しい場面だけを見て、早めにおやすみを。'
        ] }
    ];
    var MIKUJI_CATEGORIES = ['ライブ運', 'ファンサ運', '金運', '恋愛運', '健康運'];

    function drawMikujiResult() {
        var total = MIKUJI_RANKS.reduce(function (s, r) { return s + r.weight; }, 0);
        var roll = Math.random() * total;
        var chosen = MIKUJI_RANKS[0];
        for (var i = 0; i < MIKUJI_RANKS.length; i++) {
            roll -= MIKUJI_RANKS[i].weight;
            if (roll <= 0) { chosen = MIKUJI_RANKS[i]; break; }
        }
        var stars = MIKUJI_CATEGORIES.map(function () {
            return 1 + Math.floor(Math.random() * 5);
        });
        var msg = chosen.msgs[Math.floor(Math.random() * chosen.msgs.length)];
        return { rank: chosen.rank, msg: msg, stars: stars, date: todayStr() };
    }

    function renderMikujiResult(result) {
        var area = document.getElementById('mikuji-area');
        area.innerHTML = '';
        var paper = document.createElement('div');
        paper.className = 'mikuji-paper';
        var title = document.createElement('p');
        title.className = 'mikuji-paper-title';
        title.textContent = '推しみくじ ・ ' + result.date.replace(/-/g, '.');
        var rank = document.createElement('p');
        rank.className = 'mikuji-rank';
        rank.textContent = result.rank;
        var msg = document.createElement('p');
        msg.className = 'mikuji-msg';
        msg.textContent = result.msg;
        paper.appendChild(title);
        paper.appendChild(rank);
        paper.appendChild(msg);
        var list = document.createElement('div');
        list.className = 'mikuji-luck';
        MIKUJI_CATEGORIES.forEach(function (cat, i) {
            var row = document.createElement('p');
            row.className = 'mikuji-row';
            var label = document.createElement('span');
            label.textContent = cat;
            var stars = document.createElement('span');
            stars.className = 'mikuji-stars';
            stars.textContent = '★'.repeat(result.stars[i]) + '☆'.repeat(5 - result.stars[i]);
            row.appendChild(label);
            row.appendChild(stars);
            list.appendChild(row);
        });
        paper.appendChild(list);
        var note = document.createElement('p');
        note.className = 'mikuji-note';
        note.textContent = 'みくじは1日1回。また明日、引きにいらしてください。';
        area.appendChild(paper);
        area.appendChild(note);
    }

    function drawMikuji() {
        var result = drawMikujiResult();
        save(STORAGE_MIKUJI, result);
        renderMikujiResult(result);
        renderFirstGuide();
    }

    function renderMikujiArea() {
        var saved = load(STORAGE_MIKUJI, null);
        if (saved && saved.date === todayStr()) {
            renderMikujiResult(saved);
            return;
        }
        var area = document.getElementById('mikuji-area');
        area.innerHTML = '<button id="btn-mikuji-draw" class="btn-main btn-block" type="button">今日のみくじを引く</button>';
        document.getElementById('btn-mikuji-draw').addEventListener('click', drawMikuji);
    }

    /* ---- はじめての参拝（三つ終えると消える一筆書きの案内） ---- */
    function renderFirstGuide() {
        var doneEma = emaList.length > 0;
        var doneMikuji = load(STORAGE_MIKUJI, null) !== null;
        var doneGoshuin = load(STORAGE_GOSHUIN_LOG, []).length > 0;
        var guide = document.getElementById('first-guide');
        if (doneEma && doneMikuji && doneGoshuin) {
            guide.classList.add('hidden');
            return;
        }
        guide.classList.remove('hidden');
        document.getElementById('fg-ema').classList.toggle('done', doneEma);
        document.getElementById('fg-mikuji').classList.toggle('done', doneMikuji);
        document.getElementById('fg-goshuin').classList.toggle('done', doneGoshuin);
    }

    /* ---- 記録のお守りリマインド（参拝30日ごとに書き出しを促す） ---- */
    var STORAGE_BACKUP_MILESTONE = 'toiro-backup-milestone';
    function renderBackupReminder() {
        var card = document.getElementById('backup-card');
        var visits = load(STORAGE_GOSHUIN_LOG, []).length;
        var milestone = Math.floor(visits / 30);
        var acknowledged = load(STORAGE_BACKUP_MILESTONE, 0);
        if (milestone < 1 || milestone <= acknowledged) {
            card.classList.add('hidden');
            return;
        }
        card.innerHTML = '';
        var msg = document.createElement('p');
        msg.className = 'backup-msg';
        msg.textContent = '参拝が' + (milestone * 30) + '日分たまりました。大切な記録を、お守り代わりに書き出しておきませんか。';
        var actions = document.createElement('div');
        actions.className = 'goshuin-actions';
        var exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'pill-btn';
        exportBtn.id = 'btn-backup-now';
        exportBtn.textContent = '記録を書き出す';
        exportBtn.addEventListener('click', function () {
            exportRecords();
            save(STORAGE_BACKUP_MILESTONE, milestone);
            renderBackupReminder();
        });
        var laterBtn = document.createElement('button');
        laterBtn.type = 'button';
        laterBtn.className = 'pill-btn';
        laterBtn.id = 'btn-backup-later';
        laterBtn.textContent = 'また今度';
        laterBtn.addEventListener('click', function () {
            save(STORAGE_BACKUP_MILESTONE, milestone);
            renderBackupReminder();
        });
        actions.appendChild(exportBtn);
        actions.appendChild(laterBtn);
        card.appendChild(msg);
        card.appendChild(actions);
        card.classList.remove('hidden');
    }

    /* ---- ライブカウントダウン（一番近い記念日を参道に掲げる） ---- */
    function renderCountdown() {
        var card = document.getElementById('countdown-card');
        var list = loadAnniversaries();
        if (!list.length) { card.classList.add('hidden'); return; }
        var nearest = null;
        list.forEach(function (a) {
            var diff = nextOccurrenceDays(a.month, a.day);
            if (!nearest || diff < nearest.diff) nearest = { a: a, diff: diff };
        });
        if (!nearest) { card.classList.add('hidden'); return; }
        card.innerHTML = '';
        var kicker = document.createElement('p');
        kicker.className = 'countdown-kicker';
        kicker.textContent = nearest.a.label;
        var count = document.createElement('p');
        count.className = 'countdown-count';
        if (nearest.diff === 0) {
            count.innerHTML = '<strong>今日</strong> です';
        } else {
            count.innerHTML = 'まで あと <strong>' + nearest.diff + '</strong> 日';
        }
        card.appendChild(kicker);
        card.appendChild(count);
        card.classList.remove('hidden');
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
        document.getElementById('anniv-calendar').classList.toggle('hidden', !list.length);
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

    /* ---- 記念日をスマホのカレンダーへ（.ics）----
       Webから通知が打てない代わりに、OSのカレンダー通知に任せる */
    function buildAnnivIcs() {
        var list = loadAnniversaries();
        var now = new Date();
        var lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TOIRO SHRINE//toiro-shrine//JA',
            'CALSCALE:GREGORIAN'
        ];
        list.forEach(function (a, i) {
            var next = new Date(now.getFullYear(), a.month - 1, a.day);
            var todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (next < todayZero) next = new Date(now.getFullYear() + 1, a.month - 1, a.day);
            var ymd = next.getFullYear() + pad2(next.getMonth() + 1) + pad2(next.getDate());
            lines.push(
                'BEGIN:VEVENT',
                'UID:toiro-anniv-' + i + '-' + a.month + '-' + a.day + '@toiro-shrine',
                'SUMMARY:' + a.label + '（十色神社）',
                'DTSTART;VALUE=DATE:' + ymd,
                'RRULE:FREQ=YEARLY',
                'DESCRIPTION:十色神社に登録した記念日です。今日は特別な御朱印が授かれます。',
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                'DESCRIPTION:' + a.label + '（十色神社）',
                'TRIGGER:PT9H',
                'END:VALARM',
                'END:VEVENT'
            );
        });
        lines.push('END:VCALENDAR');
        return lines.join('\r\n');
    }

    function downloadAnnivIcs() {
        var blob = new Blob([buildAnnivIcs()], { type: 'text/calendar' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'toiro-kinenbi.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
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
        renderCountdown();
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
    document.getElementById('btn-anniv-ics').addEventListener('click', downloadAnnivIcs);

    /* お賽銭（決済リンクが設定されているときだけ現れる） */
    if (SAISEN_URL) {
        document.getElementById('btn-saisen').href = SAISEN_URL;
        document.getElementById('saisen-section').classList.remove('hidden');
    }
    document.getElementById('btn-book-prev').addEventListener('click', function () { shiftBookMonth(-1); });
    document.getElementById('btn-book-next').addEventListener('click', function () { shiftBookMonth(1); });
    document.getElementById('btn-export').addEventListener('click', exportRecords);
    document.getElementById('import-file').addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) importRecords(e.target.files[0]);
        e.target.value = '';
    });

    /* ---- PWA: Service Worker登録（https/localhost のみ。file:// では動かない） ---- */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('sw.js').catch(function () { /* 登録に失敗しても通常表示で動作する */ });
    }

    /* ---- 参道へもどる（1画面分スクロールしたら現れる） ---- */
    var backBtn = document.getElementById('btn-backtotop');
    backBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
        backBtn.classList.toggle('show', window.scrollY > window.innerHeight && !main.classList.contains('hidden'));
    }, { passive: true });
})();
