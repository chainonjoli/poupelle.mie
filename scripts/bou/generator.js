/* ぼぅ投稿システム 生成層
 *
 * 「今日のぼぅ投稿を作って」→ A/B/C の3案（テーマ・文章・シーンを変えて）を返す。
 *
 * 2モード:
 *   builtin … ぼぅの声で書き溜めた内蔵コーパスから生成（APIキー不要）
 *   api     … Claude API（claude-opus-5）をブラウザから直接呼ぶ
 *
 * どちらも毎回キャラクター固定設定を参照し、出力はNG表現チェッカーを通す。
 * 画像生成APIは第二段階: registerImageAdapter() が差し込み口。 */
(function () {
    'use strict';

    /* ================= 内蔵コーパス =================
     * text: 画像内メインテキスト（1〜3行） / caption: Instagramキャプション
     * sceneJa/sceneEn: シーン（Enは画像プロンプト差し込み用） */
    var CORPUS = [
        { theme: '疲れ', items: [
            { text: '何もしてないのに、\n疲れた。', sceneJa: 'ソファに沈んでいる', sceneEn: 'sinking deep into a soft sofa, completely still', caption: 'そういう日も、ある。' },
            { text: '疲れたって言うのも、\n疲れる。', sceneJa: '枕に顔を半分うずめている', sceneEn: 'half burying its face into a big pillow', caption: '今日はもう、しゃべらんとこ。' },
            { text: 'とりあえず、\n浮いとく。', sceneJa: '海の中をゆっくり漂う', sceneEn: 'floating slowly and weightlessly in calm quiet water', caption: '浮くのは、得意。' }
        ] },
        { theme: '仕事', items: [
            { text: '今日は、ここまで。', sceneJa: 'デスクの隅でぼーっとする', sceneEn: 'sitting blankly at the corner of a desk with a closed laptop', caption: '区切りは、自分で決めてええらしい。' },
            { text: 'やった感は、ないけど。\nやってはいた。', sceneJa: 'デスクで温かいお茶を持っている', sceneEn: 'holding a warm mug at a desk, steam rising softly', caption: 'それで、じゅうぶん。' },
            { text: '月曜のことは、\n月曜のぼくが考える。', sceneJa: '布団にもぐりかけている', sceneEn: 'crawling halfway into a fluffy futon', caption: '今のぼくは、もう寝る係。' }
        ] },
        { theme: '人間関係', items: [
            { text: 'あの一言、\nまだ考えてる。', sceneJa: '窓の外をぼんやり見る', sceneEn: 'gazing blankly out of a window at the soft evening light', caption: '考えても、答えは出んかった。' },
            { text: 'きらいじゃないけど、\n今日は会えん日。', sceneJa: '布団から目だけ出している', sceneEn: 'peeking only its eyes out from under a blanket', caption: 'そういう日が、あってもええ。' },
            { text: '合わせすぎて、\n自分がどっか行った。', sceneJa: 'お風呂に浸かっている', sceneEn: 'soaking quietly in a warm bath with tiny bubbles', caption: 'お風呂で、迎えに行く。' }
        ] },
        { theme: 'SNS', items: [
            { text: 'スマホ置こうと思って、\n30分経った。', sceneJa: 'ソファでスマホを見ている', sceneEn: 'lying on a sofa looking at a smartphone with a blank face', caption: 'まあ、そんなもん。' },
            { text: 'みんなの近況、\n見てただけの日。', sceneJa: '電車のすみっこで揺られている', sceneEn: 'sitting in the corner of a quiet train, swaying gently', caption: '見てるだけでも、疲れるんよな。' },
            { text: 'いいねは、した。\n今日の社交、終わり。', sceneJa: '布団の中でスマホが顔に落ちそう', sceneEn: 'in a futon, about to drop a smartphone on its own face', caption: 'よくやったほう。' }
        ] },
        { theme: '返信', items: [
            { text: '返信しようとは、\n思ってる。', sceneJa: 'ソファでスマホを見ている', sceneEn: 'holding a smartphone on a sofa, staring at it without typing', caption: '思ってるだけの日も、ある。' },
            { text: '「あとで返す」の\nあとで、まだ来てない。', sceneJa: '窓辺でぼーっとしている', sceneEn: 'resting by a window, doing nothing in the soft light', caption: 'あとでは、いつか来る。たぶん。' },
            { text: '文章考えてたら、\n夜になった。', sceneJa: 'デスクで頬づえをついている', sceneEn: 'resting its face on the desk beside a dim lamp at night', caption: '明日の文章力に、任せた。' }
        ] },
        { theme: '予定', items: [
            { text: '急ぐ用事、\nなかった。', sceneJa: '駅のホームで電車を待つ', sceneEn: 'waiting alone on a quiet train platform, standing still', caption: '一本、見送ってみた。' },
            { text: '予定のない休日を、\n予定通り過ごした。', sceneJa: 'ソファでクッションを抱えている', sceneEn: 'hugging a round cushion on a sofa all day', caption: '完璧な一日やった。' },
            { text: 'カレンダー見たら、\n今日は白かった。', sceneJa: '水面の光を見上げている', sceneEn: 'looking up at soft light shimmering on the water surface from below', caption: '白い日は、浮く日。' }
        ] },
        { theme: '休息', items: [
            { text: '休むのも、\n今日のやること。', sceneJa: '布団にもぐっている', sceneEn: 'nestled deep inside a fluffy white futon, eyes closed', caption: 'ちゃんと、こなした。' },
            { text: 'ほっと一息。\n二息目も、いく。', sceneJa: '温かい飲み物を持って一息つく', sceneEn: 'holding a warm mug with both fins, taking a slow break', caption: '何杯でも、どうぞ。' },
            { text: '目ぇつぶってただけ。\nでも、良かった。', sceneJa: 'お風呂でうとうとしている', sceneEn: 'dozing off in a warm bath, very relaxed', caption: 'のぼせる前に、あがろな。' }
        ] },
        { theme: '自己肯定', items: [
            { text: '今日も生きてた。\nそれで、ええ。', sceneJa: '海の中をゆっくり漂う', sceneEn: 'drifting peacefully in calm blue water among tiny bubbles', caption: 'えらいとかじゃなくて、ええの。' },
            { text: 'できんかったことは、\n数えんとこ。', sceneJa: '窓の外の夕焼けを見ている', sceneEn: 'watching a pale sunset sky through a window', caption: '数えるなら、ごはんの回数。' },
            { text: 'ぼくはぼくを、\nやっている。', sceneJa: '鏡の前でぼーっとしている', sceneEn: 'looking blankly at itself in a small mirror', caption: 'それが一番、むずかしいやつ。' }
        ] },
        { theme: 'ひとり時間', items: [
            { text: 'ひとりの時間が、\n一番しゃべってる。', sceneJa: 'お風呂に浸かっている', sceneEn: 'soaking in a warm bath, small bubbles floating around', caption: '頭の中は、にぎやか。' },
            { text: '誰にも会わん日は、\n顔が休みの日。', sceneJa: '布団の上でだらんとしている', sceneEn: 'sprawled loosely on top of a futon, totally relaxed', caption: '表情筋も、休暇。' },
            { text: '今日はひとりで、\nようやっとった。', sceneJa: '本を開いたまま止まっている', sceneEn: 'holding an open book but staring into space', caption: '本は、3行読んだ。' }
        ] },
        { theme: '考えすぎ', items: [
            { text: '考えるん、\n明日でもええか。', sceneJa: '布団から出られない', sceneEn: 'lying in a futon looking at the ceiling, unable to get up', caption: '明日のぼくは、たぶん賢い。' },
            { text: '答えの出んことを、\nずっと煮てた。', sceneJa: 'お鍋の前でぼーっとしている', sceneEn: 'staring blankly at a small pot simmering on a stove', caption: '煮ても、出汁しか出んかった。' },
            { text: '頭の中の会議、\n延長戦してる。', sceneJa: '枕に沈んでいる', sceneEn: 'sinking slowly into a soft pillow at night', caption: '議題は、明日に持ち越し。' }
        ] },
        { theme: 'やる気が出ない日', items: [
            { text: 'やる気は、\n待っても来んかった。', sceneJa: 'ソファでだらんとしている', sceneEn: 'melting loosely into a sofa, arms dangling', caption: '来ん日は、来ん。' },
            { text: 'エンジンかからんまま、\n一日終わった。', sceneJa: '窓辺で外を見ている', sceneEn: 'leaning by a window, watching clouds drift by', caption: 'それでも一日は、ちゃんと終わる。' },
            { text: 'とりあえず座った。\n今日はそれで合格。', sceneJa: 'デスクの椅子に座っただけ', sceneEn: 'just sitting on a desk chair, doing nothing yet', caption: '座るの、意外と大事。' }
        ] },
        { theme: '何もしたくない日', items: [
            { text: '何もしたくない日は、\n何もせん。', sceneJa: '布団にもぐる', sceneEn: 'completely wrapped in a fluffy futon like a cocoon', caption: '予定通りです。' },
            { text: '今日の実績：\n呼吸。', sceneJa: '海の底でじっとしている', sceneEn: 'resting still on the calm sandy sea floor', caption: 'じゅうぶん、生きてる。' },
            { text: '「なにもしない」を、\nしてた。', sceneJa: 'ソファでクッションと一体化', sceneEn: 'merging with a big round cushion on a sofa', caption: 'これが、意外と忙しい。' }
        ] },
        { theme: '比べてしまう日', items: [
            { text: 'よその光は、\nまぶしく見えるだけ。', sceneJa: '水面の光を見上げる', sceneEn: 'looking up from underwater at glittering light on the surface', caption: 'ぼくはぼくの深さで、浮いとく。' },
            { text: '比べそうになったら、\n画面を閉じる日。', sceneJa: 'スマホを裏返して置いた', sceneEn: 'placing a smartphone face-down on a table and looking away', caption: '裏返すだけで、ちょっと静か。' },
            { text: 'マンボウは、\nマンボウのペース。', sceneJa: '魚の群れを見送っている', sceneEn: 'watching a school of small fish swim past, staying still', caption: '追いかけんでも、海はある。' }
        ] },
        { theme: '明日に回したいこと', items: [
            { text: 'それ、\n明日のぼくにお願いした。', sceneJa: '布団にもぐるところ', sceneEn: 'crawling into a futon, leaving things on the desk', caption: '明日のぼく、よろしく。' },
            { text: '洗いものと、\n話し合いの結果。明日。', sceneJa: '台所を横目に通り過ぎる', sceneEn: 'drifting past a small kitchen sink, glancing sideways', caption: '円満に、先送り。' },
            { text: '今日できることを、\n明日でもできることに。', sceneJa: '電気を消すところ', sceneEn: 'reaching to turn off a small warm lamp at night', caption: 'おやすみの才能は、ある。' }
        ] }
    ];

    /* ================= 共通ユーティリティ ================= */

    function findNgWords(text, character) {
        var hits = [];
        var ng = (character && character.ngWords) || [];
        for (var i = 0; i < ng.length; i++) {
            if (text && text.indexOf(ng[i]) !== -1) hits.push(ng[i]);
        }
        return hits;
    }

    /* 投稿1件のテキスト面をまとめて検査する */
    function checkPost(post, character) {
        var joined = [post.main_text, post.caption, (post.hashtags || []).join(' ')].join('\n');
        return findNgWords(joined, character);
    }

    function buildImagePrompt(character, sceneEn) {
        return character.imagePromptTemplate.replace('{scene}', sceneEn);
    }

    function pickHashtags(character, rng) {
        var pool = character.hashtagPool.slice();
        var picked = ['#ぼぅ'];
        var rest = pool.filter(function (t) { return t !== '#ぼぅ'; });
        while (picked.length < 5 && rest.length) {
            picked.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
        }
        return picked;
    }

    /* ================= 内蔵モード ================= */

    /* 直近に使ったテーマ・文章を避けつつ3テーマ選ぶ */
    function generateBuiltin(character, store) {
        var rng = Math.random;
        var learning = store.getLearningContext();
        var posts = store.getPosts();

        var recentThemes = {};
        var recentTexts = {};
        for (var i = 0; i < Math.min(posts.length, 12); i++) {
            recentThemes[posts[i].theme] = true;
            recentTexts[posts[i].main_text] = true;
        }

        /* フィードバックに「ゆるく」「言いすぎ」が多いときは短い文を優先する */
        var preferShort = learning.recentComments.filter(function (c) {
            return /ゆるく|言いすぎ|いいすぎ|強い/.test(c.text || '');
        }).length >= 2;

        var themes = CORPUS.filter(function (t) { return character.themes.indexOf(t.theme) !== -1 || true; });
        var fresh = themes.filter(function (t) { return !recentThemes[t.theme]; });
        var sourcePool = (fresh.length >= 3 ? fresh : themes).slice();

        var variants = ['A', 'B', 'C'];
        var batchId = store.makeId('b');
        var drafts = [];

        for (var v = 0; v < 3 && sourcePool.length; v++) {
            var themeEntry = sourcePool.splice(Math.floor(rng() * sourcePool.length), 1)[0];
            var items = themeEntry.items.filter(function (it) { return !recentTexts[it.text]; });
            if (!items.length) items = themeEntry.items;
            if (preferShort) {
                items = items.slice().sort(function (a, b) { return a.text.length - b.text.length; });
                items = items.slice(0, Math.max(1, Math.ceil(items.length / 2)));
            }
            var item = items[Math.floor(rng() * items.length)];

            drafts.push({
                id: store.makeId('p'),
                created_at: store.nowIso(),
                updated_at: store.nowIso(),
                batch_id: batchId,
                variant: variants[v],
                theme: themeEntry.theme,
                main_text: item.text,
                scene: item.sceneJa,
                image_prompt: buildImagePrompt(character, item.sceneEn),
                caption: item.caption,
                hashtags: pickHashtags(character, rng),
                status: 'draft',
                generator: 'builtin',
                user_feedback: []
            });
        }
        return Promise.resolve(drafts);
    }

    /* ================= Claude APIモード ================= */

    var API_URL = 'https://api.anthropic.com/v1/messages';
    var API_MODEL = 'claude-opus-5';

    var PROPOSAL_SCHEMA = {
        type: 'object',
        additionalProperties: false,
        required: ['proposals'],
        properties: {
            proposals: {
                type: 'array', minItems: 3, maxItems: 3,
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['theme', 'main_text', 'scene_ja', 'scene_en', 'caption', 'hashtags'],
                    properties: {
                        theme: { type: 'string' },
                        main_text: { type: 'string', description: '画像内メインテキスト。1〜3行。改行は\\n' },
                        scene_ja: { type: 'string', description: 'ぼぅが何をしているか（日本語）' },
                        scene_en: { type: 'string', description: '同じシーンの英語表現。画像生成プロンプトに差し込む' },
                        caption: { type: 'string', description: 'Instagramキャプション。短め。画像内の文章を繰り返しすぎない' },
                        hashtags: { type: 'array', maxItems: 5, items: { type: 'string' } }
                    }
                }
            }
        }
    };

    function buildSystemPrompt(character, learning) {
        var lines = [];
        lines.push('あなたはオリジナルキャラクター「' + character.name + '」（' + character.motif + '）のInstagram投稿を作る専属ライターです。');
        lines.push('');
        lines.push('# キャラクター');
        lines.push('コンセプト: ' + character.concept);
        lines.push('役割: ' + character.role);
        lines.push('性格: ' + character.personality.join('、'));
        lines.push('');
        lines.push('# 話し方のルール');
        for (var i = 0; i < character.speech.rules.length; i++) lines.push('- ' + character.speech.rules[i]);
        lines.push('口ぐせの例: ' + character.speech.examples.join(' / '));
        lines.push('');
        lines.push('# 絶対に使わない表現');
        lines.push(character.ngWords.join('、'));
        lines.push('「役に立つ情報」より「これ私やん」という共感を優先する。1投稿につき1テーマ。');
        lines.push('');
        lines.push('# 投稿テーマの候補');
        lines.push(character.themes.join('、'));

        if (learning.goodExamples.length) {
            lines.push('');
            lines.push('# ユーザーが採用した過去の投稿（この方向性を優先する）');
            learning.goodExamples.forEach(function (p) {
                lines.push('- テーマ「' + p.theme + '」: ' + (p.main_text || '').replace(/\n/g, '／'));
            });
        }
        if (learning.badExamples.length) {
            lines.push('');
            lines.push('# ユーザーが不採用にした投稿（この方向は避ける）');
            learning.badExamples.forEach(function (p) {
                var fb = (p.user_feedback || []).map(function (f) { return f.text; }).join('、');
                lines.push('- 「' + (p.main_text || '').replace(/\n/g, '／') + '」' + (fb ? '（理由: ' + fb + '）' : ''));
            });
        }
        if (learning.recentComments.length) {
            lines.push('');
            lines.push('# ユーザーからの最近のフィードバック（最優先で反映する）');
            learning.recentComments.forEach(function (c) {
                lines.push('- ' + c.text + (c.main_text ? '（対象: ' + c.main_text.replace(/\n/g, '／') + '）' : ''));
            });
        }
        return lines.join('\n');
    }

    function generateApi(character, store, apiKey) {
        var learning = store.getLearningContext();
        var userMsg = '今日のぼぅ投稿の案を3つ作ってください。' +
            '3案はテーマ・文章・シーンを少しずつ変えること。' +
            'ハッシュタグは最大5個で、次の候補から選ぶか近い雰囲気で: ' + character.hashtagPool.join(' ');

        return fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: API_MODEL,
                max_tokens: 16000,
                system: buildSystemPrompt(character, learning),
                output_config: { format: { type: 'json_schema', schema: PROPOSAL_SCHEMA } },
                messages: [{ role: 'user', content: userMsg }]
            })
        }).then(function (res) {
            if (!res.ok) {
                return res.json().catch(function () { return {}; }).then(function (body) {
                    var msg = (body.error && body.error.message) || ('HTTP ' + res.status);
                    if (res.status === 401) msg = 'APIキーが正しくありません（401）';
                    if (res.status === 429) msg = 'レート制限です。少し待ってからもう一度（429）';
                    throw new Error(msg);
                });
            }
            return res.json();
        }).then(function (data) {
            if (data.stop_reason === 'refusal') throw new Error('APIが生成を拒否しました。もう一度お試しください');
            var text = '';
            for (var i = 0; i < (data.content || []).length; i++) {
                if (data.content[i].type === 'text') text += data.content[i].text;
            }
            var parsed = JSON.parse(text.replace(/^```json\s*|```\s*$/g, ''));
            var variants = ['A', 'B', 'C'];
            var batchId = store.makeId('b');
            return parsed.proposals.slice(0, 3).map(function (p, idx) {
                return {
                    id: store.makeId('p'),
                    created_at: store.nowIso(),
                    updated_at: store.nowIso(),
                    batch_id: batchId,
                    variant: variants[idx],
                    theme: p.theme,
                    main_text: p.main_text,
                    scene: p.scene_ja,
                    image_prompt: buildImagePrompt(character, p.scene_en),
                    caption: p.caption,
                    hashtags: (p.hashtags || []).slice(0, 5),
                    status: 'draft',
                    generator: 'api',
                    user_feedback: []
                };
            });
        });
    }

    /* ================= 画像生成アダプタ（第二段階の差し込み口） ================= */

    var imageAdapter = null;

    var BouGenerator = {
        CORPUS: CORPUS,
        findNgWords: findNgWords,
        checkPost: checkPost,
        buildImagePrompt: buildImagePrompt,

        /* 3案生成。mode未指定時は設定に従う。返り値: Promise<Post[]>（保存はしない） */
        generateBatch: function (store, mode, apiKey) {
            var character = store.getCharacter();
            if (mode === 'api') {
                if (!apiKey) return Promise.reject(new Error('Claude APIキーが設定されていません（キャラクター設定画面から設定できます）'));
                return generateApi(character, store, apiKey);
            }
            return generateBuiltin(character, store);
        },

        registerImageAdapter: function (adapter) {
            if (!adapter || typeof adapter.generate !== 'function') throw new Error('generate(post) を持つアダプタを渡してください');
            imageAdapter = adapter;
        },
        getImageAdapter: function () { return imageAdapter; }
    };

    if (typeof window !== 'undefined') { window.BouGenerator = BouGenerator; }
    if (typeof module !== 'undefined' && module.exports) { module.exports = BouGenerator; }
})();
