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
    /* コーパス: 全話が3〜5枚のカルーセルで、NG表現を含まないこと（ぼぅの約束） */
    gen.CORPUS.forEach(t => {
        ok(DEFAULT_CHARACTER.themes.includes(t.theme), 'コーパスのテーマが固定設定にない: ' + t.theme);
        t.items.forEach(it => {
            ok(it.pages.length >= 3 && it.pages.length <= 5, 'カルーセルが3〜5枚でない（' + it.pages.length + '枚）: ' + it.pages[0].text);
            const allText = it.pages.map(pg => pg.text).join('\n') + '\n' + it.caption;
            const hits = gen.findNgWords(allText, DEFAULT_CHARACTER);
            ok(hits.length === 0, 'コーパスにNG表現: 「' + it.pages[0].text.replace(/\n/g, '／') + '」 → ' + hits.join('、'));
            it.pages.forEach((pg, i) => {
                ok(pg.text.split('\n').length <= 2, 'ページの文が2行を超えている: ' + pg.text);
                ok(pg.sceneEn && pg.sceneJa, 'シーンが欠けている（' + (i + 1) + '枚目）: ' + it.pages[0].text);
            });
        });
    });
    ok(gen.CORPUS.length >= 14, '投稿テーマが14種類ない（' + gen.CORPUS.length + '種類）');

    /* NGチェッカー自体の動作 */
    ok(gen.findNgWords('明日も頑張って生きよう', DEFAULT_CHARACTER).length > 0, 'NGチェッカーが「頑張って」を見逃した');
    ok(gen.findNgWords('まあ、いっか。', DEFAULT_CHARACTER).length === 0, 'NGチェッカーの誤検知');

    /* リサーチ初期データ: 30アカウント以上・4Phase・分析とぼぅ変換ルールがある */
    const research = store.getResearch();
    ok(research.accounts.length >= 30, '参考アカウントが30件未満（' + research.accounts.length + '件）');
    ok(research.phases.length === 4, '成長Phaseが4段階でない');
    ok(research.patterns.growing.length && research.patterns.fatigue.length && research.patterns.notForBou.length,
        '「伸びる/飽きられる/ぼぅに合わない」の3分類が欠けている');
    ok(research.conversion.length >= 5, 'ぼぅ向け変換ルールが少なすぎる');
    ok(research.bouUsable.length && research.bouAvoid.length, 'ぼぅに使える/使わない要素がない');
    research.accounts.forEach(a => {
        ['name', 'genre', 'followers', 'formats', 'freq', 'save', 'share', 'follow', 'world', 'series',
         'data_type', 'verified', 'source_url', 'source_name'].forEach(k => {
            ok(a[k] !== undefined, 'アカウント「' + a.name + '」に ' + k + ' がない');
        });
        ok(a.checked_at !== undefined, 'アカウント「' + a.name + '」に checked_at がない');
        ok(['verified', 'estimated', 'manual', 'placeholder'].includes(a.data_type),
            'data_typeが不正: ' + a.name + '=' + a.data_type);
        ok(a.verified === (a.data_type === 'verified'), 'verifiedフラグとdata_typeが矛盾: ' + a.name);
        if (a.verified) {
            ok(a.source_url && a.checked_at, '確認済みなのに出所URL/確認日がない: ' + a.name);
        } else {
            ok(a.followers === '未確認', '未確認アカウントの数値が事実として保存されている: ' + a.name + '=' + a.followers);
        }
    });
    const verifiedCount = research.accounts.filter(a => a.verified).length;
    ok(verifiedCount >= 15, '確認済みアカウントが少なすぎる（' + verifiedCount + '件）');

    /* 投稿構造ライブラリ: 8つの型があり、各構造に10項目の分析軸と「抽出→ぼぅ変換」がある */
    ok(research.structureTypes.length === 8, '投稿の型が8種類でない（' + research.structureTypes.length + '）');
    ok(research.structures.length >= 8, '構造ライブラリが8件未満（' + research.structures.length + '件）');
    research.structures.forEach(s => {
        ['type', 'theme', 'hook', 'carousel', 'textAmount', 'empathy', 'afterFeel', 'charRole', 'scene',
         'extraction', 'bouConversion'].forEach(k => {
            ok(s[k], '構造「' + s.type + '」に ' + k + ' がない');
        });
        ok(research.structureTypes.includes(s.type), '構造の型が8分類にない: ' + s.type);
        const hits = gen.findNgWords(s.bouConversion, DEFAULT_CHARACTER);
        ok(hits.length === 0, '構造のぼぅ変換例にNG表現: ' + s.type + ' → ' + hits.join('、'));
    });

    /* 3案生成（内蔵モード）: A/B/C・テーマ違い・型付き・各案3〜5枚のカルーセル */
    const drafts = await gen.generateBatch(store, 'builtin');
    ok(drafts.length === 3, '3案生成されない（' + drafts.length + '案）');
    ok(new Set(drafts.map(d => d.theme)).size === 3, '3案のテーマが重複している');
    ok(drafts.map(d => d.variant).join('') === 'ABC', 'A/B/C案になっていない');
    ok(drafts[0].proposal_type === '王道共感型', 'A案が王道共感型でない（' + drafts[0].proposal_type + '）');
    ok(drafts[1].proposal_type === '本質型', 'B案が本質型でない（' + drafts[1].proposal_type + '）');
    ok(drafts[2].proposal_type === '保存・シェア型', 'C案が保存・シェア型でない（' + drafts[2].proposal_type + '）');
    drafts.forEach(d => {
        ok(d.evaluation && typeof d.evaluation.average === 'number', d.variant + '案に内部評価がない');
        ok(Object.keys(d.evaluation.scores).length === 10, '評価が10項目でない（' + Object.keys(d.evaluation.scores).length + '項目）');
        ok(d.evaluation.pass, d.variant + '案が評価基準を満たさないまま出力された: ' + d.evaluation.flags.join('、'));
        ok(research.structureTypes.includes(d.structure_used),
            d.variant + '案に使った投稿構造が記録されていない（' + d.structure_used + '）');
    });

    /* 評価チェッカー: 説教・元気すぎ・NG表現を検出して落とすこと */
    const badPost = { theme: '疲れ', main_text: '前向きに頑張ってみましょう！', caption: '努力すればできる！',
        pages: [{ text: '前向きに頑張ってみましょう！', scene: 'デスク' }], proposal_type: '王道共感型' };
    const badEval = gen.evaluatePost(badPost, store, DEFAULT_CHARACTER);
    ok(!badEval.pass, '説教・NG表現入りの投稿が評価を通ってしまった');
    ok(badEval.flags.length >= 2, 'NG理由のフラグが立っていない');
    drafts.forEach(d => {
        ['id', 'created_at', 'theme', 'main_text', 'scene', 'image_prompt', 'caption', 'hashtags', 'status', 'pages'].forEach(k => {
            ok(d[k] !== undefined && d[k] !== '', '生成結果に ' + k + ' がない');
        });
        ok(d.status === 'draft', '生成直後のstatusがdraftでない: ' + d.status);
        ok(d.pages.length >= 3 && d.pages.length <= 5, 'カルーセルが3〜5枚でない（' + d.pages.length + '枚）');
        ok(d.main_text === d.pages[0].text, 'main_textが1枚目のテキストと一致しない');
        d.pages.forEach((pg, i) => {
            ok(pg.image_prompt && pg.image_prompt.includes('#9DAEB8') && pg.image_prompt.includes('mola mola'),
                (i + 1) + '枚目の画像プロンプトに固定デザインが入っていない');
            ok(!pg.image_prompt.includes('{scene}'), (i + 1) + '枚目の画像プロンプトにシーンが差し込まれていない');
            ok(pg.image_prompt.includes('image ' + (i + 1) + ' of ' + d.pages.length),
                (i + 1) + '枚目の画像プロンプトに連作の一貫性指示がない');
        });
        ok(d.hashtags.length <= 5, 'ハッシュタグが5個を超えている');
        ok(d.hashtags.includes('#ぼぅ'), 'ハッシュタグに #ぼぅ がない');
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

    /* 生成 → 3案表示（枚数チップとページドット付き） */
    await page.click('#generate-btn');
    await page.waitForSelector('.draft-card', { timeout: 5000 });
    ok(await page.locator('.draft-card').count() === 3, 'ダッシュボードに3案表示されない');
    const firstDots = await page.locator('.draft-card').first().locator('.page-dot').count();
    ok(firstDots >= 3 && firstDots <= 5, 'カードのページドットが3〜5個でない（' + firstDots + '個）');

    /* 1案採用 → 残りが不採用表示 */
    await page.locator('.draft-card .btn-select').first().click();
    await page.waitForTimeout(200);
    ok(await page.locator('.draft-card.is-selected').count() === 1, '採用カードの表示がない');
    ok(await page.locator('.draft-card.is-rejected').count() === 2, '不採用カードの表示がない');

    /* 詳細モーダル: ページごとの編集欄・プロンプト・フィードバック */
    await page.locator('.draft-card').first().click();
    await page.waitForSelector('.modal-bg.open');
    const pageCards = await page.locator('#m-pages .page-card').count();
    ok(pageCards === firstDots, 'モーダルのページ数がカードの枚数と一致しない（' + pageCards + '/' + firstDots + '）');
    ok((await page.locator('#m-pages .page-prompt').first().inputValue()).includes('mola mola'), 'モーダルに画像生成プロンプトが出ない');
    ok((await page.inputValue('#m-hashtags')).includes('#ぼぅ'), 'モーダルにハッシュタグが出ない');

    /* ページの追加と削除 */
    if (pageCards < 5) {
        await page.click('#add-page-btn');
        ok(await page.locator('#m-pages .page-card').count() === pageCards + 1, 'ページが追加できない');
        await page.locator('#m-pages .page-del').last().click();
        ok(await page.locator('#m-pages .page-card').count() === pageCards, 'ページが削除できない');
    }

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

    /* 詳細モーダルに内部評価が出る */
    await page.locator('.draft-card').first().click();
    await page.waitForSelector('.modal-bg.open');
    ok(await page.locator('#m-evaluation .eval-item').count() === 10, 'モーダルに10項目の内部評価が出ない');
    await page.click('#m-close-btn');

    /* リサーチページ: 投稿構造ライブラリが本体として表示・編集できる */
    await page.locator('.tab-btn[data-view="research"]').click();
    ok(await page.locator('#structure-list .structure-card').count() >= 8, '構造ライブラリのカードが8件以上出ない');
    await page.locator('#structure-list .structure-card').first().click();
    ok(await page.locator('#structure-detail [data-struct-field]').count() === 11, '構造編集フォームに11項目出ない');
    ok(await page.locator('#struct-type option').count() === 8, '構造の型セレクタに8択出ない');
    await page.click('#struct-close-btn');

    /* リサーチページ: アカウント一覧・実データ/仮データの区別・分析・変換ルール */
    ok(await page.locator('#account-table tbody tr').count() >= 30, 'アカウント一覧に30件以上出ない');
    ok(await page.locator('#account-table tbody .badge-data').count() >= 30, 'データ種別バッジが各行に出ない');
    ok(await page.locator('#account-table tbody .badge-data.verified').count() >= 15, '確認済みバッジが出ない');
    ok(await page.locator('#account-table tbody .badge-data.estimated').count() >= 3, '未確認・推定バッジが出ない');
    ok((await page.locator('#account-table tbody').textContent()).includes('未確認'), '未確認の表示がない');
    ok(await page.locator('#research-note .badge-data').count() === 4, '概要に4種別の件数バッジが出ない');
    ok(await page.locator('#pattern-analysis .pattern-block').count() >= 10, 'パターン分析ブロックが出ない');
    ok(await page.locator('#conversion-rules .conv-row').count() >= 5, '変換ルールが出ない');
    await page.locator('#account-table tbody tr').first().click();
    ok(await page.locator('#account-detail [data-acc-field]').count() === 21, 'アカウント詳細に21項目出ない');
    ok(await page.locator('#acc-data-type').count() === 1, 'データ種別セレクタが出ない');
    await page.click('#acc-close-btn');

    /* 投稿戦略ページ: Phase切替と戦略フォーム */
    await page.locator('.tab-btn[data-view="strategy"]').click();
    ok(await page.locator('#phase-buttons .filter-btn').count() === 4, 'Phaseボタンが4つ出ない');
    ok((await page.inputValue('#st-positioning')).length > 10, 'ポジショニングの初期値が出ない');
    await page.locator('#phase-buttons .filter-btn').nth(1).click();
    await page.waitForTimeout(150);
    ok((await page.locator('#phase-detail').textContent()).includes('保存・シェア'), 'Phase 2の詳細が出ない');

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
