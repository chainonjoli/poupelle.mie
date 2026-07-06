/* shrine.html（推し色神社）のUI通しテスト（Playwright）
 * 実行: node tests/shrine-test.js  （要: playwright, chromium） */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('console: ' + m.text()); });

    await page.goto('file://' + path.resolve(__dirname, '../shrine.html'));

    // 推しカラー選択の門
    if (await page.locator('.color-swatch').count() !== 10) errors.push('推しカラーが10色出ない');
    if (!(await page.textContent('#color-gate')).includes('架空の神社')) errors.push('フィクション注記が出ない');

    // パープルを選ぶ → 境内がパープルに
    await page.click('.color-swatch[data-color-id="purple"]');
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.getAttribute('body', 'data-color') !== 'purple') errors.push('data-colorがpurpleにならない');
    if (!(await page.textContent('#hero-color-name')).includes('パープル')) errors.push('参道の色名が出ない');
    if (await page.locator('.torii .gaku').count() !== 1) errors.push('鳥居の額が出ない');
    if (await page.locator('.lantern').count() < 3) errors.push('提灯が出ない');
    if (await page.locator('.particle').count() < 10) errors.push('光の粒が出ない');

    // 昼夜切替
    await page.click('#btn-mode');
    if (await page.getAttribute('body', 'data-mode') !== 'day') errors.push('昼モードにならない');
    await page.click('#btn-mode');
    if (await page.getAttribute('body', 'data-mode') !== 'night') errors.push('夜モードに戻らない');

    // 絵馬：空のまま奉納 → エラー表示
    await page.click('#btn-dedicate');
    if (await page.locator('#ema-error:not(.hidden)').count() !== 1) errors.push('空絵馬のエラーが出ない');

    // 絵馬：例チップから願いを入れて奉納
    await page.fill('#ema-name', 'あず');
    await page.click('.wish-chip >> nth=0');
    await page.click('#btn-dedicate');
    if (!(await page.textContent('#ema-done')).includes('あずさんの絵馬を奉納しました')) errors.push('奉納完了メッセージが出ない');
    const rackText = await page.textContent('#ema-rack');
    if (!rackText.includes('ライブに当選しますように')) errors.push('絵馬掛けに願いが出ない');
    if (!rackText.includes('あず より')) errors.push('絵馬掛けに名前が出ない');

    // リロード後も推しカラーと絵馬が残る（localStorage）
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.getAttribute('body', 'data-color') !== 'purple') errors.push('リロード後に推しカラーが消える');
    if (!(await page.textContent('#ema-rack')).includes('ライブに当選しますように')) errors.push('リロード後に絵馬が消える');

    // 選び直し → 門が再表示 → ピンクへ
    await page.click('#btn-recolor');
    await page.waitForSelector('#color-gate:not(.hidden)');
    await page.click('.color-swatch[data-color-id="pink"]');
    await page.waitForFunction(() => document.body.getAttribute('data-color') === 'pink');
    if (!(await page.textContent('#hero-color-name')).includes('ピンク')) errors.push('選び直し後の色名が出ない');

    await browser.close();

    if (errors.length) {
        console.error('NG:\n' + errors.join('\n'));
        process.exit(1);
    }
    console.log('OK: shrine.html 通しテスト成功');
})();
