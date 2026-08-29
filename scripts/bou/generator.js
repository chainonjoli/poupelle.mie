/* ぼぅ投稿システム 生成層
 *
 * 「今日のぼぅ投稿を作って」→ A/B/C の3案（テーマ・文章・シーンを変えて）を返す。
 * 1投稿は3〜5枚のカルーセル（連作画像）。
 *   1枚目 = 共感の入り口（表紙） / 中間 = 小さな展開 / 最後 = 力の抜けるゆるい着地
 *
 * 2モード:
 *   builtin … ぼぅの声で書き溜めた内蔵コーパス（連作ストーリー）から生成（APIキー不要）
 *   api     … Claude API（claude-opus-5）をブラウザから直接呼ぶ
 *
 * どちらも毎回キャラクター固定設定を参照し、出力はNG表現チェッカーを通す。
 * 画像生成APIは第二段階: registerImageAdapter() が差し込み口。 */
(function () {
    'use strict';

    /* ================= 内蔵コーパス（カルーセル連作） =================
     * pages: 3〜5枚。text = そのページの文（1〜2行）/ sceneJa/sceneEn = シーン
     * caption: Instagramキャプション（画像内の文章を繰り返しすぎない） */
    var CORPUS = [
        { theme: '疲れ', items: [
            { caption: '記憶にない労働、いちばん疲れる。', pages: [
                { text: '何もしてないのに、\n疲れた。', sceneJa: 'ソファに沈んでいる', sceneEn: 'sinking deep into a soft sofa, completely still' },
                { text: 'いや、たぶん\n何かは してた。', sceneJa: '天井を見ている', sceneEn: 'lying on its back, staring blankly at the ceiling' },
                { text: '思い出せんだけで。', sceneJa: 'お茶を持って考えている', sceneEn: 'holding a warm mug, thinking with a blank face' },
                { text: '思い出すのも疲れるから、\nやめた。', sceneJa: 'ぺたんと伸びている', sceneEn: 'lying completely flat and relaxed like a melted mochi' }
            ] },
            { caption: 'おやすみは、最強の充電器。', pages: [
                { text: '今日の電池、\nのこり1%。', sceneJa: '薄暗い部屋でぼんやり', sceneEn: 'sitting in a dim cozy room, drooping a little' },
                { text: '省エネモードで\n生きてる。', sceneJa: 'ゆっくり漂っている', sceneEn: 'drifting very slowly in calm water, half-closed eyes' },
                { text: '動かんのも、\n電池にやさしい。', sceneJa: 'じっと浮いている', sceneEn: 'floating perfectly still in quiet water' },
                { text: '充電は、寝るだけ。', sceneJa: '布団で眠る', sceneEn: 'sleeping peacefully in a fluffy white futon' }
            ] }
        ] },
        { theme: '仕事', items: [
            { caption: '明日のぼく、頼んだ。', pages: [
                { text: '今日は、ここまで。', sceneJa: 'デスクでノートPCを閉じる', sceneEn: 'gently closing a laptop at a small desk' },
                { text: 'まだ途中やけど。', sceneJa: '机に書類が残っている', sceneEn: 'looking sideways at a small stack of papers left on the desk' },
                { text: '途中まで\nやったってこと。', sceneJa: 'のびをしている', sceneEn: 'stretching its round body with a relieved face' },
                { text: 'つづきは、\n明日のぼくが強い。', sceneJa: 'デスクを離れる', sceneEn: 'drifting away from the desk toward a warm lamp light' }
            ] },
            { caption: '出席点、大事。', pages: [
                { text: 'がんばった感は、\nない。', sceneJa: 'デスクでぼーっとする', sceneEn: 'sitting blankly at the corner of a desk' },
                { text: 'でも席には、\nおった。', sceneJa: '椅子にちょこんと座る', sceneEn: 'sitting quietly on a chair, small and round' },
                { text: 'おるのも、仕事。', sceneJa: 'ゆっくりうなずく', sceneEn: 'nodding slowly to itself with tiny dot eyes' }
            ] }
        ] },
        { theme: '人間関係', items: [
            { caption: 'ひとり反省会、閉会。', pages: [
                { text: 'あの一言、\nまだ考えてる。', sceneJa: '夕方の窓の外を見る', sceneEn: 'gazing out of a window at the soft evening light' },
                { text: 'たぶん相手は、\nもう忘れてる。', sceneJa: '夜の月を見上げる', sceneEn: 'looking up at a pale round moon in the night sky' },
                { text: 'ぼくだけの、\n延長戦やった。', sceneJa: 'お風呂に浸かる', sceneEn: 'soaking in a warm bath, small bubbles around' },
                { text: 'ぼくも、忘れよ。', sceneJa: '湯気と一緒にとける', sceneEn: 'relaxing deeper into the bath as soft steam rises' }
            ] },
            { caption: '閉店日も、あるんよ。', pages: [
                { text: '会いたい人は、おる。\n今日じゃないだけ。', sceneJa: '布団から目だけ出す', sceneEn: 'peeking only its eyes out from under a blanket' },
                { text: '気持ちの玄関が、\n今日は閉まってる。', sceneJa: '閉まったドアのそば', sceneEn: 'resting beside a small closed wooden door' },
                { text: 'また開く日に、\n会いに行く。', sceneJa: '小さく手を振る', sceneEn: 'giving a tiny gentle wave with a small fin' }
            ] }
        ] },
        { theme: 'SNS', items: [
            { caption: '親指だけ、フルマラソン。', pages: [
                { text: '5分だけ、\nのつもりが', sceneJa: 'ソファでスマホを見る', sceneEn: 'lying on a sofa looking at a smartphone' },
                { text: '気づいたら、夜。', sceneJa: '暗い部屋でスマホの光', sceneEn: 'in a dark room, face lit softly by a smartphone glow' },
                { text: 'スマホの中、\n一日ぶん旅した。', sceneJa: 'ちょっと目が回っている', sceneEn: 'slightly dizzy with tiny swirl marks above its head' },
                { text: '現実のぼくは、\n1歩も動いてない。', sceneJa: '同じ場所に沈んでいる', sceneEn: 'still in the exact same spot on the sofa' },
                { text: 'それはそれで、\nすごい。', sceneJa: '妙に納得している', sceneEn: 'nodding once with a calm blank face' }
            ] },
            { caption: 'まぶしい日は、日陰で浮く。', pages: [
                { text: 'キラキラした投稿、\n見すぎた。', sceneJa: 'スマホをスクロール', sceneEn: 'scrolling a smartphone with a blank stare' },
                { text: 'まぶしいときは、', sceneJa: '目を閉じる', sceneEn: 'closing its eyes gently, face calm' },
                { text: '画面を伏せて、\n浮いとく。', sceneJa: 'スマホを裏返して浮く', sceneEn: 'floating peacefully beside a phone placed face-down' }
            ] }
        ] },
        { theme: '返信', items: [
            { caption: '気持ちは、もう届いてると思う。たぶん。', pages: [
                { text: '返信しようとは、\n思ってる。', sceneJa: 'ソファでスマホを見る', sceneEn: 'holding a smartphone on a sofa, staring at it' },
                { text: '文面も、\n半分できてる。', sceneJa: '打ちかけで止まっている', sceneEn: 'paused mid-typing, fin hovering over the phone' },
                { text: 'あとは、送るだけ。', sceneJa: '送信ボタンの前で固まる', sceneEn: 'frozen still, staring at the phone screen up close' },
                { text: '…明日、送る。', sceneJa: 'スマホを置いて寝る', sceneEn: 'putting the phone down and curling up to sleep' }
            ] },
            { caption: '実質、既読返信。', pages: [
                { text: '「あとで返す」って\n言うたやつ。', sceneJa: '通知を見つめる', sceneEn: 'looking at a phone notification with round dot eyes' },
                { text: 'あとでは、\nまだ来てない。', sceneJa: '時計を見ている', sceneEn: 'watching a small wall clock tick' },
                { text: 'でも、ずっと\n気にはしてる。', sceneJa: 'スマホを抱えている', sceneEn: 'hugging the smartphone gently against its belly' },
                { text: '気にしてる分、\nもう半分返してる。', sceneJa: '自分に納得する', sceneEn: 'nodding slowly, convincing itself' }
            ] }
        ] },
        { theme: '予定', items: [
            { caption: '急がへん日の、ごほうび。', pages: [
                { text: '急ぐ用事、\nなかった。', sceneJa: '駅のホームに立つ', sceneEn: 'standing alone on a quiet train platform' },
                { text: '電車、一本\n見送ってみた。', sceneJa: '電車が通り過ぎる', sceneEn: 'watching a soft-colored train pass by gently' },
                { text: 'ホームの風、\nちょっと良かった。', sceneJa: '風に吹かれている', sceneEn: 'fins swaying slightly in a gentle platform breeze, eyes closed' }
            ] },
            { caption: '無計画も、計画のうち。', pages: [
                { text: '今日の予定：なし。', sceneJa: '真っ白なカレンダー', sceneEn: 'looking at a blank white calendar on the wall' },
                { text: 'なので、浮く。', sceneJa: 'ぷかぷか浮く', sceneEn: 'floating weightlessly in calm pale blue water' },
                { text: '予定どおり、\n何もせんかった。', sceneJa: '夕方もまだ浮いている', sceneEn: 'still floating as the light turns warm and dim' },
                { text: '皆勤賞。', sceneJa: 'ちいさな星がひとつ', sceneEn: 'a single tiny star twinkling above its head' }
            ] }
        ] },
        { theme: '休息', items: [
            { caption: 'おつかれさま、ぼく。', pages: [
                { text: '休むのも、\n今日のやること。', sceneJa: '布団に入っていく', sceneEn: 'crawling into a fluffy white futon' },
                { text: 'ちゃんと、横になる。', sceneJa: '布団に横たわる', sceneEn: 'lying down neatly in the futon' },
                { text: 'ちゃんと、目を閉じる。', sceneJa: '目を閉じる', sceneEn: 'eyes closed peacefully, tucked in the futon' },
                { text: '本日の業務、終了。', sceneJa: 'すやすや眠る', sceneEn: 'sleeping soundly with a tiny sleep bubble' }
            ] },
            { caption: '呼吸が趣味って、平和。', pages: [
                { text: 'ほっと一息。', sceneJa: 'マグカップを持つ', sceneEn: 'holding a warm mug with both fins, steam rising' },
                { text: '二息目。', sceneJa: 'もう一口', sceneEn: 'taking another slow sip, shoulders relaxed' },
                { text: '三息目からは、\nもう趣味。', sceneJa: 'すっかりくつろぐ', sceneEn: 'completely relaxed, melting into a cushion with the mug' }
            ] }
        ] },
        { theme: '自己肯定', items: [
            { caption: 'ハードル低めが、続くコツ。', pages: [
                { text: '今日できたこと、\n数えてみる。', sceneJa: '窓辺でノートを開く', sceneEn: 'opening a small notebook by a window' },
                { text: '起きた。食べた。', sceneJa: '指折り数える', sceneEn: 'counting slowly on its small fins' },
                { text: '生きてた。', sceneJa: 'おだやかに浮く', sceneEn: 'floating calmly in soft light' },
                { text: '…けっこう\nあるやん。', sceneJa: 'ちいさくうなずく', sceneEn: 'giving a small satisfied nod' }
            ] },
            { caption: '本日も、ぼくでした。', pages: [
                { text: 'ぼくはぼくを、\nやっている。', sceneJa: '鏡の前でぼーっとする', sceneEn: 'looking blankly at itself in a small round mirror' },
                { text: '誰にも代われへん\n仕事やから。', sceneJa: '鏡と向き合う', sceneEn: 'facing the mirror quietly, calm expression' },
                { text: '今日も無事、\nぼくでした。', sceneJa: 'ぺこりとおじぎ', sceneEn: 'giving a tiny polite bow' }
            ] }
        ] },
        { theme: 'ひとり時間', items: [
            { caption: '定休日、大事。', pages: [
                { text: '誰にも会わん日。', sceneJa: '静かな部屋にいる', sceneEn: 'resting in a quiet cozy room with soft light' },
                { text: '顔が、休みの日。', sceneJa: '表情がゆるむ', sceneEn: 'face completely relaxed, eyes half closed' },
                { text: '声も、休みの日。', sceneJa: 'しんとしている', sceneEn: 'in complete peaceful silence, tiny bubbles floating' },
                { text: '心が、\n営業再開する日。', sceneJa: 'ちいさな灯りがともる', sceneEn: 'a small warm light glowing softly beside it' }
            ] },
            { caption: '湯船は、ちいさな海。', pages: [
                { text: 'お風呂で、\n今日をゆるめる。', sceneJa: 'お風呂に入る', sceneEn: 'slipping into a warm bath' },
                { text: '肩まで、沈む。', sceneJa: '肩まで浸かる', sceneEn: 'sinking into the bath up to its fins, very relaxed' },
                { text: '今日のいろいろ、\nお湯に溶けてった。', sceneJa: '泡がのぼっていく', sceneEn: 'tiny bubbles rising gently around its round body' }
            ] }
        ] },
        { theme: '考えすぎ', items: [
            { caption: '夜の会議は、だいたい延びる。', pages: [
                { text: '頭の中の会議、\nまだやってる。', sceneJa: '夜、枕に沈む', sceneEn: 'sinking into a soft pillow at night' },
                { text: '議題：さっきの\n自分のひとこと', sceneJa: 'もやもやが浮かぶ', sceneEn: 'a small fuzzy thought cloud floating above its head' },
                { text: '結論、出ず。', sceneJa: '寝返りをうつ', sceneEn: 'rolling over slowly in the futon' },
                { text: '散会。また明日。', sceneJa: '眠りに落ちる', sceneEn: 'finally asleep, the thought cloud drifting away' }
            ] },
            { caption: '実績のある作戦です。', pages: [
                { text: '考えるん、\n明日でもええか。', sceneJa: '布団で天井を見る', sceneEn: 'lying in a futon looking at the ceiling' },
                { text: '明日のぼくは、\n今日より賢い。', sceneJa: 'ちょっと期待の顔', sceneEn: 'a faint hopeful look on its tiny face' },
                { text: '根拠は、ない。', sceneJa: '真顔に戻る', sceneEn: 'back to a completely blank face' },
                { text: 'でも寝たら、だいたい\n何とかなってる。', sceneJa: 'すやすや眠る', sceneEn: 'sleeping soundly, wrapped snugly in the futon' }
            ] }
        ] },
        { theme: 'やる気が出ない日', items: [
            { caption: 'また今度、おいでや。', pages: [
                { text: 'やる気、待ってた。', sceneJa: 'ソファで待っている', sceneEn: 'sitting on a sofa, waiting patiently' },
                { text: '来んかった。', sceneJa: '窓の外を見る', sceneEn: 'looking out the window at drifting clouds' },
                { text: 'たぶん、道に\n迷ってる。', sceneJa: '玄関のほうを見る', sceneEn: 'glancing toward a small front door' },
                { text: '今日は留守に\nしとこ。', sceneJa: '毛布にくるまる', sceneEn: 'wrapping itself in a soft blanket like a cocoon' }
            ] },
            { caption: '採点、甘めでいこ。', pages: [
                { text: 'とりあえず、\n座ってみた。', sceneJa: '椅子に向かう', sceneEn: 'approaching a desk chair slowly' },
                { text: '座れた。', sceneJa: '椅子に座る', sceneEn: 'sitting on the chair, round and still' },
                { text: '今日はそれで、\n合格とする。', sceneJa: '自分にはなまる', sceneEn: 'a soft pink flower mark floating above its head' }
            ] }
        ] },
        { theme: '何もしたくない日', items: [
            { caption: '呼吸、続けてこ。', pages: [
                { text: '何もしたくない日。', sceneJa: '布団にくるまる', sceneEn: 'completely wrapped in a fluffy futon like a cocoon' },
                { text: 'なので、何もせん。', sceneJa: 'じっとしている', sceneEn: 'perfectly still, only eyes visible' },
                { text: '今日の実績：呼吸。', sceneJa: '静かに息をする', sceneEn: 'tiny gentle breath bubbles rising slowly' },
                { text: '満点。', sceneJa: '眠っている', sceneEn: 'sound asleep with a peaceful face' }
            ] },
            { caption: '無為も、案外テクニカル。', pages: [
                { text: '「なにもしない」を\nしてた。', sceneJa: 'クッションと一体化', sceneEn: 'merging with a big round cushion on a sofa' },
                { text: 'これが意外と、\n忙しい。', sceneJa: 'もぞもぞ動く', sceneEn: 'shifting position slightly to get comfier' },
                { text: 'ヒレの置き場とか、\n考えることが多い。', sceneJa: 'ヒレの位置を直す', sceneEn: 'carefully adjusting where its little fins rest' }
            ] }
        ] },
        { theme: '比べてしまう日', items: [
            { caption: '水深は、人それぞれ。', pages: [
                { text: 'よその光、\nまぶしい日。', sceneJa: '水面の光を見上げる', sceneEn: 'looking up from underwater at glittering light on the surface' },
                { text: 'ぼくも上がろうかと\n思ったけど', sceneJa: '少し浮上しかける', sceneEn: 'rising slightly toward the bright surface' },
                { text: 'ぼくはこの深さが、\n息しやすい。', sceneJa: '静かな深さに戻る', sceneEn: 'settling back into calm deeper blue water' },
                { text: 'ここで、浮いとく。', sceneJa: 'おだやかに漂う', sceneEn: 'drifting peacefully in its own quiet depth' }
            ] },
            { caption: '海は広いから、渋滞せえへん。', pages: [
                { text: '速い魚、\n見送った。', sceneJa: '魚の群れが通り過ぎる', sceneEn: 'watching a school of small quick fish swim past' },
                { text: '追いかけへん。', sceneJa: 'その場にとどまる', sceneEn: 'staying still as the fish disappear into the distance' },
                { text: 'マンボウは、\nマンボウのペース。', sceneJa: 'ゆっくり漂う', sceneEn: 'drifting slowly and contentedly at its own pace' }
            ] }
        ] },
        { theme: '明日に回したいこと', items: [
            { caption: '対話って、大事。', pages: [
                { text: '洗いものと、\n話し合いをした。', sceneJa: '台所を横目に見る', sceneEn: 'glancing sideways at a small kitchen sink' },
                { text: '「明日でええよな」', sceneJa: 'シンクの前に立つ', sceneEn: 'standing before the sink with a few cups in it' },
                { text: '「ええよ」', sceneJa: 'うなずき合う（気がする）', sceneEn: 'nodding once, as if the dishes agreed' },
                { text: '円満に、先送り。', sceneJa: '台所をあとにする', sceneEn: 'drifting away from the kitchen, satisfied' }
            ] },
            { caption: '明日のぼく、いつもありがとう。', pages: [
                { text: 'それ、明日のぼくに\nお願いした。', sceneJa: 'メモを机に置く', sceneEn: 'leaving a tiny note on the desk' },
                { text: '明日のぼくは、\n引き受けてくれる。', sceneJa: '布団に向かう', sceneEn: 'heading toward the futon, leaving the desk behind' },
                { text: 'やさしいやつ\nなんよ。', sceneJa: '感謝しながら眠る', sceneEn: 'falling asleep with a faint grateful look' }
            ] }
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

    /* 投稿1件のテキスト面（全ページ+キャプション+タグ）をまとめて検査する */
    function checkPost(post, character) {
        var parts = [post.main_text, post.caption, (post.hashtags || []).join(' ')];
        (post.pages || []).forEach(function (pg) { parts.push(pg.text); });
        return findNgWords(parts.join('\n'), character);
    }

    /* pageIndex/pageTotal を渡すと連作の一貫性指示を足す */
    function buildImagePrompt(character, sceneEn, pageIndex, pageTotal) {
        var prompt = character.imagePromptTemplate.replace('{scene}', sceneEn);
        if (pageTotal && pageTotal > 1) {
            prompt += ' This is image ' + pageIndex + ' of ' + pageTotal + ' in one carousel series: ' +
                'keep the exact same character design, colors, line style, and background tone across all images in the series.';
        }
        return prompt;
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

    /* pages（{text, scene, image_prompt}[]）から投稿レコードを組み立てる */
    function makeDraft(store, character, batchId, variant, theme, pages, caption, generator) {
        var cover = pages[0] || {};
        return {
            id: store.makeId('p'),
            created_at: store.nowIso(),
            updated_at: store.nowIso(),
            batch_id: batchId,
            variant: variant,
            theme: theme,
            main_text: cover.text || '',
            scene: cover.scene || '',
            image_prompt: cover.image_prompt || '',
            pages: pages,
            caption: caption,
            hashtags: pickHashtags(character, Math.random),
            status: 'draft',
            generator: generator,
            user_feedback: []
        };
    }

    /* ================= 内蔵モード ================= */

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

        /* フィードバックに「ゆるく」「言いすぎ」が多いときは枚数少なめの話を優先する */
        var preferShort = learning.recentComments.filter(function (c) {
            return /ゆるく|言いすぎ|いいすぎ|強い/.test(c.text || '');
        }).length >= 2;

        var fresh = CORPUS.filter(function (t) { return !recentThemes[t.theme]; });
        var sourcePool = (fresh.length >= 3 ? fresh : CORPUS).slice();

        var variants = ['A', 'B', 'C'];
        var batchId = store.makeId('b');
        var drafts = [];

        for (var v = 0; v < 3 && sourcePool.length; v++) {
            var themeEntry = sourcePool.splice(Math.floor(rng() * sourcePool.length), 1)[0];
            var items = themeEntry.items.filter(function (it) { return !recentTexts[it.pages[0].text]; });
            if (!items.length) items = themeEntry.items;
            if (preferShort) {
                items = items.slice().sort(function (a, b) { return a.pages.length - b.pages.length; });
                items = items.slice(0, Math.max(1, Math.ceil(items.length / 2)));
            }
            var item = items[Math.floor(rng() * items.length)];

            var total = item.pages.length;
            var pages = item.pages.map(function (pg, idx) {
                return {
                    text: pg.text,
                    scene: pg.sceneJa,
                    image_prompt: buildImagePrompt(character, pg.sceneEn, idx + 1, total)
                };
            });
            drafts.push(makeDraft(store, character, batchId, variants[v], themeEntry.theme, pages, item.caption, 'builtin'));
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
                    required: ['theme', 'pages', 'caption', 'hashtags'],
                    properties: {
                        theme: { type: 'string' },
                        pages: {
                            type: 'array', minItems: 3, maxItems: 5,
                            description: 'カルーセルの各ページ。1枚目=共感の入り口、中間=小さな展開、最後=力の抜けるゆるい着地',
                            items: {
                                type: 'object',
                                additionalProperties: false,
                                required: ['text', 'scene_ja', 'scene_en'],
                                properties: {
                                    text: { type: 'string', description: 'そのページの画像内テキスト。1〜2行。改行は\\n。無言のページは空文字でもよい' },
                                    scene_ja: { type: 'string', description: 'ぼぅが何をしているか（日本語）' },
                                    scene_en: { type: 'string', description: '同じシーンの英語表現。画像生成プロンプトに差し込む' }
                                }
                            }
                        },
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
        lines.push('# 投稿の形式（カルーセル）');
        lines.push('- 1投稿 = 3〜5枚の連作画像。スワイプして読む小さな物語。');
        lines.push('- 1枚目: 共感の入り口。「これ私やん」と手が止まる短い一言。');
        lines.push('- 中間: 小さな展開。オチを急がない。1枚に情報を詰めない。');
        lines.push('- 最後: 力の抜けるゆるい着地。解決しない。説教しない。');
        lines.push('- 各ページの文は1〜2行。無言のページがあってもよい。');
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
            '各案は3〜5枚のカルーセル（連作）で、案ごとに枚数を変えてもかまいません。' +
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
                var total = p.pages.length;
                var pages = p.pages.slice(0, 5).map(function (pg, pi) {
                    return {
                        text: pg.text || '',
                        scene: pg.scene_ja,
                        image_prompt: buildImagePrompt(character, pg.scene_en, pi + 1, total)
                    };
                });
                var draft = makeDraft(store, character, batchId, variants[idx], p.theme, pages, p.caption, 'api');
                if (p.hashtags && p.hashtags.length) draft.hashtags = p.hashtags.slice(0, 5);
                return draft;
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
