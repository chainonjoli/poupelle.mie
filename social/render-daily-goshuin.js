#!/usr/bin/env node
/* 今日の見本御朱印を画像に描き出す（公式Xの毎日投稿に添付する用）
 *
 * shrine.html を headless Chromium で開き、サイト本体と同じ描画コードで
 * 「今日の一枚」を生成して PNG に保存する。
 * 色は日替わりで10色を巡り、絵柄は本体と同じく日付で変わる。
 *
 * 実行: node social/render-daily-goshuin.js [--date=YYYY-MM-DD] [--out=path]
 *   （要: playwright と Chromium。GitHub Actions では workflow が用意する） */

var path = require('path');
var fs = require('fs');
var { chromium } = require('playwright');

/* 10色のID（scripts/shrine.js の COLORS と同じ並び） */
var COLOR_IDS = ['black', 'red', 'pink', 'orange', 'yellow', 'green', 'blue', 'lightblue', 'purple', 'white'];

/* 見本に添える願いごと（実在の名前は入れない） */
var SAMPLE_WISHES = [
    '今日も推しが幸せでありますように',
    'あなたの「好き」が続きますように',
    '次の現場まで、元気でいられますように',
    '推しの新しい報せが、良いものでありますように',
    '遠くにいても、想いが届きますように',
    '推し活を頑張るあなたに、良いご縁を',
    '今日の疲れが、今日のうちに癒えますように'
];

function jstToday(dateArg) {
    if (dateArg) {
        var m = dateArg.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) { console.error('日付は YYYY-MM-DD 形式で指定してください: ' + dateArg); process.exit(1); }
        return { y: +m[1], m: +m[2], d: +m[3] };
    }
    var now = new Date(Date.now() + 9 * 3600 * 1000);
    return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };
}

(async function () {
    var args = process.argv.slice(2);
    var dateArg = null, outArg = null;
    args.forEach(function (a) {
        if (a.indexOf('--date=') === 0) dateArg = a.slice(7);
        if (a.indexOf('--out=') === 0) outArg = a.slice(6);
    });
    var t = jstToday(dateArg);
    var dateStr = t.y + '-' + String(t.m).padStart(2, '0') + '-' + String(t.d).padStart(2, '0');
    var doy = Math.floor((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(t.y, 0, 1)) / 86400000) + 1;
    /* 開設日からの日数を参拝回数として刻む（毎日1ずつ増える） */
    var visit = Math.max(1, Math.floor((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(2026, 5, 1)) / 86400000) + 1);
    var rec = {
        name: '',
        wish: SAMPLE_WISHES[doy % SAMPLE_WISHES.length],
        visit: visit,
        aniv: null,
        color: COLOR_IDS[doy % COLOR_IDS.length],
        date: dateStr,
        oshi: '十色',
        streak: 0
    };
    var outPath = outArg || path.join(__dirname, 'out', 'goshuin-today.png');

    var browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || undefined
    });
    var page = await browser.newPage({ viewport: { width: 800, height: 1200 } });
    await page.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    await page.waitForFunction(function () { return typeof window.__toiroMakeGoshuin === 'function'; });
    var dataUrl = await page.evaluate(async function (rec) {
        if (document.fonts && document.fonts.load) {
            await Promise.all([
                document.fonts.load('600 90px "Shippori Mincho"'),
                document.fonts.load('400 19px "Noto Serif JP"')
            ]).catch(function () {});
            await document.fonts.ready;
        }
        return window.__toiroMakeGoshuin(rec);
    }, rec);
    await browser.close();

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    var buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(outPath, buf);
    console.log('今日の御朱印を描きました: ' + outPath + '（' + rec.color + '・' + dateStr + '・' + Math.round(buf.length / 1024) + 'KB）');
})().catch(function (e) { console.error(e); process.exit(1); });
