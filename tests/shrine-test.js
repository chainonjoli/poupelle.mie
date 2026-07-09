/* shrine.html（十色神社）のUI通しテスト（Playwright）
 * フェーズ1: トップページ（推しカラー選択）／参道ページ／願いごとページ（絵馬）
 * フェーズ2: お守りページ／御朱印ページ／御朱印帳ページ
 * フェーズ3: 記念日登録ページ／共感ページ
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

    // 境内のご案内：8セクションへのリンクマップと「参道へもどる」ボタン
    if (await page.locator('.keidai-link').count() !== 8) errors.push('境内のご案内が8件出ない');
    await page.click('.keidai-link[href="#empathy-section"]');
    await page.waitForTimeout(700);
    const empathyBox = await page.locator('#empathy-section .section-title').boundingBox();
    const topbarBox0 = await page.locator('.topbar').boundingBox();
    if (empathyBox && topbarBox0 && empathyBox.y < topbarBox0.y + topbarBox0.height) errors.push('境内マップの移動先見出しが上部バーに隠れている');
    if (await page.locator('.back-to-top.show').count() !== 1) errors.push('参道へもどるボタンが現れない');
    await page.click('#btn-backtotop');
    await page.waitForTimeout(800);
    if (await page.evaluate(() => window.scrollY) > 10) errors.push('参道へもどるボタンで先頭に戻らない');

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

    // 叶いました：印を付けると金の「叶」が現れ、リロード後も残り、取り消せる
    await page.click('.ema-kanau-btn >> nth=0');
    if (await page.locator('.ema-plaque.fulfilled').count() !== 1) errors.push('叶いましたの印が付かない');
    if (!(await page.textContent('.ema-kanau-seal')).includes('叶')) errors.push('叶の印が出ない');
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.locator('.ema-plaque.fulfilled').count() !== 1) errors.push('リロード後に叶いましたの印が消える');
    await page.click('.ema-kanau-btn >> nth=0');
    if (await page.locator('.ema-plaque.fulfilled').count() !== 0) errors.push('叶いましたの印を取り消せない');

    // 4. お守りページ：願いのテーマが反映される
    const mamoriText = await page.textContent('#mamori-card');
    if (!mamoriText.includes('推し守')) errors.push('推し守カードが出ない');
    if (!mamoriText.includes('ライブが当たりますように')) errors.push('お守りに願いのテーマが反映されない');
    if (!mamoriText.includes('パープル')) errors.push('お守りに推しカラーが反映されない');

    // 7. 記念日登録ページ：今日の日付を登録すると「今日」表示になり、御朱印にも反映される
    const now = new Date();
    const todayIso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    await page.fill('#anniv-label-0', '推しの生誕日');
    await page.fill('#anniv-date-0', todayIso);
    await page.click('#btn-anniv-save');
    const annivListText = await page.textContent('#anniv-list');
    if (!annivListText.includes('推しの生誕日')) errors.push('記念日リストにラベルが出ない');
    if (!annivListText.includes('今日')) errors.push('今日の記念日が「今日」と表示されない');
    const goshuinNoteText = await page.textContent('#goshuin-area');
    if (!goshuinNoteText.includes('推しの生誕日')) errors.push('御朱印ページに記念日の案内が出ない');

    // 7. ライブカウントダウン：一番近い記念日が参道に掲げられる
    const countdownText = await page.textContent('#countdown-card');
    if (!countdownText.includes('推しの生誕日')) errors.push('カウントダウンにラベルが出ない');
    if (!countdownText.includes('今日')) errors.push('当日のカウントダウンが「今日」にならない');

    // 記念日のカレンダー連携（.ics）: 毎年の予定＋当日朝の通知が入る
    const [icsDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('#btn-anniv-ics')
    ]);
    const icsPath = await icsDownload.path();
    const icsBody = require('fs').readFileSync(icsPath, 'utf8');
    if (!icsBody.includes('BEGIN:VCALENDAR')) errors.push('icsの形式が不正');
    if (!icsBody.includes('推しの生誕日（十色神社）')) errors.push('icsに記念日のラベルが入らない');
    if (!icsBody.includes('RRULE:FREQ=YEARLY')) errors.push('icsが毎年の予定になっていない');
    if (!icsBody.includes('BEGIN:VALARM')) errors.push('icsに通知が入らない');

    // OGP: SNSシェア用のメタタグが設定されている
    if (await page.locator('meta[property="og:image"]').count() !== 1) errors.push('og:imageがない');
    if (await page.locator('meta[name="twitter:card"]').count() !== 1) errors.push('twitter:cardがない');

    // お賽銭: セクションは常に見え、決済リンク未設定の間は「準備中」の案内が出る
    if (await page.locator('#saisen-section:not(.hidden)').count() !== 1) errors.push('お賽銭セクションが表示されない');
    if (!(await page.textContent('#saisen-section')).includes('準備中')) errors.push('決済リンク未設定なのに準備中の案内が出ない');
    if (await page.locator('#btn-saisen').count() !== 0) errors.push('決済リンク未設定なのにお賽銭ボタンが残っている');
    if (!(await page.textContent('#saisen-section')).includes('返礼品')) errors.push('お賽銭の寄付説明（返礼品なし）が出ない');

    // はじめての参拝ガイド: この時点では絵馬のみ✓（みくじ・御朱印は未実施）
    if (await page.locator('#first-guide:not(.hidden)').count() !== 1) errors.push('はじめての参拝ガイドが出ない');
    if (await page.locator('#fg-ema.done').count() !== 1) errors.push('絵馬のステップに✓が付かない');
    if (await page.locator('#fg-mikuji.done').count() !== 0) errors.push('みくじ未実施なのに✓が付いている');
    if (await page.locator('#fg-goshuin.done').count() !== 0) errors.push('御朱印未取得なのに✓が付いている');

    // 8. 共感ページ：推しカラー名・参拝者数の目安・自分の願いごとが匿名で流れる
    const empathyText = await page.textContent('#empathy-section');
    if (!empathyText.includes('パープル')) errors.push('共感ページに推しカラー名が出ない');
    if (!empathyText.includes('人が')) errors.push('共感ページに参拝者数の目安が出ない');
    if (!empathyText.includes('ライブが当たりますように')) errors.push('共感ページに自分の願いごとが反映されない');

    // 5. 推しみくじ：1日1回引けて、結果が保存される
    await page.click('#btn-mikuji-draw');
    await page.waitForSelector('.mikuji-rank');
    const mikujiRank = (await page.textContent('.mikuji-rank')).trim();
    if (!/吉/.test(mikujiRank)) errors.push('みくじの結果が出ない');
    if (await page.locator('.mikuji-row').count() !== 5) errors.push('みくじの運勢項目が5件出ない');
    if (await page.locator('#btn-mikuji-draw').count() !== 0) errors.push('みくじを同日に引き直せてしまう');
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    if ((await page.textContent('.mikuji-rank')).trim() !== mikujiRank) errors.push('リロード後にみくじの結果が変わってしまう');

    // 6. 御朱印ページ：推しの名前・グループ名・ライブ名を入れて1日1枚生成
    await page.fill('#oshi-name', 'ひかる');
    await page.fill('#oshi-group', '星屑座');
    await page.fill('#oshi-live', '春のワンマン');
    await page.click('#btn-goshuin-make');
    await page.waitForSelector('.goshuin-img');
    const goshuinSrc = await page.getAttribute('.goshuin-img', 'src');
    if (!goshuinSrc || !goshuinSrc.startsWith('data:image/png') || goshuinSrc.length < 5000) errors.push('御朱印画像が生成されない');
    if (!(await page.getAttribute('#btn-goshuin-save', 'download'))) errors.push('御朱印の保存リンクがない');

    // 推しプロフィールがリロード後も復元される
    await page.reload();
    await page.waitForSelector('#main:not(.hidden)');
    if (await page.inputValue('#oshi-name') !== 'ひかる') errors.push('推しの名前が復元されない');
    if (await page.inputValue('#oshi-group') !== '星屑座') errors.push('グループ名が復元されない');
    if (await page.inputValue('#oshi-live') !== '春のワンマン') errors.push('ライブ名が復元されない');

    // はじめての参拝ガイド: 絵馬・みくじ・御朱印がすべて済むと消える
    if (await page.locator('#first-guide.hidden').count() !== 1) errors.push('三つ終えたのに参拝ガイドが消えない');

    // 記録のお守りリマインド: 参拝30日でリマインドが出て、「また今度」で消え、リロード後も出ない
    const backupContext = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const page5 = await backupContext.newPage();
    page5.on('pageerror', e => errors.push('pageerror(backup): ' + e.message));
    await page5.addInitScript(() => {
        const log = [];
        for (let i = 30; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            log.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
        }
        localStorage.setItem('toiro-goshuin-log', JSON.stringify(log));
        localStorage.setItem('toiro-color', JSON.stringify('green'));
    });
    await page5.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    await page5.waitForSelector('#main:not(.hidden)');
    if (await page5.locator('#backup-card:not(.hidden)').count() !== 1) errors.push('参拝30日のリマインドが出ない');
    if (!(await page5.textContent('#backup-card')).includes('30日分')) errors.push('リマインドの日数が出ない');
    await page5.click('#btn-backup-later');
    if (await page5.locator('#backup-card.hidden').count() !== 1) errors.push('「また今度」でリマインドが消えない');
    await page5.reload();
    await page5.waitForSelector('#main:not(.hidden)');
    if (await page5.locator('#backup-card:not(.hidden)').count() !== 0) errors.push('一度応えたリマインドが再表示される');
    await backupContext.close();

    // 6. 御朱印帳：参拝日数とカレンダーに今日の日付が反映される
    const bookLead = await page.textContent('#goshuinbook-lead');
    if (!bookLead.includes('1 日')) errors.push('御朱印帳の参拝日数が反映されない');
    if (await page.locator('.book-cell.got').count() !== 1) errors.push('御朱印帳のカレンダーに参拝日が反映されない');

    // 御朱印帳：参拝日のセルをタップすると、その日の御朱印を再表示できる
    await page.click('button.book-cell.has-record');
    await page.waitForSelector('#book-viewer:not(.hidden)');
    const viewerImg = await page.getAttribute('#book-viewer .goshuin-img', 'src');
    if (!viewerImg || !viewerImg.startsWith('data:image/png') || viewerImg.length < 5000) errors.push('過去の御朱印が再生成されない');
    if (!(await page.textContent('.book-viewer-date')).includes('日の御朱印')) errors.push('御朱印ビューアの日付が出ない');
    await page.click('#btn-viewer-close');
    if (await page.locator('#book-viewer.hidden').count() !== 1) errors.push('御朱印ビューアが閉じない');

    // 記録のお引越し：書き出し → 別ページで読み込み → 記録が復元される
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('#btn-export')
    ]);
    const exportPath = await download.path();
    if (!exportPath) errors.push('記録の書き出しファイルが生成されない');

    // 読み込みは「別の端末」を再現するため、localStorageを共有しない独立コンテキストで検証
    const freshContext = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const page3 = await freshContext.newPage();
    page3.on('pageerror', e => errors.push('pageerror(import): ' + e.message));
    await page3.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    if (await page3.locator('#gate.hidden').count() !== 0) errors.push('新しい端末（独立コンテキスト）なのに門が出ない');
    await page3.setInputFiles('#import-file', exportPath);
    await page3.waitForSelector('#main:not(.hidden)');
    if (await page3.getAttribute('body', 'data-color') !== 'purple') errors.push('読み込み後に推しカラーが復元されない');
    if (!(await page3.textContent('#ema-rack')).includes('ライブが当たりますように')) errors.push('読み込み後に絵馬が復元されない');
    if (!(await page3.textContent('#goshuinbook-lead')).includes('1 日')) errors.push('読み込み後に参拝日数が復元されない');
    const importedGoshuin = await page3.textContent('#goshuin-area');
    if (!importedGoshuin.includes('いただき済み')) errors.push('読み込み後に本日の御朱印状態が復元されない');
    await freshContext.close();

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

    // あの日の願いとの再会：一年前の絵馬があると参道にそっと表示される
    const memoryContext = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const page4 = await memoryContext.newPage();
    page4.on('pageerror', e => errors.push('pageerror(memory): ' + e.message));
    await page4.addInitScript(() => {
        const d = new Date();
        d.setDate(d.getDate() - 365);
        localStorage.setItem('toiro-ema', JSON.stringify([
            { name: 'あず', wish: '推しの初単独ライブが成功しますように', color: 'purple', date: d.toISOString() }
        ]));
        localStorage.setItem('toiro-color', JSON.stringify('purple'));
    });
    await page4.goto('file://' + path.resolve(__dirname, '../shrine.html'));
    await page4.waitForSelector('#main:not(.hidden)');
    const memoryText = await page4.textContent('#memory-card');
    if (!memoryText.includes('一年前の今日')) errors.push('一年前の願いのラベルが出ない');
    if (!memoryText.includes('推しの初単独ライブが成功しますように')) errors.push('一年前の願いの本文が出ない');
    await memoryContext.close();

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
    console.log('OK: shrine.html（フェーズ1・2・3）通しテスト成功');
})();
