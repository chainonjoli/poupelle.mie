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
    if (await page.locator('#ema-done a.btn-x').count() < 1) errors.push('絵馬奉納後のシェアリンクが出ない');

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

    // 推し活みくじ（筒を振る儀式 → 和紙の結果）
    await page.click('.spot-card[data-action="omikuji"]');
    await page.waitForSelector('#modal:not(.hidden)');
    if (await page.locator('.mikuji-tube').count() !== 1) errors.push('みくじ筒の演出が出ない');
    await page.waitForSelector('.mikuji-rank', { timeout: 6000 });
    const mikujiText = await page.textContent('#modal-body');
    if (!mikujiText.includes('推し活みくじ')) errors.push('みくじモーダルが開かない');
    if (!/吉/.test(mikujiText)) errors.push('みくじの結果が出ない');
    if (await page.locator('.mikuji-paper').count() !== 1) errors.push('おみくじ紙が出ない');
    if (!mikujiText.includes('ラッキーアイテム')) errors.push('ラッキーアイテムが出ない');
    if (!mikujiText.includes('開運アクション')) errors.push('開運アクションが出ない');
    if (mikujiText.includes('ラッキーカラー')) errors.push('廃止したラッキーカラーがまだ出る');
    if (!(await page.getAttribute('#modal-body .btn-x', 'href')).includes('twitter.com/intent')) errors.push('みくじのシェアリンクが不正');
    const mikujiImg = await page.getAttribute('#btn-mikuji-save', 'href');
    if (!mikujiImg || !mikujiImg.startsWith('data:image/png') || mikujiImg.length < 5000) errors.push('みくじ画像が生成されない');
    // ランクと星の整合を複数回検証（小吉・末吉で星5が出ない / 推し大吉は全★5）
    for (let d = 0; d < 5; d++) {
        const rank = (await page.textContent('.mikuji-rank')).trim();
        const starTexts = await page.locator('.mikuji-stars').allTextContents();
        if ((rank === '小吉' || rank === '末吉') && starTexts.includes('★★★★★')) errors.push('低ランクなのに星5が出た: ' + rank);
        if (rank === '推し大吉' && starTexts.some(s => s !== '★★★★★')) errors.push('推し大吉なのに星5未満がある');
        await page.click('#btn-redraw');
        await page.waitForSelector('.mikuji-rank', { timeout: 6000 });
    }
    if (!/吉/.test(await page.textContent('#modal-body'))) errors.push('みくじの引き直しができない');
    await page.click('#modal-close');
    if (await page.locator('#modal.hidden').count() !== 1) errors.push('モーダルが閉じない');

    // 推し色御朱印（画像生成）
    await page.click('.spot-card[data-action="goshuin"]');
    await page.waitForSelector('#goshuin-name');
    await page.fill('#goshuin-name', 'あず');
    await page.click('#btn-goshuin-make');
    await page.waitForSelector('#goshuin-img');
    const imgSrc = await page.getAttribute('#goshuin-img', 'src');
    if (!imgSrc || !imgSrc.startsWith('data:image/png') || imgSrc.length < 5000) errors.push('御朱印画像が生成されない');
    if (!(await page.getAttribute('#btn-goshuin-save', 'download'))) errors.push('御朱印の保存リンクがない');
    await page.click('#modal-close');

    // 花手水の波紋・花びら・ご利益のことば、風鈴の鳴動
    await page.click('.spot-card[data-action="chozu"]');
    if (await page.locator('.ripple-ring').count() < 1) errors.push('花手水の波紋が出ない');
    if (await page.locator('.petal-float').count() < 4) errors.push('花手水の花びらが舞わない');
    if (await page.locator('.chozu-msg').count() !== 1) errors.push('花手水のご利益メッセージが出ない');
    await page.click('.spot-card[data-action="furin"]');
    if (await page.locator('.furin-visual.ringing').count() !== 1) errors.push('風鈴が鳴動しない');

    // 保存できない環境（プライベートブラウズ等）でも絵馬が即時反映される
    const page2 = await browser.newPage({ viewport: { width: 420, height: 900 } });
    page2.on('pageerror', e => errors.push('pageerror(blocked): ' + e.message));
    await page2.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('storage blocked'); }; });
    await page2.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    await page2.click('.color-swatch[data-color-id="red"]');
    await page2.waitForSelector('#main:not(.hidden)');
    await page2.fill('#ema-name', 'みお');
    await page2.fill('#ema-wish', '神席にご縁がありますように');
    await page2.click('#btn-dedicate');
    if (!(await page2.textContent('#ema-rack')).includes('神席にご縁がありますように')) errors.push('保存不可環境で絵馬が反映されない');
    if (!(await page2.textContent('#ema-rack')).includes('みお より')) errors.push('保存不可環境で絵馬の名前が出ない');

    await browser.close();

    if (errors.length) {
        console.error('NG:\n' + errors.join('\n'));
        process.exit(1);
    }
    console.log('OK: shrine.html 通しテスト成功');
})();
