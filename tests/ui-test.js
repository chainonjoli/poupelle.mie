/* adventure.html のUI通しテスト（Playwright）
 * 実行: node tests/ui-test.js  （要: playwright, chromium） */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('console: ' + m.text()); });

    await page.goto('file://' + path.resolve(__dirname, '../adventure.html'));

    // オンボーディング（小3）
    await page.click('#ob-next');
    await page.fill('#ob-nickname', 'ゆうた');
    await page.selectOption('#ob-grade', '3');
    await page.click('#ob-next');
    await page.click('.chip[data-id="money"]');
    await page.click('.chip[data-id="stars"]');
    await page.click('#ob-next');
    await page.click('.chip[data-id="calc"]');
    await page.click('#ob-next');
    await page.click('#ob-start');

    // 町
    await page.waitForSelector('.town-title');
    const townText = await page.textContent('.town-wrap');
    if (!townText.includes('ゆうた')) errors.push('町にニックネームが出ない');
    if (!townText.includes('はじまりの約束')) errors.push('今日のぼうけんが出ない');
    if (await page.locator('.mini-chara svg').count() < 1) errors.push('ミニキャラSVGが出ない');

    // クエスト（はじまりの約束・tier3）
    await page.click('#btn-start-rec');
    for (let i = 0; i < 4; i++) await page.click('#story-next');
    await page.waitForSelector('.question-card');
    await page.click('.option-btn >> nth=2');
    await page.click('#btn-answer');
    if (!(await page.textContent('#feedback')).includes('笑顔')) errors.push('heart返答が想定外');
    await page.click('#btn-next');
    // 数値問題はランダム化されているので、正答を実行時に取得する
    const ans = await page.evaluate(() => AdvEngine.currentStep().answer);
    const wrong = String(ans === 0 ? 1 : ans - 1);
    await page.fill('#num-input', wrong);
    await page.click('#btn-answer');
    if (!(await page.textContent('#feedback')).includes('プペル')) errors.push('retryにプペルが出ない');
    await page.fill('#num-input', wrong);
    await page.click('#btn-answer');
    if (!(await page.textContent('#feedback')).includes('ヒント')) errors.push('ヒントが出ない');
    await page.fill('#num-input', String(ans));
    await page.click('#btn-answer');
    if (!(await page.textContent('#feedback')).includes('せいかい')) errors.push('正解表示が出ない');
    await page.click('#btn-next');
    await page.click('#story-next');
    await page.click('#story-next');

    // 完了画面（ふりがな検証込み）
    await page.waitForSelector('.finish-scene');
    const fin = await page.textContent('.finish-scene');
    if (!fin.includes('たっせい')) errors.push('完了画面が出ない');
    if (!/探検団/.test(fin) || !fin.includes('の証')) errors.push('firstバッジが出ない');
    if (!fin.includes('中央市場')) errors.push('市場開放が出ない');
    if (await page.locator('.finish-scene ruby').count() < 1) errors.push('ふりがなが出ない');

    // ミッション連戦: 進捗と「つぎのぼうけんへ」ボタン
    if (!fin.includes('きょうのミッション')) errors.push('ミッション進捗が出ない');
    if (await page.locator('#btn-next-quest').count() < 1) errors.push('つぎのぼうけんボタンが出ない');
    await page.click('#btn-next-quest');
    await page.waitForSelector('#story-next');
    await page.click('#quest-quit'); // 中断して町へ

    // 保護者ダッシュボード（ふりがな無しを検証）
    await page.waitForSelector('.area-card');
    await page.click('#btn-parent');
    await page.waitForSelector('.gate-q');
    const m = (await page.textContent('.gate-q')).match(/(\d+)\s*×\s*(\d+)/);
    await page.fill('#gate-input', String(parseInt(m[1]) * parseInt(m[2])));
    await page.click('#gate-ok');
    await page.waitForSelector('.parent-wrap');
    if (!(await page.textContent('.parent-wrap')).includes('ゆうたさんの冒険日記')) errors.push('日記タイトルなし');
    if (await page.locator('.parent-wrap ruby').count() > 0) errors.push('保護者画面にふりがな');

    // リロード復元
    await page.reload();
    await page.waitForSelector('.town-title');

    await browser.close();
    if (errors.length) { console.error('❌ ' + errors.join(' / ')); process.exit(1); }
    console.log('✅ UI通しテスト合格');
})();
