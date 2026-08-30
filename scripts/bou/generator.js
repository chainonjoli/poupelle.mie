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
            { caption: '覚えてない疲れも、疲れ。', pages: [
                { text: '何もしてないのに、\n疲れた。', sceneJa: 'ソファに沈んでいる', sceneEn: 'sinking deep into a soft sofa, completely still' },
                { text: 'たぶん、\n何かはしてた。', sceneJa: '天井をぼんやり見ている', sceneEn: 'lying on its back, gazing blankly at the ceiling' },
                { text: '思い出せないだけで。', sceneJa: 'ゆっくりまばたきする', sceneEn: 'blinking slowly, eyes half closed, very calm' },
                { text: '今日はもう、\n数えない。', sceneJa: 'ぺたんと伸びている', sceneEn: 'lying flat and relaxed, softly melted into the cushion' }
            ] },
            { caption: '言葉にしない分は、休ませておく。', pages: [
                { text: '疲れたって言うのも、\n疲れる。', sceneJa: '枕に顔を半分うずめている', sceneEn: 'half burying its face into a big soft pillow' },
                { text: 'だから、言わないでおく。', sceneJa: '布団に沈んでいる', sceneEn: 'sinking quietly into a fluffy futon' },
                { text: '言わなくても、\n疲れてはいる。', sceneJa: 'じっとしている', sceneEn: 'perfectly still, only the eyes visible' },
                { text: 'それで、いい。', sceneJa: '目を閉じる', sceneEn: 'eyes gently closed, peaceful face' }
            ] }
        ] },
        { theme: '仕事', items: [
            { caption: '終わってなくても、終わりにしていい時間がある。', pages: [
                { text: '今日は、ここまで。', sceneJa: 'ノートパソコンを閉じる', sceneEn: 'gently closing a laptop at a small desk' },
                { text: 'まだ途中だけど。', sceneJa: '机に残った紙を横目に見る', sceneEn: 'glancing sideways at a few papers left on the desk' },
                { text: '途中まで、やった。', sceneJa: 'のびをしている', sceneEn: 'stretching its round body slowly, relieved' },
                { text: 'つづきは、明日。', sceneJa: '机を離れていく', sceneEn: 'drifting away from the desk toward a warm lamp light' }
            ] },
            { caption: '座っていただけの日にも、重さはある。', pages: [
                { text: 'がんばった感は、ない。', sceneJa: '机の隅でぼーっとする', sceneEn: 'sitting blankly at the corner of a desk' },
                { text: 'でも、ここにはいた。', sceneJa: '椅子にちょこんといる', sceneEn: 'resting small and round on a desk chair' },
                { text: 'いるのも、\nしんどい日がある。', sceneJa: '窓のほうを見ている', sceneEn: 'looking toward a window with soft daylight' },
                { text: '今日は、それだけで。', sceneJa: 'ゆっくりうなずく', sceneEn: 'nodding slowly with tiny dot eyes' }
            ] }
        ] },
        { theme: '人間関係', items: [
            { caption: '終わった話を、ひとりで続けてしまう日。', pages: [
                { text: 'あの一言、\nまだ考えてる。', sceneJa: '夕方の窓の外を見る', sceneEn: 'gazing out of a window at soft evening light' },
                { text: '相手は、\nもう忘れてる。', sceneJa: '夜の月を見上げる', sceneEn: 'looking up at a pale round moon in the night sky' },
                { text: '考えてるのは、\nこっちだけ。', sceneJa: 'お風呂に浸かっている', sceneEn: 'soaking in a warm bath, small bubbles floating' },
                { text: '今日はもう、\nやめておく。', sceneJa: '湯気の中でとける', sceneEn: 'relaxing deeper into the bath as soft steam rises' }
            ] },
            { caption: '会いたい気持ちと、会える日は、別のこと。', pages: [
                { text: 'きらいじゃない。\n今日は会えないだけ。', sceneJa: '布団から目だけ出している', sceneEn: 'peeking only its eyes out from under a blanket' },
                { text: '気持ちの入口が、\n閉まっている。', sceneJa: '閉まった小さなドアのそば', sceneEn: 'resting beside a small closed wooden door' },
                { text: '無理に開けると、\nあとで疲れる。', sceneJa: 'ドアをじっと見ている', sceneEn: 'quietly looking at the closed door, still' },
                { text: '開く日に、また。', sceneJa: '小さくヒレを振る', sceneEn: 'giving a tiny gentle wave with a small fin' }
            ] }
        ] },
        { theme: 'SNS', items: [
            { caption: 'どこにも行ってないのに、けっこう疲れてる。', pages: [
                { text: '5分だけ、\nのつもりが。', sceneJa: 'ソファでスマホを見ている', sceneEn: 'lying on a sofa looking at a smartphone' },
                { text: '気づいたら、夜。', sceneJa: '暗い部屋でスマホの光', sceneEn: 'in a dark room, face lit softly by a smartphone glow' },
                { text: '画面の中だけ、\n遠くまで行った。', sceneJa: '少し目が回っている', sceneEn: 'slightly dizzy with tiny swirl marks above its head' },
                { text: '体は、ここにいる。', sceneJa: '同じ場所に沈んでいる', sceneEn: 'still in the exact same spot on the sofa' }
            ] },
            { caption: '見ないことにした夜も、ちゃんと過ぎていく。', pages: [
                { text: 'まぶしい投稿ばかり、\n流れてくる。', sceneJa: 'スマホをスクロールする', sceneEn: 'scrolling a smartphone with a blank stare' },
                { text: 'まぶしいときは、\n目を閉じていい。', sceneJa: '目を閉じる', sceneEn: 'closing its eyes gently, calm face' },
                { text: '見なくても、\n減るものはない。', sceneJa: 'スマホを裏返して置く', sceneEn: 'placing a smartphone face-down on a table' },
                { text: '今日は、伏せておく。', sceneJa: '裏返したスマホの横で浮く', sceneEn: 'floating peacefully beside the face-down phone' }
            ] }
        ] },
        { theme: '返信', items: [
            { caption: '思ってはいる、というところで止まる日。', pages: [
                { text: '返信しようとは、\n思ってる。', sceneJa: 'ソファでスマホを持っている', sceneEn: 'holding a smartphone on a sofa, staring at it' },
                { text: '文面も、\n半分できてる。', sceneJa: '打ちかけで止まっている', sceneEn: 'paused mid-typing, a fin hovering over the phone' },
                { text: 'あとは、送るだけ。', sceneJa: '画面の前で固まる', sceneEn: 'frozen still, looking closely at the phone screen' },
                { text: '…明日、送る。', sceneJa: 'スマホを置いて眠る', sceneEn: 'putting the phone down and curling up to sleep' }
            ] },
            { caption: '返せてないけど、忘れてはいない人へ。', pages: [
                { text: '「あとで返す」の\nあとが、まだ来ない。', sceneJa: '通知をじっと見る', sceneEn: 'looking at a phone notification with round dot eyes' },
                { text: '忘れてはいない。', sceneJa: '時計を見ている', sceneEn: 'watching a small wall clock tick quietly' },
                { text: 'ずっと、気にはしてる。', sceneJa: 'スマホを抱えている', sceneEn: 'hugging the smartphone gently against its belly' },
                { text: '気にしてる分は、\n届いてることにする。', sceneJa: 'ゆっくり目を閉じる', sceneEn: 'closing its eyes slowly, softly at ease' }
            ] }
        ] },
        { theme: '予定', items: [
            { caption: '急がなくても、だいたい間に合う。', pages: [
                { text: '急ぐ用事、なかった。', sceneJa: '駅のホームに立っている', sceneEn: 'waiting alone on a quiet train platform' },
                { text: '一本、見送ってみる。', sceneJa: '電車が通り過ぎる', sceneEn: 'watching a soft-colored train pass by gently' },
                { text: '誰も、困らなかった。', sceneJa: '風に吹かれている', sceneEn: 'fins swaying slightly in a gentle breeze, eyes closed' },
                { text: '次のに、乗る。', sceneJa: 'ホームで静かに待つ', sceneEn: 'waiting calmly on the empty platform' }
            ] },
            { caption: '何もしない予定を、ちゃんと守った日。', pages: [
                { text: '今日の予定は、なし。', sceneJa: '真っ白なカレンダーを見る', sceneEn: 'looking at a blank white calendar on the wall' },
                { text: 'なので、浮く。', sceneJa: 'ぷかぷか浮いている', sceneEn: 'floating weightlessly in calm pale blue water' },
                { text: '予定どおり、\n何もしなかった。', sceneJa: '夕方もまだ浮いている', sceneEn: 'still floating as the light turns warm and dim' },
                { text: 'これで、いい。', sceneJa: 'ちいさな星がひとつ', sceneEn: 'a single tiny star twinkling softly above' }
            ] }
        ] },
        { theme: '休息', items: [
            { caption: '何もできなかった日、じゃなくて。\n今日は、休むことをした日。', pages: [
                { text: '休むのも、\n今日のやること。', sceneJa: '布団に入っていく', sceneEn: 'crawling into a fluffy white futon' },
                { text: 'ちゃんと、横になる。', sceneJa: '布団に横たわる', sceneEn: 'lying down neatly in the futon' },
                { text: 'ちゃんと、目を閉じる。', sceneJa: '目を閉じている', sceneEn: 'eyes closed peacefully, tucked in the futon' },
                { text: '今日はもう、\nここまで。', sceneJa: 'すやすや眠る', sceneEn: 'sleeping soundly with a tiny sleep bubble' }
            ] },
            { caption: '何も進まない時間も、過ぎてはいる。', pages: [
                { text: 'ほっと一息。', sceneJa: 'マグカップを持っている', sceneEn: 'holding a warm mug with both fins, steam rising' },
                { text: '二息目も、いる。', sceneJa: 'もう一口飲む', sceneEn: 'taking another slow sip, shoulders relaxed' },
                { text: '息をしてるだけの時間。', sceneJa: 'クッションでくつろぐ', sceneEn: 'completely relaxed, resting against a soft cushion' },
                { text: 'それも、時間。', sceneJa: 'ゆっくり目を閉じる', sceneEn: 'eyes closing slowly, mug set down beside it' }
            ] }
        ] },
        { theme: '自己肯定', items: [
            { caption: '少ないけど、ゼロではない日。', pages: [
                { text: '今日できたこと、\n数えてみる。', sceneJa: '窓辺でノートを開く', sceneEn: 'opening a small notebook by a window' },
                { text: '起きた。食べた。', sceneJa: 'ヒレで数えてみる', sceneEn: 'counting slowly on its small fins' },
                { text: 'それだけ。', sceneJa: 'おだやかに浮いている', sceneEn: 'floating calmly in soft morning light' },
                { text: 'それだけ、ある。', sceneJa: 'ちいさくうなずく', sceneEn: 'giving a small quiet nod' }
            ] },
            { caption: '動かなかった日にも、消耗はある。', pages: [
                { text: '何もしてない日に、\nいちばん疲れてることもある。', sceneJa: 'ソファでじっとしている', sceneEn: 'sitting motionless on a sofa, blank face' },
                { text: '動かないぶん、\n頭が動いてる。', sceneJa: 'もやもやが浮かんでいる', sceneEn: 'a small fuzzy thought cloud floating above its head' },
                { text: 'それも、疲れる。', sceneJa: 'ぼんやりしている', sceneEn: 'staring into space, very still' },
                { text: '今日は、\n休んだことにする。', sceneJa: '布団のほうへ向かう', sceneEn: 'drifting slowly toward a soft futon' }
            ] }
        ] },
        { theme: 'ひとり時間', items: [
            { caption: 'しゃべらない日も、必要な日。', pages: [
                { text: '誰にも会わない日。', sceneJa: '静かな部屋にいる', sceneEn: 'resting in a quiet cozy room with soft light' },
                { text: '顔が、休んでる。', sceneJa: '表情がゆるむ', sceneEn: 'face completely relaxed, eyes half closed' },
                { text: '声も、休んでる。', sceneJa: 'しんとしている', sceneEn: 'in complete peaceful silence, tiny bubbles floating' },
                { text: '明日の分を、\nためている。', sceneJa: 'ちいさな灯りがともる', sceneEn: 'a small warm light glowing softly beside it' }
            ] },
            { caption: 'お湯の中でだけ、静かになれる日がある。', pages: [
                { text: 'お風呂で、\n今日をゆるめる。', sceneJa: 'お風呂に入る', sceneEn: 'slipping into a warm bath' },
                { text: '肩まで、沈む。', sceneJa: '肩まで浸かる', sceneEn: 'sinking into the bath up to its fins, very relaxed' },
                { text: '考えごとも、少し浮く。', sceneJa: '泡がのぼっていく', sceneEn: 'tiny bubbles rising gently around its round body' },
                { text: '今日は、ここで終わり。', sceneJa: '湯気の中で目を閉じる', sceneEn: 'eyes closed in the warm steam, at peace' }
            ] }
        ] },
        { theme: '考えすぎ', items: [
            { caption: '夜に考えると、だいたい長引く。', pages: [
                { text: '頭の中が、\nまだ終わらない。', sceneJa: '夜、枕に沈む', sceneEn: 'sinking into a soft pillow at night' },
                { text: '答えの出ないことばかり。', sceneJa: 'もやもやが浮かぶ', sceneEn: 'a small fuzzy thought cloud floating above its head' },
                { text: '今日は、出ない。', sceneJa: '寝返りをうつ', sceneEn: 'rolling over slowly in the futon' },
                { text: 'つづきは、明日。', sceneJa: '眠りに落ちる', sceneEn: 'finally asleep, the thought cloud drifting away' }
            ] },
            { caption: '夜に決めないほうが、うまくいく。', pages: [
                { text: '考えるのは、\n明日でもいい。', sceneJa: '布団で天井を見る', sceneEn: 'lying in a futon looking at the ceiling' },
                { text: '明日のほうが、\n少し元気。', sceneJa: 'ちょっと期待している顔', sceneEn: 'a faint hopeful look on its tiny face' },
                { text: '根拠は、ない。', sceneJa: '真顔に戻る', sceneEn: 'back to a completely blank face' },
                { text: 'でも、だいたいそう。', sceneJa: 'すやすや眠る', sceneEn: 'sleeping soundly, wrapped snugly in the futon' }
            ] }
        ] },
        { theme: 'やる気が出ない日', items: [
            { caption: '待っても来ないものは、待たない。', pages: [
                { text: 'やる気を、待っていた。', sceneJa: 'ソファで待っている', sceneEn: 'sitting on a sofa, waiting patiently' },
                { text: '来なかった。', sceneJa: '窓の外を見る', sceneEn: 'looking out the window at drifting clouds' },
                { text: '来ない日も、ある。', sceneJa: '玄関のほうを見る', sceneEn: 'glancing toward a small front door' },
                { text: '今日は、留守にする。', sceneJa: '毛布にくるまる', sceneEn: 'wrapping itself in a soft blanket like a cocoon' }
            ] },
            { caption: '一歩じゃなくて、半歩の日。', pages: [
                { text: 'とりあえず、\n座ってみた。', sceneJa: '椅子に向かう', sceneEn: 'approaching a desk chair slowly' },
                { text: '座れた。', sceneJa: '椅子にいる', sceneEn: 'resting on the chair, round and still' },
                { text: 'そのあとは、なにもない。', sceneJa: 'じっと座っている', sceneEn: 'sitting quietly, doing nothing at all' },
                { text: 'それでも、座った。', sceneJa: 'ふわりと浮く', sceneEn: 'floating up softly from the chair, calm' }
            ] }
        ] },
        { theme: '何もしたくない日', items: [
            { caption: '決めてしまうと、少し楽になる。', pages: [
                { text: '何もしたくない日。', sceneJa: '布団にくるまる', sceneEn: 'completely wrapped in a fluffy futon like a cocoon' },
                { text: 'なので、何もしない。', sceneJa: 'じっとしている', sceneEn: 'perfectly still, only eyes visible' },
                { text: 'それを、決めた。', sceneJa: '静かに息をする', sceneEn: 'tiny gentle breath bubbles rising slowly' },
                { text: '決めたなら、休める。', sceneJa: '眠っている', sceneEn: 'sound asleep with a peaceful face' }
            ] },
            { caption: 'なにもしない日にも、それなりに手間はある。', pages: [
                { text: '「なにもしない」を\nしていた。', sceneJa: 'クッションと一体化', sceneEn: 'merging with a big round cushion on a sofa' },
                { text: 'これが、意外と長い。', sceneJa: 'もぞもぞ動く', sceneEn: 'shifting position slightly to get comfier' },
                { text: 'ヒレの置き場も、\nなかなか決まらない。', sceneJa: 'ヒレの位置を直す', sceneEn: 'carefully adjusting where its little fins rest' },
                { text: 'やっと、決まった。', sceneJa: '落ち着いて沈む', sceneEn: 'finally settled deep into the cushion, content' }
            ] }
        ] },
        { theme: '比べてしまう日', items: [
            { caption: 'まぶしいところが、いい場所とはかぎらない。', pages: [
                { text: 'よその光が、\nまぶしい日。', sceneJa: '水面の光を見上げる', sceneEn: 'looking up from underwater at glittering light on the surface' },
                { text: '上がろうかと、思ったけど。', sceneJa: '少し浮上しかける', sceneEn: 'rising slightly toward the bright surface' },
                { text: 'この深さのほうが、\n息がしやすい。', sceneJa: '静かな深さに戻る', sceneEn: 'settling back into calm deeper blue water' },
                { text: 'ここに、いる。', sceneJa: 'おだやかに漂う', sceneEn: 'drifting peacefully in its own quiet depth' }
            ] },
            { caption: '同じ海にいても、速さは違う。', pages: [
                { text: '速い魚が、\n通り過ぎていく。', sceneJa: '魚の群れが通り過ぎる', sceneEn: 'watching a school of small quick fish swim past' },
                { text: '追いかけない。', sceneJa: 'その場にとどまる', sceneEn: 'staying still as the fish disappear into the distance' },
                { text: '追いつく用事も、ない。', sceneJa: 'ゆっくり漂う', sceneEn: 'drifting slowly and contentedly at its own pace' },
                { text: '海は、広い。', sceneJa: '静かな海に浮かぶ', sceneEn: 'floating alone in a wide calm pale sea' }
            ] }
        ] },
        { theme: '明日に回したいこと', items: [
            { caption: '先にやることが、今日は眠ることだっただけ。', pages: [
                { text: '洗いものが、\nまだそこにある。', sceneJa: '台所を横目に見る', sceneEn: 'glancing sideways at a small kitchen sink' },
                { text: '見なかったことにする。', sceneJa: '通り過ぎる', sceneEn: 'drifting past the kitchen, looking away' },
                { text: '明日の順番に、してある。', sceneJa: '布団のほうへ向かう', sceneEn: 'heading toward the futon, leaving the desk behind' },
                { text: '今日は、おしまい。', sceneJa: '眠りにつく', sceneEn: 'falling asleep, wrapped in the soft futon' }
            ] },
            { caption: '毎日ちょっとずつ、明日に預けている。', pages: [
                { text: 'それは、\n明日のぼぅに頼んだ。', sceneJa: 'メモを机に置く', sceneEn: 'leaving a tiny note on the desk' },
                { text: '明日のぼぅは、\n引き受けてくれる。', sceneJa: '布団に向かう', sceneEn: 'drifting toward the futon in dim warm light' },
                { text: 'いつも、そう。', sceneJa: '静かに息をする', sceneEn: 'breathing quietly, eyes almost closed' },
                { text: '今日は、おやすみ。', sceneJa: '灯りを消すところ', sceneEn: 'reaching to turn off a small warm lamp at night' }
            ] }
        ] }
    ];

    /* ---- 3案の型（A=王道共感 / B=本質 / C=保存・シェア）----
     * コーパスの各話に型を割り当てる（テーマごとに [1話目, 2話目] の順） */
    var TYPE_LABEL = { empathy: '王道共感型', essence: '本質型', share: '保存・シェア型' };
    var TYPE_BY_THEME = {
        '疲れ': ['empathy', 'share'], '仕事': ['share', 'essence'], '人間関係': ['empathy', 'essence'],
        'SNS': ['empathy', 'essence'], '返信': ['empathy', 'share'], '予定': ['essence', 'empathy'],
        '休息': ['share', 'empathy'], '自己肯定': ['empathy', 'essence'], 'ひとり時間': ['empathy', 'essence'],
        '考えすぎ': ['empathy', 'share'], 'やる気が出ない日': ['empathy', 'share'],
        '何もしたくない日': ['share', 'empathy'], '比べてしまう日': ['essence', 'share'],
        '明日に回したいこと': ['empathy', 'share']
    };
    /* 各話が使っている「投稿構造」（リサーチの構造ライブラリの8型に対応） */
    var STRUCTURE_BY_THEME = {
        '疲れ': ['王道共感型', '保存したい一言型'], '仕事': ['保存したい一言型', '本音代弁型'],
        '人間関係': ['王道共感型', '人間関係の本質型'], 'SNS': ['日常あるある型', '意外な視点型'],
        '返信': ['本音代弁型', '誰かに送りたい型'], '予定': ['意外な視点型', '日常あるある型'],
        '休息': ['保存したい一言型', '疲れた日の癒し型'], '自己肯定': ['王道共感型', '意外な視点型'],
        'ひとり時間': ['王道共感型', '疲れた日の癒し型'], '考えすぎ': ['日常あるある型', '誰かに送りたい型'],
        'やる気が出ない日': ['本音代弁型', '保存したい一言型'], '何もしたくない日': ['保存したい一言型', '日常あるある型'],
        '比べてしまう日': ['意外な視点型', '誰かに送りたい型'], '明日に回したいこと': ['日常あるある型', '保存したい一言型']
    };
    CORPUS.forEach(function (t) {
        t.items.forEach(function (it, i) {
            it.type = (TYPE_BY_THEME[t.theme] || ['empathy', 'empathy'])[i] || 'empathy';
            it.structure = (STRUCTURE_BY_THEME[t.theme] || [])[i] || '王道共感型';
        });
    });

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

    /* pageIndex/pageTotal を渡すと連作の一貫性指示を足す。
     * 1投稿の中では顔・体型・目・口・ヒレ・色・線の太さ・水彩の質感・背景トーンを固定し、
     * 変えるのはシーンだけ、という指定を毎回必ず入れる。 */
    function buildImagePrompt(character, sceneEn, pageIndex, pageTotal, visualNotes) {
        var prompt = character.imagePromptTemplate.replace('{scene}', sceneEn);
        /* 「色が違う」「形が違う」等の指摘が出ていたら、その点を重ねて念押しする */
        var notes = visualNotes || [];
        var joined = notes.map(function (n) { return n.text || n; }).join('／');
        if (/色|カラー|背景/.test(joined)) {
            prompt += ' Color reminder: body must be muted blue-gray #9DAEB8, belly milk-white #F2F2EC, ' +
                'outlines deep blue-gray, background pale blue-white watercolor (#EAF4F8 / #DCEBF2 / #F7FBFC). ' +
                'No vivid or deep marine blue.';
        }
        if (/形|かたち|崩れ|体型|人間っぽ|人型/.test(joined)) {
            prompt += ' Shape reminder: keep the round disc-shaped sunfish body, tiny dot eyes, ' +
                'tiny line mouth and small round fins exactly as specified. No human body parts.';
        }
        if (pageTotal && pageTotal > 1) {
            prompt += ' This is image ' + pageIndex + ' of ' + pageTotal + ' in the same carousel series. ' +
                'Keep the exact same Bou character design, face, eyes, mouth, fins, colors, proportions, ' +
                'line style, line weight, watercolor texture and background tone across all images. ' +
                'Only the scene changes between images.';
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
    function makeDraft(store, character, batchId, variant, theme, pages, caption, generator, proposalType, structureUsed) {
        var cover = pages[0] || {};
        return {
            id: store.makeId('p'),
            created_at: store.nowIso(),
            updated_at: store.nowIso(),
            batch_id: batchId,
            variant: variant,
            theme: theme,
            proposal_type: TYPE_LABEL[proposalType] || proposalType || '',
            structure_used: structureUsed || '',
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

    /* ================= 投稿候補の内部評価（10項目・10点満点） =================
     * 説教・ポジティブ押しつけ・長すぎ・元気すぎ・既視感などを検出し、
     * 基準を下回る案は自動で再生成の対象にする。 */

    function bigrams(s) {
        var t = (s || '').replace(/\s/g, '');
        var set = {};
        for (var i = 0; i < t.length - 1; i++) set[t.slice(i, i + 2)] = true;
        return set;
    }
    function similarity(a, b) {
        var A = bigrams(a), B = bigrams(b), inter = 0, union = 0, k;
        for (k in A) { union++; if (B[k]) inter++; }
        for (k in B) { if (!A[k]) union++; }
        return union ? inter / union : 0;
    }

    /* 生成前セルフチェック。
     * 「反応されそうか」より先に「ぼぅらしいか」を見る。
     * 低評価の案はユーザーに出す前に選び直す／作り直す。 */

    /* 名言をつくりにいっている文章の特徴 */
    var CLICHE_PATTERNS = [
        /とは、[^。]{0,12}(だ|である)/, /こそ、?[^。]{0,10}(だ|なのだ)/,
        /人生(は|って)/, /大切な(こと|の)は/, /大事な(こと|の)は/,
        /ということ。/, /なのだ。/, /ではないだろうか/,
        /[^。]{2,10}。それが、?[^。]{2,12}。/, /本当の[^。]{1,8}は/,
        /大切なこと/, /大事なこと/, /人生は/, /べきだ/
    ];
    /* 会社員・ビジネス寄りの言い回し（ngWordsより弱い検出） */
    var BUSINESS_SOFT = ['モード', 'リセット', 'チャージ', 'スイッチ', '稼働', 'ノルマ',
        'ミッション', '目標', '達成', '完了', '進捗', '対応', '処理'];
    /* 静かに終わっている最終ページの言い方 */
    var QUIET_END = /(ここまで|おしまい|明日|おやすみ|眠|それで、?いい|いい。|終わり|ある。|そう。)/;
    /* 教訓・結論で締めている言い方 */
    var LESSON_END = /(だから|つまり|大事|大切|べき|しよう|しましょう|はず|きっと[^。]{0,6}なる)/;

    function evaluatePost(post, store, character) {
        var usage = store.getUsageStats();
        var strategy = store.getStrategy();
        var pages = post.pages && post.pages.length ? post.pages : [{ text: post.main_text, scene: post.scene }];
        var texts = pages.map(function (pg) { return pg.text || ''; });
        var all = texts.join('\n') + '\n' + (post.caption || '');
        var cover = (texts[0] || '').replace(/\n/g, '');
        var lastText = (texts[texts.length - 1] || '').replace(/\n/g, '');
        var flags = [];
        function clamp(n) { return Math.max(0, Math.min(10, Math.round(n))); }

        /* --- ぼぅらしさ（NG表現・元気すぎ） --- */
        var bou = 10;
        var ng = findNgWords(all, character);
        if (ng.length) { bou -= 4 * ng.length; flags.push('使わない約束の表現: ' + ng.join('、')); }
        var genki = (all.match(/[！!]|✨|最高|やった[ー〜]|ワクワク|元気出/g) || []).length;
        if (genki) { bou -= 3 * genki; flags.push('ぼぅが元気すぎる'); }

        /* --- ぼぅの言葉づかい（一人称・関西弁の出すぎ） --- */
        var wording = 10;
        var soft = (character.softAvoidWords || []).filter(function (w) { return all.indexOf(w) !== -1; });
        if (soft.length >= 2) { wording -= 3 * (soft.length - 1); flags.push('関西弁が強すぎる: ' + soft.join('、')); }
        else if (soft.length === 1) { wording -= 1; }
        if (/ぼく|わたし|僕|私/.test(all)) { wording -= 5; flags.push('一人称（ぼく・わたし）を使っている'); }

        /* --- 会社員・ビジネス用語に寄っていないか --- */
        var notBusiness = 10;
        var biz = BUSINESS_SOFT.filter(function (w) { return all.indexOf(w) !== -1; });
        if (biz.length) { notBusiness -= 4 * biz.length; flags.push('会社員っぽい言葉: ' + biz.join('、')); }
        if (ng.some(function (w) { return /業務|実績|タスク|案件|生産性|効率|皆勤|出席点|営業|定休/.test(w); })) {
            notBusiness -= 6;
        }

        /* --- 名言をつくろうとしていないか --- */
        var notCliche = 10;
        var cliche = CLICHE_PATTERNS.filter(function (re) { return re.test(all); });
        if (cliche.length) { notCliche -= 4 * cliche.length; flags.push('名言をつくりにいっている'); }

        /* --- 言いすぎていないか（説教・自己啓発・長すぎ） --- */
        var restraint = 10;
        if (/しましょう|すべき|しなさい|した方がいい|しよう。/.test(all)) { restraint -= 5; flags.push('説教っぽい表現'); }
        if (/前向きに|プラスに|自分次第|変わろう|行動しよう/.test(all)) { restraint -= 4; flags.push('自己啓発・ポジティブの押しつけ'); }
        var longPages = texts.filter(function (t) { return t.replace(/\n/g, '').length > 28; }).length;
        if (longPages) { restraint -= 2 * longPages; flags.push('1ページの文が長すぎる'); }
        var over2Lines = texts.filter(function (t) { return t.split('\n').length > 2; }).length;
        if (over2Lines) { restraint -= 2 * over2Lines; flags.push('1ページが3行以上になっている'); }

        /* --- 最後に余白があるか（結論で締めていないか） --- */
        var ending = 10;
        if (LESSON_END.test(lastText)) { ending -= 6; flags.push('最後が教訓・結論になっている'); }
        if (!QUIET_END.test(lastText)) { ending -= 2; }
        if (lastText.length > 20) { ending -= 2; flags.push('最後のページが長い'); }

        /* --- キャラクターが主役として残っているか --- */
        var presence = 10;
        var noScene = pages.filter(function (pg) { return !pg.scene; }).length;
        if (noScene) { presence -= 3 * noScene; flags.push('シーンのないページがある（ぼぅが不在）'); }
        var scenes = pages.map(function (pg) { return pg.scene || ''; }).join('／');
        if (/手で|指で|足で|歩く|走る|立ち上が|腕を/.test(scenes)) {
            presence -= 4; flags.push('人間の動作になっている（ぼぅはマンボウ）');
        }

        /* --- 新鮮さ・差別化（過去投稿や参考のなぞりを避ける） --- */
        var recent = store.getPosts().slice(0, 30).filter(function (p) { return p.id !== post.id; });
        var maxSim = 0;
        recent.forEach(function (p) { maxSim = Math.max(maxSim, similarity(post.main_text, p.main_text)); });
        var fresh = clamp(10 - maxSim * 12);
        if (fresh <= 3) flags.push('過去の投稿と似すぎている');
        var diff = usage.recentThemes.indexOf(post.theme) === -1 ? 9 : 4;
        if (diff <= 4) flags.push('同じテーマが続いている');
        var sceneWord = ((pages[0] || {}).scene || '').match(/布団|ソファ|スマホ|お風呂|デスク|机|窓|海|水面|電車|マグ|枕/);
        var sceneOveruse = sceneWord && usage.overusedScenes.some(function (s) { return s.key === sceneWord[0]; });
        if (sceneOveruse) { diff -= 2; flags.push('同じ小物・構図が続いている（' + sceneWord[0] + '）'); }

        /* --- 共感・保存・世界観・また見たいか --- */
        var empathy = clamp(6 + (cover.length <= 20 ? 2 : 0) + (/た。$|ない。$|てる。$|だけ。$/.test(cover) ? 1 : 0) + (ng.length ? -3 : 0));
        var totalChars = all.replace(/\s/g, '').length;
        var save = clamp(7 + (totalChars <= 100 ? 2 : totalChars <= 150 ? 0 : -2) + (post.proposal_type === TYPE_LABEL.share ? 1 : 0));
        var pageOk = pages.length >= 3 && pages.length <= 5;
        var world = clamp(8 - (ng.length ? 4 : 0) - (genki ? 2 : 0) + (pageOk ? 1 : -3) + (pages.length === 4 ? 1 : 0));
        /* 「またぼぅを見たい」= 静かに終わり・キャラがいて・言いすぎていない */
        var again = clamp((clamp(ending) + clamp(presence) + clamp(restraint)) / 3 +
            ((strategy.growThemes || '').indexOf(post.theme) !== -1 ? 1 : 0));

        var scores = {
            'ぼぅらしさ': clamp(bou),
            'ぼぅの言葉づかい': clamp(wording),
            '名言っぽくないか': clamp(notCliche),
            '会社員言葉でないか': clamp(notBusiness),
            '言いすぎていないか': clamp(restraint),
            '最後の余白': clamp(ending),
            'キャラクターが主役': clamp(presence),
            'またぼぅを見たいか': again,
            '共感度': empathy,
            '新鮮さ': fresh,
            '過去投稿との差別化': clamp(diff),
            '世界観の一貫性': world
        };
        var sum = 0, n = 0;
        for (var k in scores) { sum += scores[k]; n++; }
        var avg = Math.round((sum / n) * 10) / 10;
        /* ぼぅらしさ側の項目は一つでも落ちたら不合格にする */
        var pass = ng.length === 0 &&
            scores['ぼぅらしさ'] >= 7 && scores['ぼぅの言葉づかい'] >= 7 &&
            scores['名言っぽくないか'] >= 7 && scores['会社員言葉でないか'] >= 7 &&
            scores['言いすぎていないか'] >= 7 && scores['最後の余白'] >= 6 &&
            scores['キャラクターが主役'] >= 7 && scores['新鮮さ'] >= 4 && avg >= 6.5;
        return { scores: scores, average: avg, flags: flags, pass: pass };
    }
    /* ================= 内蔵モード =================
     * A案=王道共感型 / B案=本質型 / C案=保存・シェア型 をそれぞれの型のコーパスから選ぶ。
     * 直近のテーマ・文章・使いすぎシーンを避け、評価が低い案は選び直す。 */

    function itemToDraft(store, character, batchId, variant, theme, item) {
        var total = item.pages.length;
        var visualNotes = store.getVisualFeedback ? store.getVisualFeedback() : [];
        var pages = item.pages.map(function (pg, idx) {
            return {
                text: pg.text,
                scene: pg.sceneJa,
                image_prompt: buildImagePrompt(character, pg.sceneEn, idx + 1, total, visualNotes)
            };
        });
        return makeDraft(store, character, batchId, variant, theme, pages, item.caption, 'builtin', item.type, item.structure);
    }

    function generateBuiltin(character, store) {
        var rng = Math.random;
        var learning = store.getLearningContext();
        var usage = store.getUsageStats();
        var posts = store.getPosts();

        var recentTexts = {};
        for (var i = 0; i < Math.min(posts.length, 12); i++) recentTexts[posts[i].main_text] = true;

        /* フィードバックに「ゆるく」「言いすぎ」が多いときは枚数少なめの話を優先する */
        var preferShort = learning.recentComments.filter(function (c) {
            return /ゆるく|言いすぎ|いいすぎ|強い/.test(c.text || '');
        }).length >= 2;

        /* 反応されやすかった構造を優先し、直近で使った構造・テーマ・文章を避ける */
        var structurePref = store.getStructurePreference();

        /* 型ごとの候補リスト（{theme, item}） */
        function candidatesOf(type, usedThemes) {
            var list = [];
            CORPUS.forEach(function (t) {
                t.items.forEach(function (it) {
                    if (it.type !== type) return;
                    if (usedThemes.indexOf(t.theme) !== -1) return;
                    var penalty = (recentTexts[it.pages[0].text] ? 2 : 0) +
                        (usage.recentThemes.indexOf(t.theme) !== -1 ? 1 : 0) +
                        (usage.recentStructures.indexOf(it.structure) !== -1 ? 1 : 0) -
                        (structurePref[it.structure] || 0); /* 採用実績のある構造を優先 */
                    list.push({ theme: t.theme, item: it, penalty: penalty });
                });
            });
            list.sort(function (a, b) { return (a.penalty - b.penalty) || (rng() - 0.5); });
            if (preferShort) list.sort(function (a, b) { return (a.penalty - b.penalty) || (a.item.pages.length - b.item.pages.length); });
            return list;
        }

        var plan = [
            { variant: 'A', type: 'empathy' },
            { variant: 'B', type: 'essence' },
            { variant: 'C', type: 'share' }
        ];
        var batchId = store.makeId('b');
        var drafts = [];
        var usedThemes = [];

        plan.forEach(function (p) {
            var cands = candidatesOf(p.type, usedThemes);
            if (!cands.length) cands = candidatesOf(p.type, []);
            /* 評価が通る候補を上から探す（最大4候補）。通らなければ最高評価を採用 */
            var best = null, bestEval = null;
            for (var c = 0; c < Math.min(cands.length, 4); c++) {
                var draft = itemToDraft(store, character, batchId, p.variant, cands[c].theme, cands[c].item);
                var ev = evaluatePost(draft, store, character);
                if (!best || ev.average > bestEval.average) { best = draft; bestEval = ev; best._cand = cands[c]; }
                if (ev.pass) { best = draft; bestEval = ev; best._cand = cands[c]; break; }
            }
            if (best) {
                usedThemes.push(best._cand.theme);
                delete best._cand;
                best.evaluation = bestEval;
                drafts.push(best);
            }
        });
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
                    required: ['theme', 'structure', 'pages', 'caption', 'hashtags'],
                    properties: {
                        theme: { type: 'string' },
                        structure: { type: 'string', description: '今回使った投稿構造。次のいずれか: 王道共感型 / 本音代弁型 / 意外な視点型 / 保存したい一言型 / 誰かに送りたい型 / 疲れた日の癒し型 / 人間関係の本質型 / 日常あるある型' },
                        pages: {
                            type: 'array', minItems: 3, maxItems: 5,
                            description: 'カルーセルの各ページ。3〜5枚だが、もっとも自然な4枚を優先する。1枚目=小さな価値観の転換、2枚目=小さな行動、3枚目=もう一段だけ深める、最後=静かな終了。枚数を埋めるために文章を増やさない',
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
                        caption: { type: 'string', description: 'Instagramキャプション。画像の内容を説明し直さず、カルーセルで言えなかった感情を少しだけ補う。最後は静かに終える。長文にしない' },
                        hashtags: { type: 'array', maxItems: 5, items: { type: 'string' } }
                    }
                }
            }
        }
    };

    function buildSystemPrompt(character, learning, store) {
        var research = store.getResearch();
        var strategy = store.getStrategy();
        var usage = store.getUsageStats();
        var phase = (research.phases || []).filter(function (p) { return p.id === strategy.phase; })[0];

        var lines = [];
        lines.push('あなたはオリジナルキャラクター「' + character.name + '」（' + character.motif + '）のInstagram投稿を作る専属ライターです。');
        lines.push('');
        lines.push('# キャラクター');
        lines.push('コンセプト: ' + character.concept);
        lines.push('役割: ' + character.role);
        lines.push('性格: ' + character.personality.join('、'));
        lines.push('');
        lines.push('# 投稿の形式（カルーセル）');
        ((character.postRules && character.postRules.carousel) || []).forEach(function (r) { lines.push('- ' + r); });
        lines.push('');
        lines.push('# ぼぅらしい投稿の成功基準例（この構造を別テーマに応用する。文章はそのまま使わない）');
        var baselines = (research.structures || []).filter(function (s) { return s.isBaseline; });
        if (baselines.length) {
            baselines.forEach(function (b) {
                lines.push('テーマ: ' + b.theme);
                lines.push('構成: ' + b.carousel);
                lines.push('文章量: ' + b.textAmount);
                lines.push('共感の作り方: ' + b.empathy);
                lines.push('キャラの役割: ' + b.charRole);
                lines.push('抽出する構造: ' + b.extraction);
                lines.push(b.bouConversion);
            });
        } else {
            lines.push('テーマ: 休むことへの罪悪感を少し軽くする');
            lines.push('1枚目「休むのも、今日のやること。」… 共感フック。読む人の価値観をほんの少しだけ変える。');
            lines.push('2枚目「ちゃんと、横になる。」… 大きな解決策ではなく、小さな行動に落とす。');
            lines.push('3枚目「ちゃんと、目を閉じる。」… 同じ温度で、もう一段だけ深める。');
            lines.push('4枚目「今日はもう、ここまで。」… 解決・教訓ではなく、静かに終える。');
            lines.push('抽出する構造:「小さな価値観の転換 → 小さな行動 → もう一段だけ深める → 静かな終了」');
        }
        lines.push('');
        lines.push('# 3案の役割（この順で1案ずつ作る）');
        lines.push('- A案（王道共感型）: 最も多くの人が「これ私」と感じる内容。');
        lines.push('- B案（本質型）: 少し核心をつく。静かだけど、あとからじわっと残る内容。');
        lines.push('- C案（保存・シェア型）: 短く、誰かに送りたくなる・保存してお守りにしたくなる言葉。');
        lines.push('3案とも「ぼぅらしさ」（急がない・解決しない・励まさない）を最優先する。');
        lines.push('');
        lines.push('# 話し方のルール');
        for (var i = 0; i < character.speech.rules.length; i++) lines.push('- ' + character.speech.rules[i]);
        lines.push('口ぐせの例: ' + character.speech.examples.join(' / '));
        lines.push('');
        lines.push('# 絶対に使わない表現');
        lines.push(character.ngWords.join('、'));
        lines.push('説教・ポジティブの押しつけ・自己啓発表現・感動の押し売りも禁止。');
        ((character.speech && character.speech.avoid) || []).forEach(function (a) { lines.push('- ' + a); });
        lines.push('ぼぅは関西弁キャラではない。自然な日本語を基本にし、やわらかい口語が時々混じる程度にする。');
        lines.push('「役に立つ情報」より「これ私やん」という共感を優先する。1投稿につき1テーマ。');
        lines.push('');
        lines.push('# キャプションの作り方');
        ((character.postRules && character.postRules.caption) || []).forEach(function (r) { lines.push('- ' + r); });
        lines.push('');
        lines.push('# 投稿テーマの候補');
        lines.push(character.themes.join('、'));

        lines.push('');
        lines.push('# 投稿構造ライブラリ（最重要の参考情報。表現のコピーは禁止、構造だけ使う）');
        lines.push('毎回ランダムに書くのではなく、案ごとに次の順で頭の中を通してから書くこと:');
        lines.push('  ① 参考構造（どう止めて、どう展開して、どう終わるか）');
        lines.push('  ② なぜそれが刺さるのか');
        lines.push('  ③ ぼぅならどう言い換えるか（励まさない・説教しない・急がない形に変換）');
        lines.push('参考アカウントの文章・キャラクター造形・配色・レイアウトは絶対にコピーしない。');
        lines.push('使った構造名を structure フィールドに記録すること。');
        lines.push('ぼぅらしさと矛盾する場合は必ずぼぅらしさを優先する。');
        (research.structures || []).forEach(function (s) {
            if (s.isBaseline) return;
            lines.push('');
            lines.push('## ' + s.type);
            lines.push('フック: ' + s.hook);
            lines.push('カルーセル: ' + s.carousel);
            lines.push('共感の作り方: ' + s.empathy);
            lines.push('読後感: ' + s.afterFeel + '／キャラの役割: ' + s.charRole + '／シーン例: ' + s.scene);
            lines.push('なぜ刺さるか: ' + s.extraction);
            lines.push(s.bouConversion);
        });

        var structPref = store.getStructurePreference();
        var liked = Object.keys(structPref).filter(function (k) { return structPref[k] > 0; });
        var disliked = Object.keys(structPref).filter(function (k) { return structPref[k] < 0; });
        if (liked.length) lines.push('\n過去に採用されやすかった構造（優先する）: ' + liked.join('、'));
        if (disliked.length) lines.push('過去に不採用が多い構造（頻度を落とす）: ' + disliked.join('、'));
        if (usage.recentStructures && usage.recentStructures.length) {
            lines.push('直近で使った構造（連続を避ける）: ' + usage.recentStructures.join('→'));
        }

        lines.push('');
        lines.push('# 一般的な傾向の観察メモ（未確認の推定を含む・強い根拠にしない）');
        (research.patterns.growing || []).slice(0, 8).forEach(function (g) { lines.push('- ' + g); });
        lines.push('避ける構造: ' + (research.bouAvoid || []).join('／'));

        lines.push('');
        lines.push('# 現在の投稿戦略');
        if (phase) lines.push('Phase ' + phase.id + '（' + phase.range + 'フォロワー）: ' + phase.goal);
        if (strategy.growThemes) lines.push('伸ばしたいテーマ: ' + strategy.growThemes);
        if (strategy.holdThemes) lines.push('控えるテーマ: ' + strategy.holdThemes);
        if (strategy.weeklyPolicy) lines.push('今週の方針: ' + strategy.weeklyPolicy);

        if (usage.overusedThemes.length || usage.overusedScenes.length || usage.overusedEndings.length) {
            lines.push('');
            lines.push('# 最近使いすぎているもの（今回は避けるか、頻度を落とす）');
            if (usage.overusedThemes.length) lines.push('テーマ: ' + usage.overusedThemes.map(function (t) { return t.key + '（' + t.count + '回）'; }).join('、'));
            if (usage.overusedScenes.length) lines.push('シーン・小物: ' + usage.overusedScenes.map(function (s) { return s.key + '（' + s.count + '回）'; }).join('、'));
            if (usage.overusedEndings.length) lines.push('語尾: ' + usage.overusedEndings.map(function (e) { return '「' + e.key + '」（' + e.count + '回）'; }).join('、'));
        }
        if (usage.recentThemes.length) {
            lines.push('直近のテーマ（連続を避ける）: ' + usage.recentThemes.join('→'));
        }

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
        lines.push('');
        lines.push('# 出す前の自己検査（すべて満たしてから出力する）');
        lines.push('- ぼぅらしいか／言いすぎていないか／名言をつくろうとしていないか');
        lines.push('- 会社員・ビジネス用語に寄っていないか／説教になっていないか');
        lines.push('- 過去投稿と似すぎていないか／参考アカウントの文章をなぞっていないか');
        lines.push('- 最後に余白があるか／キャラクターが主役として残っているか');
        lines.push('- 読んだ人が「またぼぅを見たい」と思えるか');
        return lines.join('\n');
    }

    function callApi(character, store, apiKey, extraNote) {
        var learning = store.getLearningContext();
        var userMsg = '今日のぼぅ投稿の案を3つ作ってください。' +
            '1つ目=A案（王道共感型）、2つ目=B案（本質型）、3つ目=C案（保存・シェア型）。' +
            '各案は3〜5枚のカルーセル（連作）で、案ごとに枚数を変えてもかまいません。' +
            '3案はテーマ・文章・シーンを少しずつ変えること。' +
            'ハッシュタグは最大5個で、次の候補から選ぶか近い雰囲気で: ' + character.hashtagPool.join(' ') +
            (extraNote ? '\n\n前回の案は次の理由で基準を満たしませんでした。修正して作り直してください:\n' + extraNote : '');

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
                system: buildSystemPrompt(character, learning, store),
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
            var types = ['empathy', 'essence', 'share'];
            var batchId = store.makeId('b');
            return parsed.proposals.slice(0, 3).map(function (p, idx) {
                var total = p.pages.length;
                var visualNotes = store.getVisualFeedback ? store.getVisualFeedback() : [];
                var pages = p.pages.slice(0, 5).map(function (pg, pi) {
                    return {
                        text: pg.text || '',
                        scene: pg.scene_ja,
                        image_prompt: buildImagePrompt(character, pg.scene_en, pi + 1, total, visualNotes)
                    };
                });
                var structTypes = store.getResearch().structureTypes || [];
                var structUsed = (structTypes.indexOf(p.structure) !== -1) ? p.structure : (p.structure || '');
                var draft = makeDraft(store, character, batchId, variants[idx], p.theme, pages, p.caption, 'api', types[idx], structUsed);
                if (p.hashtags && p.hashtags.length) draft.hashtags = p.hashtags.slice(0, 5);
                return draft;
            });
        });
    }

    /* 評価が低い案があれば、理由を伝えて1回だけ作り直す */
    function generateApi(character, store, apiKey) {
        function evaluated(drafts) {
            drafts.forEach(function (d) { d.evaluation = evaluatePost(d, store, character); });
            return drafts;
        }
        return callApi(character, store, apiKey).then(function (drafts) {
            evaluated(drafts);
            var failed = drafts.filter(function (d) { return !d.evaluation.pass; });
            if (!failed.length) return drafts;
            var note = failed.map(function (d) {
                return d.variant + '案「' + (d.main_text || '').replace(/\n/g, '／') + '」: ' + (d.evaluation.flags.join('、') || '評価基準を下回った');
            }).join('\n');
            return callApi(character, store, apiKey, note).then(function (retry) {
                evaluated(retry);
                /* 再生成でも通らない案は、初回と再生成の良い方を残す */
                return retry.map(function (d, i) {
                    var prev = drafts[i];
                    return (d.evaluation.pass || !prev || d.evaluation.average >= prev.evaluation.average) ? d : prev;
                });
            });
        });
    }

    /* ================= 画像生成アダプタ（第二段階の差し込み口） ================= */

    var imageAdapter = null;

    var BouGenerator = {
        CORPUS: CORPUS,
        TYPE_LABEL: TYPE_LABEL,
        findNgWords: findNgWords,
        checkPost: checkPost,
        buildImagePrompt: buildImagePrompt,
        evaluatePost: evaluatePost,
        buildSystemPrompt: buildSystemPrompt,

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
