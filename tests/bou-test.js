/* bou.html（ぼぅ 投稿スタジオ）のテスト
 * 前半: 生成ロジック・保存層のテスト（Nodeのみで動く）
 * 後半: UI通しテスト（Playwright）
 * 実行: node tests/bou-test.js  （要: playwright, chromium） */
const path = require('path');
const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

/* ================= ロジックテスト ================= */
const { DEFAULT_CHARACTER } = require('../scripts/bou/character.js');
const store = require('../scripts/bou/store.js');
const gen = require('../scripts/bou/generator.js');

(async () => {
    /* コーパス全文がNG表現を含まないこと（ぼぅの約束） */
    gen.CORPUS.forEach(t => {
        ok(DEFAULT_CHARACTER.themes.includes(t.theme), 'コーパスのテーマが固定設定にない: ' + t.theme);
        t.items.forEach(it => {
            const hits = gen.findNgWords(it.text + '\n' + it.caption, DEFAULT_CHARACTER);
            ok(hits.length === 0, 'コーパスにNG表現: 「' + it.text.replace(/\n/g, '／') + '」 → ' + hits.join('、'));
            ok(it.text.split('\n').length <= 3, 'メインテキストが3行を超えている: ' + it.text);
            ok(it.sceneEn && it.sceneJa, 'シーンが欠けている: ' + it.text);
        });
    });
    ok(gen.CORPUS.length >= 14, '投稿テーマが14種類ない（' + gen.CORPUS.length + '種類）');

    /* NGチェッカー自体の動作 */
    ok(gen.findNgWords('明日も頑張って生きよう', DEFAULT_CHARACTER).length > 0, 'NGチェッカーが「頑張って」を見逃した');
    ok(gen.findNgWords('まあ、いっか。', DEFAULT_CHARACTER).length === 0, 'NGチェッカーの誤検知');

    /* 3案生成（内蔵モード）: A/B/C・テーマ違い・全項目あり */
    const drafts = await gen.generateBatch(store, 'builtin');
    ok(drafts.length === 3, '3案生成されない（' + drafts.length + '案）');
    ok(new Set(drafts.map(d => d.theme)).size === 3, '3案のテーマが重複している');
    ok(drafts.map(d => d.variant).join('') === 'ABC', 'A/B/C案になっていない');
    drafts.forEach(d => {
        ['id', 'created_at', 'theme', 'main_text', 'scene', 'image_prompt', 'caption', 'hashtags', 'status'].forEach(k => {
            ok(d[k] !== undefined && d[k] !== '', '生成結果に ' + k + ' がない');
        });
        ok(d.status === 'draft', '生成直後のstatusがdraftでない: ' + d.status);
        ok(d.hashtags.length <= 5, 'ハッシュタグが5個を超えている');
        ok(d.hashtags.includes('#ぼぅ'), 'ハッシュタグに #ぼぅ がない');
        ok(d.image_prompt.includes('#9DAEB8') && d.image_prompt.includes('mola mola'), '画像プロンプトに固定デザインが入っていない');
        ok(!d.image_prompt.includes('{scene}'), '画像プロンプトにシーンが差し込まれていない');
        ok(gen.checkPost(d, DEFAULT_CHARACTER).length === 0, '生成結果にNG表現');
    });

    /* 保存層: 追加 → 1案採用で残りがrejected → フィードバック記録 */
    store.addPosts(drafts);
    store.selectPost(drafts[0].id);
    ok(store.getPost(drafts[0].id).status === 'selected', '採用がselectedにならない');
    ok(store.getPost(drafts[1].id).status === 'rejected', '同バッチの残りがrejectedにならない');
    ok(store.getPost(drafts[2].id).status === 'rejected', '同バッチの残りがrejectedにならない');

    store.addFeedback(drafts[0].id, 'これはぼぅっぽい');
    store.addFeedback(drafts[1].id, '言いすぎ');
    ok(store.getPost(drafts[0].id).user_feedback.length === 1, 'フィードバックが保存されない');

    const learning = store.getLearningContext();
    ok(learning.goodExamples.length === 1, '採用例が学習コンテキストに入らない');
    ok(learning.badExamples.length === 1, '不採用+フィードバック例が学習コンテキストに入らない');
    ok(learning.recentComments.length === 2, '最近のコメントが集計されない');

    /* ステータス遷移と書き出し/読み込み */
    store.setStatus(drafts[0].id, 'generated');
    store.setStatus(drafts[0].id, 'posted');
    ok(store.getPost(drafts[0].id).status === 'posted', 'ステータス遷移が保存されない');
    const exported = store.exportAll();
    const n = store.importAll(exported);
    ok(n === 3, '書き出し/読み込みで件数が合わない（' + n + '件）');

    /* 画像アダプタの差し込み口（第二段階用） */
    let threw = false;
    try { gen.registerImageAdapter({}); } catch (e) { threw = true; }
    ok(threw, '不正な画像アダプタが登録できてしまう');
    gen.registerImageAdapter({ name: 'test', generate: async () => ({}) });
    ok(gen.getImageAdapter().name === 'test', '画像アダプタが登録できない');

    console.log('ロジックテスト: ' + (errors.length ? 'NG' : 'OK'));

    /* ================= UI通しテスト（Playwright） ================= */
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('console: ' + m.text()); });

    await page.goto('file://' + path.resolve(__dirname, '../bou.html'));
    ok(await page.locator('.bou-header h1').textContent() === 'ぼぅ 投稿スタジオ', 'ヘッダーが表示されない');

    /* 生成 → 3案表示 */
    await page.click('#generate-btn');
    await page.waitForSelector('.draft-card', { timeout: 5000 });
    ok(await page.locator('.draft-card').count() === 3, 'ダッシュボードに3案表示されない');

    /* 1案採用 → 残りが不採用表示 */
    await page.locator('.draft-card .btn-select').first().click();
    await page.waitForTimeout(200);
    ok(await page.locator('.draft-card.is-selected').count() === 1, '採用カードの表示がない');
    ok(await page.locator('.draft-card.is-rejected').count() === 2, '不採用カードの表示がない');

    /* 詳細モーダル: 画像プロンプト・フィードバック */
    await page.locator('.draft-card').first().click();
    await page.waitForSelector('.modal-bg.open');
    ok((await page.inputValue('#m-prompt')).includes('mola mola'), 'モーダルに画像生成プロンプトが出ない');
    ok((await page.inputValue('#m-hashtags')).includes('#ぼぅ'), 'モーダルにハッシュタグが出ない');
    await page.locator('.fb-chip[data-fb="もっとゆるく"]').click();
    await page.waitForTimeout(200);
    ok((await page.locator('#m-fb-log li').count()) >= 1, 'フィードバックがログに出ない');
    await page.click('#m-close-btn');

    /* 過去投稿リスト & フィルタ */
    ok(await page.locator('.post-row').count() === 3, '過去投稿リストに3件出ない');
    await page.locator('.filter-btn[data-filter="selected"]').click();
    ok(await page.locator('.post-row').count() === 1, '採用フィルタが効かない');

    /* リロードしても保存されていること（localStorage） */
    await page.reload();
    await page.waitForSelector('.draft-card');
    ok(await page.locator('.draft-card').count() === 3, 'リロード後に3案が復元されない');

    /* キャラクター設定画面 */
    await page.locator('.tab-btn[data-view="settings"]').click();
    ok((await page.inputValue('#ch-concept')).includes('マンボウ'), 'キャラクター設定が表示されない');
    ok((await page.inputValue('#ch-ng')).includes('頑張って'), 'NG表現リストが表示されない');
    ok((await page.inputValue('#ch-template')).includes('{scene}'), 'プロンプト雛形が表示されない');
    ok(await page.locator('.color-dot').count() === 4, '色のガイドが表示されない');

    await browser.close();

    if (errors.length) {
        console.error('NG (' + errors.length + '件)');
        errors.forEach(e => console.error(' - ' + e));
        process.exit(1);
    }
    console.log('すべてOK');
})().catch(e => { console.error(e); process.exit(1); });
