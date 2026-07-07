/* shrine.html（十色神社）のUI通しテスト（Playwright）
 * フェーズ1: トップページ（推しカラー選択）／参道ページ／願いごとページ（絵馬）
 * フェーズ2: お守りページ／御朱印ページ／御朱印帳ページ
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

    // 1. トップページ：推しカラー選択
    if (await page.locator('.color-swatch').count() !== 10) errors.push('推しカラーが10色出ない');
    if (!(await page.textContent('#gate')).includes('架空の神社')) errors.push('フィクション注記が出ない');
    if (!(await page.textContent('.gate-catch')).includes('好き')) errors.push('キャッチコピーが出ない');

    // パープルを選ぶ → 参道がパープルに
    await page.click('.color-swatch[data-color-id="purple"]');
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.getAttribute('body', 'data-color') !== 'purple') errors.push('data-colorがpurpleにならない');
    if (!(await page.textContent('#hero-color-name')).includes('パープル')) errors.push('参道の色名が出ない');
    if (await page.locator('#gate.hidden').count() !== 1) errors.push('色選択後に門が隠れない');

    // 2. 参道ページ：今日のひとこと
    const todayMsg = await page.textContent('#today-message');
    if (!todayMsg || todayMsg.trim().length < 5) errors.push('今日のひとことが出ない');

    // 参拝ボタンで絵馬セクションへスクロール
    await page.click('#btn-sanpai');
    await page.waitForTimeout(600);

    // 墨／紙の切替
    await page.click('#btn-mode');
    if (await page.getAttribute('body', 'data-mode') !== 'paper') errors.push('紙モードにならない');
    await page.click('#btn-mode');
    if (await page.getAttribute('body', 'data-mode') !== 'ink') errors.push('墨モードに戻らない');

    // 文字サイズ切替
    await page.click('#btn-fontsize');
    if (await page.getAttribute('html', 'data-fontsize') !== 'large') errors.push('文字サイズが大きくならない');
    await page.click('#btn-fontsize');
    if (await page.getAttribute('html', 'data-fontsize')) errors.push('文字サイズが標準に戻らない');

    // 3. 願いごとページ：空のまま奉納 → エラー表示
    await page.click('#btn-dedicate');
    if (await page.locator('#ema-error:not(.hidden)').count() !== 1) errors.push('空絵馬のエラーが出ない');

    // 絵馬：例チップから願いを入れて奉納
    await page.fill('#ema-name', 'あず');
    await page.click('.wish-chip >> nth=0');
    await page.click('#btn-dedicate');
    if (!(await page.textContent('#ema-done')).includes('あずさんの絵馬を奉納しました')) errors.push('奉納完了メッセージが出ない');
    const rackText = await page.textContent('#ema-rack');
    if (!rackText.includes('ライブが当たりますように')) errors.push('絵馬掛けに願いが出ない');
    if (!rackText.includes('あず より')) errors.push('絵馬掛けに名前が出ない');

    // 4. お守りページ：願いのテーマが反映される
    const mamoriText = await page.textContent('#mamori-card');
    if (!mamoriText.includes('推し守')) errors.push('推し守カードが出ない');
    if (!mamoriText.includes('ライブが当たりますように')) errors.push('お守りに願いのテーマが反映されない');
    if (!mamoriText.includes('パープル')) errors.push('お守りに推しカラーが反映されない');

    // 5. 御朱印ページ：1日1枚生成し、名前と願いごとが反映される
    await page.click('#btn-goshuin-make');
    await page.waitForSelector('.goshuin-img');
    const goshuinSrc = await page.getAttribute('.goshuin-img', 'src');
    if (!goshuinSrc || !goshuinSrc.startsWith('data:image/png') || goshuinSrc.length < 5000) errors.push('御朱印画像が生成されない');
    if (!(await page.getAttribute('#btn-goshuin-save', 'download'))) errors.push('御朱印の保存リンクがない');

    // 6. 御朱印帳：参拝日数とカレンダーに今日の日付が反映される
    const bookLead = await page.textContent('#goshuinbook-lead');
    if (!bookLead.includes('1 日')) errors.push('御朱印帳の参拝日数が反映されない');
    if (await page.locator('.book-cell.got').count() !== 1) errors.push('御朱印帳のカレンダーに参拝日が反映されない');

    // 御朱印は1日1回まで：再度開くと「いただき済み」表示になる
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    await page.evaluate(() => document.getElementById('goshuin-section').scrollIntoView());
    const goshuinAreaText = await page.textContent('#goshuin-area');
    if (!goshuinAreaText.includes('いただき済み')) errors.push('御朱印の1日1回制限が効いていない');
    if (await page.locator('#btn-goshuin-make').count() !== 0) errors.push('いただき済みなのに御朱印を再取得できてしまう');

    // リロード後も推しカラーと絵馬が残る（localStorage）
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.getAttribute('body', 'data-color') !== 'purple') errors.push('リロード後に推しカラーが消える');
    if (!(await page.textContent('#ema-rack')).includes('ライブが当たりますように')) errors.push('リロード後に絵馬が消える');

    // 色を選び直す → 門が再表示 → ピンクへ
    await page.click('#btn-recolor');
    await page.waitForSelector('#gate:not(.hidden)');
    await page.click('.color-swatch[data-color-id="pink"]');
    await page.waitForFunction(() => document.body.getAttribute('data-color') === 'pink');
    if (!(await page.textContent('#hero-color-name')).includes('ピンク')) errors.push('選び直し後の色名が出ない');

    // アンカー移動後、上部バーに見出しが隠れない
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click('#btn-sanpai');
    await page.waitForTimeout(500);
    const titleBox = await page.locator('.section-title').first().boundingBox();
    const topbarBox = await page.locator('.topbar').boundingBox();
    if (titleBox && topbarBox && titleBox.y < topbarBox.y + topbarBox.height) {
        errors.push('願いごとページの見出しが上部バーに隠れている');
    }

    // 保存できない環境（プライベートブラウズ等）でも絵馬が即時反映される
    const page2 = await browser.newPage({ viewport: { width: 420, height: 900 } });
    page2.on('pageerror', e => errors.push('pageerror(blocked): ' + e.message));
    await page2.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('storage blocked'); }; });
    await page2.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    await page2.click('.color-swatch[data-color-id="red"]');
    await page2.waitForSelector('#main:not(.hidden)');
    await page2.fill('#ema-name', 'みお');
    await page2.fill('#ema-wish', '推しにまた会えますように');
    await page2.click('#btn-dedicate');
    if (!(await page2.textContent('#ema-rack')).includes('推しにまた会えますように')) errors.push('保存不可環境で絵馬が反映されない');
    if (!(await page2.textContent('#ema-rack')).includes('みお より')) errors.push('保存不可環境で絵馬の名前が出ない');

    await browser.close();

    if (errors.length) {
        console.error('NG:\n' + errors.join('\n'));
        process.exit(1);
    }
    console.log('OK: shrine.html（フェーズ1・2）通しテスト成功');
})();
