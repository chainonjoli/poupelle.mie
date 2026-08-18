#!/usr/bin/env node
/* 十色神社 公式X（@toiro_shrine）自動投稿スクリプト
 *
 * 毎晩21時（日本時間）に GitHub Actions（.github/workflows/x-autopost.yml）から実行される。
 * social/x-posts.json から「今日の投稿」を選び、X API v2 で投稿する。
 *
 * 選び方:
 *   - special に今日の日付があれば最優先（当落発表日などの特定日）
 *   - 毎月1日（日本時間）は朔日の投稿（tsuitachi）
 *   - それ以外は曜日の投稿を週替わりのローテーションで選ぶ
 *
 * 認証: OAuth 1.0a（依存ライブラリなし・Node標準のcryptoのみ）
 * 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET
 *
 * 動作確認: node social/x-autopost.js --dry-run [--date=2026-08-01]
 *   （--dry-run は投稿せず本文を表示するだけ。APIキー不要） */

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var API_URL = 'https://api.twitter.com/2/tweets';

/* ---- 日本時間の今日 ---- */
function jstToday(dateArg) {
    if (dateArg) {
        var m = dateArg.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) { console.error('日付は YYYY-MM-DD 形式で指定してください: ' + dateArg); process.exit(1); }
        var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        return { y: +m[1], m: +m[2], d: +m[3], weekday: d.getUTCDay() };
    }
    var now = new Date(Date.now() + 9 * 3600 * 1000); /* UTC+9 */
    return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate(), weekday: now.getUTCDay() };
}

function dayOfYear(t) {
    var start = Date.UTC(t.y, 0, 1);
    var today = Date.UTC(t.y, t.m - 1, t.d);
    return Math.floor((today - start) / 86400000) + 1;
}

/* ---- 今日の投稿を選ぶ ---- */
function pickPost(posts, t) {
    /* 特定日（推し活の大きな日：当落発表日など）は最優先。
       social/x-posts.json の special に "YYYY-MM-DD": "本文" で追加する */
    var key = t.y + '-' + String(t.m).padStart(2, '0') + '-' + String(t.d).padStart(2, '0');
    if (posts.special && posts.special[key]) {
        return posts.special[key];
    }
    if (t.d === 1 && posts.tsuitachi && posts.tsuitachi.length) {
        return posts.tsuitachi[(t.m - 1) % posts.tsuitachi.length];
    }
    var pool = posts.weekday[String(t.weekday)];
    if (!pool || !pool.length) { console.error('曜日 ' + t.weekday + ' の投稿がありません'); process.exit(1); }
    var week = Math.floor((dayOfYear(t) - 1) / 7); /* 週替わりローテーション */
    return pool[week % pool.length];
}

/* ---- OAuth 1.0a 署名 ---- */
function pct(s) {
    return encodeURIComponent(s).replace(/[!*'()]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

function oauthHeader(method, url, keys) {
    var p = {
        oauth_consumer_key: keys.apiKey,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: keys.accessToken,
        oauth_version: '1.0'
    };
    var paramStr = Object.keys(p).sort().map(function (k) { return pct(k) + '=' + pct(p[k]); }).join('&');
    var base = [method, pct(url), pct(paramStr)].join('&');
    var signKey = pct(keys.apiSecret) + '&' + pct(keys.accessSecret);
    p.oauth_signature = crypto.createHmac('sha1', signKey).update(base).digest('base64');
    return 'OAuth ' + Object.keys(p).sort().map(function (k) { return pct(k) + '="' + pct(p[k]) + '"'; }).join(', ');
}

/* ---- 投稿 ---- */
async function postTweet(text, keys) {
    var res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': oauthHeader('POST', API_URL, keys),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    });
    var body = await res.text();
    if (res.status === 201) {
        var data = JSON.parse(body);
        console.log('投稿しました: https://x.com/toiro_shrine/status/' + data.data.id);
        return;
    }
    /* 直近に同じ本文を投稿済み（duplicate）の場合は日付を添えて1回だけ再試行 */
    if (res.status === 403 && body.indexOf('duplicate') !== -1) {
        console.log('同じ本文が投稿済みのため、日付を添えて再投稿します');
        var t = jstToday();
        var res2 = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': oauthHeader('POST', API_URL, keys),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text + '\n— ' + t.y + '.' + t.m + '.' + t.d })
        });
        if (res2.status === 201) {
            var data2 = JSON.parse(await res2.text());
            console.log('投稿しました: https://x.com/toiro_shrine/status/' + data2.data.id);
            return;
        }
        body = await res2.text();
    }
    console.error('投稿に失敗しました (HTTP ' + res.status + '):\n' + body);
    if (res.status === 401) console.error('→ APIキー4つ（Secrets）の値が正しいか確認してください');
    if (res.status === 403) console.error('→ アプリの権限が「Read and write」になっているか、Access Tokenを権限変更後に再発行したか確認してください');
    process.exit(1);
}

(async function () {
    var args = process.argv.slice(2);
    var dryRun = args.indexOf('--dry-run') !== -1 || process.env.X_DRY_RUN === '1';
    var dateArg = null;
    args.forEach(function (a) { if (a.indexOf('--date=') === 0) dateArg = a.slice(7); });

    var posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'x-posts.json'), 'utf8'));
    var t = jstToday(dateArg);
    var text = pickPost(posts, t);

    console.log('日付(JST): ' + t.y + '-' + t.m + '-' + t.d + '（曜日 ' + '日月火水木金土'[t.weekday] + (t.d === 1 ? '・朔日' : '') + '）');
    console.log('--- 投稿本文 ---\n' + text + '\n----------------');

    if (dryRun) { console.log('（dry-run のため投稿はしていません）'); return; }

    var keys = {
        apiKey: process.env.X_API_KEY,
        apiSecret: process.env.X_API_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET
    };
    if (!keys.apiKey || !keys.apiSecret || !keys.accessToken || !keys.accessSecret) {
        console.error('APIキーが設定されていません。リポジトリの Settings → Secrets and variables → Actions に X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET を登録してください（手順: social/README.md）');
        process.exit(1);
    }
    await postTweet(text, keys);
})();
