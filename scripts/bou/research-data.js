/* ぼぅ投稿スタジオ リサーチ初期データ
 *
 * Instagram上の人気キャラクター/共感系/癒し系アカウントの「構造」を分析するためのシード。
 *
 * データの出所について（重要）:
 * - verified   … 外部情報源（Instagramプロフィール・分析サイト等）でアカウントの実在と
 *                フォロワー数を確認済み。source_url / source_name / checked_at に出所を記録。
 * - estimated  … 一般知識に基づく観察メモ。数値は未確認のため followers は「未確認」とし、
 *                推定で補完しない。参考レンジは followers_est に分離して保存。
 * - manual     … 管理画面から手動で入力されたデータ。
 * - placeholder… ジャンル枠だけ用意した要調査枠。
 * - どの区分でも「傾向」欄（見せ方・保存されやすさ等）は定性的な観察メモであり実測ではない。
 * - verified=false のデータは投稿生成ロジックの根拠として強く扱わない
 *   （生成プロンプトには特定アカウントのデータは渡さず、一般的な構造分析のみ渡す）。
 * - この環境からInstagramを直接閲覧することはできないため、確認は検索結果に表示される
 *   プロフィール情報等の二次情報による。数値は確認時点のもの。 */
(function () {
    'use strict';

    var CHECKED = '2026-08-29';
    var SRC_IG = 'Instagramプロフィール（Web検索経由で確認）';

    var SEED = {
        version: 2,
        updated_at: '2026-08-29',
        note: 'このページは数字を集める場所ではなく、「ぼぅの投稿を強くするための参考構造」を蓄積する場所です。生成の根拠になるのは下の投稿構造ライブラリで、フォロワー数は参考値（生成には使いません）。「確認済み」はアカウント実在とフォロワー数を外部情報源で確認したもの（' + CHECKED + '時点）。傾向欄はすべて手動の観察メモです。',

        genres: [
            'キャラクターIP', 'ゆるキャラ（作家系）', '共感系イラスト', '癒し系イラスト',
            '日常あるある', 'メンタル・疲れ共感', '絵本風', 'AI活用系（要調査）',
            '短文×キャラ', 'カルーセル共感', 'リール型キャラ', '言葉・詩系'
        ],

        /* ---- 参考アカウント ----
         * followers: verifiedのみ数値（確認時点）。それ以外は「未確認」。
         * followers_est: 未確認アカウントの参考レンジ（推定であることを明示して分離保存） */
        accounts: [
            { name: 'ちいかわ（@ngnchiikawa）', genre: 'キャラクターIP', followers: '77.8万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/ngnchiikawa/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画マンガ中心・カルーセル多', freq: 'ほぼ毎日', text: '少（セリフのみ）', show: '小さいキャラを画面中央・余白広め', bg: 'ほぼ白背景・必要な小物だけ', themes: '日常・労働・理不尽・ごほうび', emotions: '健気・切なさ・かわいさ', save: '「わかる」が凝縮した1コマ', share: 'セリフが自分の代弁になる回', comment: 'キャラの安否を心配するコメント', follow: '続きが気になる連載性', world: '線と色数を固定・世界のルールが一貫', clarity: '1コマ目で状況が絵だけで伝わる', series: '長期連載＋定番シチュの反復' },
            { name: 'おぱんちゅうさぎ（@opanchu.usagi）', genre: 'ゆるキャラ（作家系）', followers: '45.9万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/opanchu.usagi/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画・カルーセル', freq: '週数回', text: '少〜中', show: '全身を大きく・表情は健気', bg: '生活感のある背景を簡略に', themes: '報われない日常・けなげな空回り', emotions: '不憫・愛おしさ', save: '「私すぎる」不憫あるある', share: '友達に「これあなた」と送る用途', comment: '「泣いた」「守りたい」系', follow: '毎回ちゃんと可哀想という信頼', world: 'ピンク×太線で瞬時に識別', clarity: 'タイトル的1行＋オチが明快', series: '同じ構造（頑張る→報われない）の反復' },
            { name: 'んぽちゃむ（可哀想に！）', genre: 'ゆるキャラ（作家系）', followers: '未確認', followers_est: '本体アカウント未確認（グッズ案内@npochamu_goodsは5.5万を確認）', data_type: 'estimated', verified: false, source_url: '', source_name: '', checked_at: null, formats: '静止画', freq: '週数回', text: '極少', show: 'ゆるい輪郭・脱力ポーズ', bg: 'ほぼ無地', themes: '脱力・無気力・ゆるい発言', emotions: 'ゆるさ・気の抜け', save: '脱力の一言がお守りになる', share: '気の抜けた顔だけで送れる', comment: '「今日の私」系', follow: '見るだけで力が抜ける安心感', world: '線の弱さ自体がキャラ', clarity: '一言＋顔で完結', series: '口ぐせの定番化' },
            { name: 'るるてあ／コウペンちゃん（@ruru_tea_）', genre: '癒し系イラスト', followers: '6.7万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/ruru_tea_/', source_name: SRC_IG + '（本人はX中心と明記）', checked_at: CHECKED, formats: '静止画中心', freq: '週数回（IG。Xが主軸）', text: '少（肯定の一言）', show: 'キャラ大きめ・正面・目線をくれる', bg: '白背景＋小さな装飾', themes: '肯定・ねぎらい・日常の小さな達成', emotions: '安心・自己肯定', save: '「朝起きてえらい！」等のお守り化', share: '相手をねぎらう代わりに送る', comment: '「救われた」報告', follow: '毎日ねぎらってくれる存在になる', world: '淡い色とやわらかい線で統一', clarity: '一言がそのまま主旨', series: '曜日・季節の定番あいさつ' },
            { name: 'ぐでたま（@gudetama）', genre: 'キャラクターIP', followers: '82.6万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/gudetama/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画・リール', freq: '週数回', text: '少', show: 'だらけたポーズが主役', bg: 'シンプル', themes: 'やる気のなさ・だるさの肯定', emotions: '脱力・共感', save: '「今日の気分」として保存', share: 'だるい日の意思表示に送る', comment: '「今日の私」', follow: '「がんばらない」の元祖的安心感', world: '黄色×脱力の一貫性', clarity: 'ポーズだけで感情が伝わる', series: '定番ポーズ・口ぐせの反復' },
            { name: 'シナモロール（@47mon_sanrio_official）', genre: 'キャラクターIP', followers: '10.7万（海外公式@officialcinnamorollは20.2万）', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/47mon_sanrio_official/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画・リール', freq: 'ほぼ毎日', text: '少', show: 'キャラ大・表情変化豊か', bg: 'パステルで統一', themes: '日常・季節・ファン参加', emotions: 'かわいさ・幸福感', save: '壁紙的なかわいさ', share: 'ファン同士の共有', comment: '投票・質問企画への返信', follow: '公式の供給が安定', world: '色調を完全固定', clarity: 'ビジュアルの即時性', series: '記念日・企画の定例化' },
            { name: 'リラックマ（@rilakkuma_sanx_official）', genre: 'キャラクターIP', followers: '24万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/rilakkuma_sanx_official/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画', freq: '週数回', text: '少', show: 'ごろ寝・お茶などくつろぎ描写', bg: '部屋の温かい小物', themes: 'ダラダラ・休息の肯定', emotions: '安らぎ', save: '休みたい気分の代弁', share: '「休も？」の代わりに送る', comment: '共感の相づち', follow: '癒しの定期供給', world: 'くつろぎシーンに限定', clarity: 'シーンが説明不要', series: '定番の休憩シチュ' },
            { name: 'すみっコぐらし（@sumikkogurashi_official）', genre: 'キャラクターIP', followers: '15.6万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/sumikkogurashi_official/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画・カルーセル', freq: '週数回', text: '少〜中', show: '隅に寄る構図がアイデンティティ', bg: '余白多め・隅を活かす', themes: '内気・ひかえめの肯定', emotions: '安心・仲間感', save: 'キャラ設定図解の保存', share: '「これ私」キャラ診断的シェア', comment: '推しキャラ表明', follow: '内向性を肯定する世界観', world: '「隅」という一貫コンセプト', clarity: '構図自体がコンセプト説明', series: 'キャラ別深掘りシリーズ' },
            { name: 'カナヘイ（@kanahei_）', genre: 'ゆるキャラ（作家系）', followers: '21.8万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/kanahei_/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画・カルーセルマンガ', freq: '週数回', text: '少', show: '小動物2匹の掛け合い', bg: '淡色・最小限', themes: 'ゆるい日常・小さな幸せ', emotions: 'ほのぼの', save: '気持ちが緩む4コマ', share: 'スタンプ的に感情を送る', comment: '「かわいい」定期', follow: '安定した絵本感', world: '淡い色彩の完全統一', clarity: '表情と間で伝える', series: '2匹の関係性の継続' },
            { name: 'うさまる（@sakumaru_usamaru）', genre: 'ゆるキャラ（作家系）', followers: '約14.8万', data_type: 'verified', verified: true, source_url: 'https://instagram.userlocal.jp/u/sakumaru__4c5a0', source_name: 'User Local Instagram分析（二次情報）', checked_at: CHECKED, formats: '静止画', freq: '週数回', text: '極少', show: 'まるい輪郭・のんびり', bg: '無地〜淡色', themes: '食・ごろごろ・季節', emotions: 'のんびり', save: '和み用', share: 'あいさつ代わり', comment: '和みの相づち', follow: 'LINEスタンプからの流入', world: '丸さの徹底', clarity: '見た瞬間の癒し', series: '季節イベントの定例' },
            { name: 'タヌキとキツネ（アタモト）', genre: 'ゆるキャラ（作家系）', followers: '未確認', followers_est: '参考推定: 10万〜50万', data_type: 'estimated', verified: false, source_url: '', source_name: '', checked_at: null, formats: '静止画マンガ', freq: '週1〜数回', text: '少', show: '2匹の関係性が主役', bg: '森・シンプル', themes: '友情・ボケとツッコミ', emotions: 'ほほえましさ', save: '関係性の尊さ', share: '相方に送る', comment: '「うちらじゃん」', follow: '2匹の続きが見たくなる', world: 'キャラの役割固定', clarity: '構図パターンの反復', series: '関係性ベースの連載' },
            { name: '悲熊（キューライス @qrais_sukiusagi）', genre: 'ゆるキャラ（作家系）', followers: '未確認', followers_est: 'アカウント実在は確認（フォロワー数は取得できず）。X本体は28.2万を確認', data_type: 'estimated', verified: false, source_url: 'https://www.instagram.com/qrais_sukiusagi/', source_name: SRC_IG + '（存在のみ確認）', checked_at: CHECKED, formats: '静止画マンガ', freq: '週1〜数回', text: '少', show: '哀愁の背中・遠目の構図', bg: '生活感を淡く', themes: '悲哀・報われなさをユーモアに', emotions: '悲哀×笑い', save: 'だめな日のお守り', share: '「今日の俺」', comment: '「わかる」', follow: '悲しみの定期供給という逆説', world: 'トーンの暗さを統一', clarity: 'タイトル「悲熊」で世界が伝わる', series: '同構造の反復' },
            { name: 'ネコノヒー（キューライス）', genre: 'ゆるキャラ（作家系）', followers: '未確認', followers_est: '悲熊と同一作者アカウントに掲載', data_type: 'estimated', verified: false, source_url: 'https://www.instagram.com/qrais_sukiusagi/', source_name: SRC_IG + '（存在のみ確認）', checked_at: CHECKED, formats: '静止画マンガ', freq: '週数回', text: '少', show: '小さな挫折の瞬間を切り取る', bg: '最小限', themes: '小さな失敗・不運', emotions: '切なさ×かわいさ', save: 'ドジな日の共感', share: '失敗報告の代わり', comment: '「がんばった」', follow: '失敗を笑いに変える安心', world: '泣き顔の定番化', clarity: 'オチが一目', series: '失敗パターン集' },
            { name: 'パンダと犬（@steven_spielhamburg）', genre: '日常あるある', followers: '15.7万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/steven_spielhamburg/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画マンガ', freq: '週数回', text: '少〜中', show: 'キャラは記号・ネタが主役', bg: 'ほぼ白', themes: 'あるある・くだらない発見', emotions: '笑い', save: 'ネタのストック', share: '笑いの共有', comment: '大喜利的リプライ', follow: '外さない打率', world: '線の太さ固定', clarity: '1コマ目がフリとして機能', series: 'キャラ設定の使い回しで省エネ' },
            { name: 'つむぱぱ（@tsumugitopan）', genre: '日常あるある', followers: '100万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/tsumugitopan/', source_name: SRC_IG, checked_at: CHECKED, formats: 'カルーセルマンガ', freq: '週数回', text: '中', show: '家族キャラをシンプル記号化', bg: '白ベース', themes: '育児・家族の尊い瞬間', emotions: '感動・ほっこり', save: '育児記録の共感アーカイブ', share: '配偶者・親に送る', comment: '自分の家族エピソード', follow: '家族の成長を見守る感覚', world: '色数を絞ったデザイン統一', clarity: '1枚目がタイトル画面化', series: '家族メンバー別シリーズ' },
            { name: 'コアラ絵日記', genre: '日常あるある', followers: '未確認', followers_est: '参考推定: 50万〜100万', data_type: 'estimated', verified: false, source_url: '', source_name: '', checked_at: null, formats: 'カルーセルマンガ', freq: '週数回', text: '中', show: '夫婦をコアラ化して距離感を作る', bg: '生活感を簡略化', themes: '夫婦の日常・すれ違いと仲直り', emotions: '共感・笑い・じんわり', save: 'パートナー関係の教科書的保存', share: '配偶者に「これ見て」', comment: '自分の夫婦エピソード', follow: '2人の関係の続きを見たい', world: '動物化による柔らかい統一', clarity: '1枚目で状況設定を完結', series: '夫婦の定番やりとり' },
            { name: 'yumekanau2（田口久人）', genre: '言葉・詩系', followers: '66.8万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/yumekanau2/', source_name: SRC_IG, checked_at: CHECKED, formats: '文字カルーセル', freq: 'ほぼ毎日', text: '中（詩形式）', show: 'キャラなし・縦書き文字が主役', bg: '無地・紙質感', themes: '人生・人間関係・自己肯定', emotions: '救い・納得', save: '読み返す前提の保存が非常に多い', share: '悩んでいる人に送る', comment: '身の上の共有', follow: '定期的に効く言葉が届く', world: 'フォーマット完全固定', clarity: 'タイトル1行が要約', series: 'テーマ別の言葉シリーズ' },
            { name: 'もくもくちゃん（@mok2mok2chan）', genre: '癒し系イラスト', followers: '17.2万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/mok2mok2chan/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画（詩＋イラスト）', freq: '週数回', text: '中', show: 'ゆるいキャラ＋手書き文字', bg: '淡い水彩', themes: '疲れ・自己受容・休むこと', emotions: '癒し・許し', save: '疲れた夜に読み返す', share: '疲れてる友達に送る', comment: '「泣いた」「救われた」', follow: '弱った時の避難場所', world: '水彩と手書き文字の統一', clarity: '最初の1行が結論', series: '「〜な君へ」型の反復' },
            { name: '精神科医Tomy（@pdoctortomy）', genre: 'メンタル・疲れ共感', followers: '5.6万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/pdoctortomy/', source_name: SRC_IG, checked_at: CHECKED, formats: '文字投稿', freq: 'ほぼ毎日', text: '中', show: 'キャラなし・言葉のみ', bg: '単色', themes: '人間関係・手放し方', emotions: '納得・気楽さ', save: '対処法として保存', share: '悩む友人へ', comment: '相談・感謝', follow: '毎日の処方箋', world: '口調の完全固定（〜なのよ）', clarity: '結論ファースト', series: 'お悩み別シリーズ' },
            { name: 'Pusheen（@pusheen）', genre: 'キャラクターIP', followers: '約300万（分析サイトでは約219万）', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/pusheen/', source_name: SRC_IG + '＋SPEAKRJ分析', checked_at: CHECKED, formats: '静止画・GIF・リール', freq: '週数回', text: '極少（英語）', show: 'ぽってり猫・食とゴロゴロ', bg: '無地', themes: '食・怠惰・季節', emotions: 'かわいさ・ゆるさ', save: '壁紙・和み', share: '言語を問わないので世界中でシェア', comment: '絵文字中心', follow: '言葉なしで伝わる', world: 'グレー猫の一貫デザイン', clarity: '完全ノンバーバル', series: '季節・食べ物シリーズ' },
            { name: 'Liz Climo（@lizclimo）', genre: '絵本風', followers: '97.8万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/lizclimo/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画1コマ', freq: '週数回', text: '少（英語会話）', show: '動物2匹の短い会話', bg: 'ほぼ白・小物1つ', themes: 'やさしい会話・思いやり', emotions: 'ほっこり', save: 'やさしさの補給', share: 'パートナー・友達に', comment: '「尊い」', follow: '絵本のような安心感', world: '余白と淡色の統一', clarity: '1コマ会話で完結', series: '動物ペアの反復' },
            { name: 'Worry Lines（@worry__lines）', genre: 'メンタル・疲れ共感', followers: '86万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/worry__lines/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画（線画＋手書き英字）', freq: 'ほぼ毎日（1日1枚ルール）', text: '少', show: '不定形のゆるいキャラ', bg: '白', themes: '不安・自己受容', emotions: '安心・代弁', save: '不安な夜のお守り', share: '不安を抱える人へ', comment: '「needed this」型', follow: '感情の言語化力', world: '鉛筆線の統一', clarity: '短文が感情を一撃で言語化', series: '不安・休息テーマの反復' },
            { name: 'Strange Planet（@nathanwpylestrangeplanet）', genre: '日常あるある', followers: '約600万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/nathanwpylestrangeplanet/', source_name: SRC_IG + '＋TIME等の記事', checked_at: CHECKED, formats: '静止画4コマ', freq: '週数回', text: '中（英語）', show: '宇宙人が日常を客観視', bg: '2〜3色で統一', themes: '日常行動の再定義あるある', emotions: '知的な笑い', save: '言い回しのコレクション', share: '内輪ネタ化しやすい', comment: '構文の真似', follow: '独自の言語世界', world: '配色と構文の完全固定', clarity: 'フォーマット既知化で即理解', series: '同一構文の無限反復' },
            { name: 'ミッフィー情報サイト（@miffy_jp）', genre: 'キャラクターIP', followers: '29万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/miffy_jp/', source_name: SRC_IG + '（日本の情報サイトアカウント）', checked_at: CHECKED, formats: '静止画', freq: '週数回', text: '少', show: '正面顔・シンプルの極み', bg: '原色ベタ', themes: '日常・グッズ・アート', emotions: '安心・懐かしさ', save: 'デザインとして保存', share: 'ファン同士', comment: '思い出語り', follow: '普遍的デザイン', world: '線と色の厳格な統一', clarity: '記号性の極み', series: '絵本連動' },
            { name: 'スヌーピー（@snoopygrams）', genre: 'キャラクターIP', followers: '約400万', data_type: 'verified', verified: true, source_url: 'https://www.instagram.com/snoopygrams/', source_name: SRC_IG, checked_at: CHECKED, formats: '静止画（原作コマ）', freq: 'ほぼ毎日', text: '少〜中', show: '原作コマの引用構成', bg: '原作準拠', themes: '人生訓・友情', emotions: '含蓄・温かさ', save: '名言の保存', share: '励ましの代わり', comment: '解釈の共有', follow: '毎日の名言供給', world: '原作アーカイブの一貫性', clarity: '1コマ名言', series: '曜日別テーマ' },
            { name: 'カピバラさん（公式）', genre: 'キャラクターIP', followers: '未確認', followers_est: '参考推定: 10万〜50万', data_type: 'estimated', verified: false, source_url: '', source_name: '', checked_at: null, formats: '静止画', freq: '週数回', text: '少', show: 'のんびり・お風呂・お昼寝', bg: '淡い自然', themes: 'のんびり・休息', emotions: 'ゆるさ', save: '癒し補給', share: '「休もう」の合図', comment: '和み', follow: 'ゆるさの安定供給', world: 'のんびり以外やらない', clarity: 'シーンが説明不要', series: '定番シチュ反復' },
            { name: 'やまもとりえ', genre: '日常あるある', followers: '未確認', followers_est: '参考推定: 10万〜50万', data_type: 'estimated', verified: false, source_url: '', source_name: '', checked_at: null, formats: 'カルーセルマンガ', freq: '週1〜数回', text: '中', show: '家族の心理描写が丁寧', bg: '簡略', themes: '育児・夫婦の気持ちのすれ違い', emotions: '共感・涙', save: '感情の言語化を保存', share: 'パートナーに気持ちを伝える代わり', comment: '長文の身の上話', follow: '感情描写への信頼', world: '柔らかい線の統一', clarity: '1枚目で感情の主題提示', series: '連載形式' },
            { name: 'ゆる動物・癒し系（要調査枠）', genre: '癒し系イラスト', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: '静止画', freq: '要調査', text: '少', show: '要調査', bg: '要調査', themes: '癒し・日常', emotions: '安心', save: '要調査', share: '要調査', comment: '要調査', follow: '要調査', world: '要調査', clarity: '要調査', series: '要調査' },
            { name: 'AI活用キャラ系①（要調査枠）', genre: 'AI活用系（要調査）', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: '静止画・リール', freq: '要調査', text: '少', show: 'AI生成イラストの統一が課題になりがち', bg: '要調査', themes: '共感・癒し', emotions: '要調査', save: '要調査', share: '要調査', comment: '要調査', follow: '要調査', world: 'キャラ固定の工夫（参照画像等）を観察したい', clarity: '要調査', series: '要調査' },
            { name: 'AI活用キャラ系②（要調査枠）', genre: 'AI活用系（要調査）', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: 'リール中心', freq: '要調査', text: '少', show: '要調査', bg: '要調査', themes: '要調査', emotions: '要調査', save: '要調査', share: '要調査', comment: '要調査', follow: '要調査', world: '要調査', clarity: '要調査', series: '要調査' },
            { name: 'リール型キャラ（要調査枠）', genre: 'リール型キャラ', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: 'リール', freq: '要調査', text: '極少＋音源', show: 'ループ再生前提の短尺', bg: '要調査', themes: 'あるある・ネタ', emotions: '笑い', save: '要調査', share: '音源トレンドに乗せたシェア', comment: '要調査', follow: '要調査', world: '要調査', clarity: '最初の1秒が勝負', series: '同フォーマット反復' },
            { name: '文字カルーセル共感系（要調査枠）', genre: 'カルーセル共感', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: '文字カルーセル', freq: '毎日級が多い', text: '中', show: 'キャラなしが多い', bg: '無地＋1色', themes: '人間関係・仕事のしんどさ', emotions: '共感・納得', save: '保存率が高いとされるジャンル', share: '「わかる」の連鎖', comment: '体験談', follow: '悩み解決の期待', world: 'テンプレ統一', clarity: '1枚目が疑問形/言い切りのフック', series: 'ナンバリング連載' },
            { name: '絵本風作家系（要調査枠）', genre: '絵本風', followers: '未確認', data_type: 'placeholder', verified: false, source_url: '', source_name: '', checked_at: null, formats: 'カルーセル', freq: '週1前後', text: '少〜中', show: '見開き絵本風の構成', bg: '水彩・質感重視', themes: '小さな物語', emotions: 'じんわり', save: '読み物としての保存', share: '子どもや友人へ', comment: '感想', follow: '次のお話を待つ', world: '画材の統一', clarity: '表紙ページの明確化', series: 'お話の連載化' }
            ,{ name: 'ヨハクさん（@yohakusan_）', genre: '共感系イラスト', followers: '未確認', followers_est: 'Instagramの数値は未確認。Threads側は約4.1万・533投稿を確認（2026-08-29）', data_type: 'estimated', verified: false, source_url: 'https://www.instagram.com/yohakusan_/', source_name: '検索でIG/Threads/TikTokの実在を確認（投稿の中身は未閲覧）', checked_at: '2026-08-29', formats: '未分析（投稿の中身はこの環境から閲覧できない）', freq: '未分析', text: '未分析', show: '未分析', bg: '未分析', themes: 'プロフィールより：抱えきれない気持ちを受け取って心に余白をつくる（現代社会に疲れた人向け）', emotions: '共感・安心（プロフィール由来の推測）', save: '未分析', share: '未分析', comment: '未分析', follow: '未分析', world: '未分析', clarity: '未分析', series: '未分析' }
        ],

        /* ---- 投稿分析（アカウント研究・手動確認用） ----
         * 特定アカウントの投稿を「なぜ刺さるか」の教材として分析するメモ。
         * この環境からInstagramの投稿内容は閲覧できないため、推測で補完せず
         * status: 'pending_manual'（手動確認待ち）でURLだけ保存する。
         * ユーザーが投稿を見て分析欄を記入 → 5項目が揃うと「分析済み」になり、
         * 「構造ライブラリに追加」で生成に反映できる。 */
        postStudies: [
            {
                id: 'study-yohakusan',
                account: 'ヨハクさん（@yohakusan_）',
                url: 'https://www.instagram.com/yohakusan_/',
                status: 'pending_manual',
                confirmedFacts: [
                    'Instagram・Threads・TikTokに同名アカウントが実在（2026-08-29 検索で確認）',
                    'Threadsは約4.1万フォロワー・533投稿。プロフィール「抱えきれない気持ちを受け取って、心に余白をつくる存在」',
                    'LINEスタンプ「ヨハクさんの日常スタンプ」を展開',
                    'Instagramのカルーセル投稿の中身はこの環境から閲覧できないため未分析（推測では補完しない）'
                ],
                /* ↓分析観点。投稿を実際に見て記入する（空欄＝未確認） */
                hook: '', carousel: '', textDesign: '', empathy: '', afterFeel: '', charRole: '', scene: '',
                /* ↓保存する5項目 */
                features: '', why: '', structure: '', bouConversion: '',
                doNotCopy: 'デザイン・文章・イラスト・レイアウト・キャラクター造形はコピーしない。参考にするのは「なぜ刺さるか」の構造（フック・展開・着地・余白の作り方）のみ',
                data_type: 'placeholder'
            }
        ],

        /* ---- 投稿構造ライブラリ（リサーチの本体） ----
         * ここが投稿生成の参考になる「反応されやすい構造」の蓄積場所。
         * 表現はコピーせず、「なぜ刺さるか」の構造だけを抽出してぼぅの世界観に変換する。
         * 生成時は、この8つの型＋過去の採用実績＋最近使っていないテーマを組み合わせ、
         * 各案に「今回使った投稿構造（structure_used）」を記録する。 */
        structureTypes: [
            '王道共感型', '本音代弁型', '意外な視点型', '保存したい一言型',
            '誰かに送りたい型', '疲れた日の癒し型', '人間関係の本質型', '日常あるある型',
            'ぼぅらしい投稿の成功基準例'
        ],
        structures: [
            {
                id: 'st-kijun', type: 'ぼぅらしい投稿の成功基準例', theme: '休むことへの罪悪感を少し軽くする',
                hook: '1枚目で、読む人の価値観をほんの少しだけ転換する（「休むのも、今日のやること。」）',
                carousel: '4枚。1枚目=小さな価値観の転換／2枚目=大きな解決ではなく小さな行動／3枚目=同じ温度でもう一段だけ深める／4枚目=結論を出さず静かに終える',
                textAmount: '1枚1〜2行・10〜20文字。強い言葉を使わない',
                empathy: '休めない人を責めず、「休むこと」を行動としてただ肯定する。指示にも教訓にもしない',
                afterFeel: '力が抜ける・今日はもう寝ていいと思える',
                charRole: 'ぼぅが主役。布団に入る→横になる→目を閉じる→眠る、と動作だけで感情を語る',
                scene: '布団・夜',
                extraction: '小さな価値観の転換 → 小さな行動 → もう一段だけ深める → 静かな終了',
                bouConversion: '基準例の本文:「休むのも、今日のやること。」→「ちゃんと、横になる。」→「ちゃんと、目を閉じる。」→「今日はもう、ここまで。」／キャプション:「何もできなかった日、じゃなくて。今日は、休むことをした日。」（この文章は再利用せず、構造だけを別テーマに応用する）',
                source_note: 'ユーザーが「ぼぅらしい」と判断した投稿。生成時の基準にする',
                source_name: 'ユーザー登録', verified: true, data_type: 'manual', isBaseline: true
            },
            {
                id: 'st-oudou', type: '王道共感型', theme: '疲れ・自己肯定・何もしたくない日',
                hook: '言い切り型。状態を短く言い切ってスクロールを止める（問いかけない・説明しない）',
                carousel: '3〜4枚。1枚目=状態の言い切り／2〜3枚目=言い訳や補足を少しだけ／最後=解決せず「まあ、いっか」の余白で着地',
                textAmount: '1枚10〜20文字・1文は短く・強い言葉は使わず弱い言葉だけで組む',
                empathy: '「あなたはこう」と断定しない。「こういう日も、ある」の余白。読者の未言語化の感覚を先回りして代弁する',
                afterFeel: '安心・ほっとする・「これ私」',
                charRole: '感情の代弁役。表情は変えず、姿勢（沈む・伸びる）で気持ちを補う',
                scene: 'ソファ・布団・夜の部屋',
                extraction: 'まだ言葉になっていない状態を先に言い切られると、読者は「見つかった」と感じて止まる。解決しないことが逆に信頼になる',
                bouConversion: 'ぼぅ変換例：「何もしてないのに、疲れた。」→「思い出すのも疲れるから、やめた。」で着地',
                source_note: '共感系キャラ投稿全般の定番構造（一般傾向・特定投稿のコピーではない）', data_type: 'estimated'
            },
            {
                id: 'st-honne', type: '本音代弁型', theme: '返信・仕事・やる気が出ない日',
                hook: '言えない本音をキャラが先に言う。「ほんとは◯◯」構造。少し後ろめたいことほど止まる',
                carousel: '3〜4枚。1枚目=本音ぽろり／中間=本音の言い訳をゆるく／最後=開き直らず「そういう日」で受け流す',
                textAmount: '1枚15〜25文字。口語。語尾は濁す（〜と思ってる・〜かもしれん）',
                empathy: 'キャラが代わりに言うことで読者の免罪符になる。読者を責めない・急かさない',
                afterFeel: '「言ってくれた」という安堵・共犯感',
                charRole: '読者の代弁者。目をそらす・スマホを置くなど小さな動作が本音を補強',
                scene: 'スマホ・デスク・電車',
                extraction: '「自分だけじゃなかった」の発見が反応になる。本音は強い言葉ではなく、弱い告白の形が刺さる',
                bouConversion: 'ぼぅ変換例：「返信しようとは、思ってる。」（責めずに、思ってるだけの自分をそのまま置く）',
                source_note: '共感系キャラ投稿全般の定番構造', data_type: 'estimated'
            },
            {
                id: 'st-igai', type: '意外な視点型', theme: '自己肯定・比べてしまう日・予定',
                hook: '意外な定義や逆説を提示して「え？」で止める（例の構造：「本当に◯◯な人ってこんな人」→定義の意外性）',
                carousel: '4〜5枚。1枚目=意外な提示／中間=少しずつ視点をずらす／最後=静かな肯定に着地',
                textAmount: '1枚15〜25文字。断定は1枚目だけ。あとは弱く',
                empathy: '常識を裏返して読者の隠れた実感を肯定する。教訓化・説教化した瞬間に冷めるので、最後は必ず静かに',
                afterFeel: 'じわっと残る・後から思い出す',
                charRole: 'ただそこにいる役。視点の転換は言葉が担い、キャラは静けさを担保する',
                scene: '水面・窓の外・ひとり時間',
                extraction: '「意外な定義→続きが読みたくなる→静かな肯定へ着地」の3段構造。逆説そのものより着地の優しさが保存される',
                bouConversion: 'ぼぅ変換例：「何もしてない日に、いちばん疲れてることもある。」（意外な定義を提示→責めずに置くだけ）',
                source_note: '例：「本当に賢い人ってこんな人」型の構造抽出（表現は使わない）', data_type: 'estimated'
            },
            {
                id: 'st-hozon', type: '保存したい一言型', theme: '仕事・休息・明日に回したいこと',
                hook: '短い言い切りが「お守り」になる。10〜15文字で完結し、読み返す前提の言葉',
                carousel: '3枚でよい。1枚目=お守りの一言／2枚目=無言か小さな補足／最後=同じ言葉に戻るか余韻',
                textAmount: '1枚10文字前後。最短。改行は意味の切れ目だけ',
                empathy: '読者の代わりに「区切り」を宣言してあげる。命令形にしない（「〜しよう」はNG、「〜。」で置く）',
                afterFeel: '保存して夜に読み返したくなる',
                charRole: '言葉の隣にいるだけ。小物（閉じたノートPC・置いたスマホ）が「区切り」を可視化',
                scene: 'デスク・夜・布団に入る前',
                extraction: '保存される言葉は「教え」ではなく「許可」。短いほど自分の言葉として持ち歩ける',
                bouConversion: 'ぼぅ変換例：「今日は、ここまで。」（区切りの許可を宣言だけして解散）',
                source_note: '言葉系・共感系投稿の保存動機の構造', data_type: 'estimated'
            },
            {
                id: 'st-okuritai', type: '誰かに送りたい型', theme: '考えすぎ・比べてしまう日・返信',
                hook: '二人称を使わずに「相手に届く」言葉。送る側が説教にならない形が条件',
                carousel: '3〜4枚。1枚目=独り言の形をした言葉／中間=状況の共有／最後=相手への圧のない着地',
                textAmount: '1枚10〜20文字。「あなた」「きみ」を使わない（送られた側の圧になる）',
                empathy: '独り言の形だから送れる。「無理せんでね」ではなく「急ぐ用事、なかった。」のように自分の話として置く',
                afterFeel: '「これあなた」「一緒に休も」と送りたくなる',
                charRole: '感情の緩衝材。キャラを挟むことで直接言えないことが言える',
                scene: '電車・スマホ・カフェ',
                extraction: 'シェアされる言葉はメッセージの代筆。押しつけの匂いがゼロであることが唯一の条件',
                bouConversion: 'ぼぅ変換例：「考えるのは、明日でもいい。」（自分の独り言の形で、相手の肩の力も抜く）',
                source_note: 'シェア動機の構造分析', data_type: 'estimated'
            },
            {
                id: 'st-iyashi', type: '疲れた日の癒し型', theme: '休息・ひとり時間・疲れ',
                hook: 'ほぼ無言。表情と湯気・光だけで止める。文字を読ませない優しさ',
                carousel: '3〜4枚。無言または一言のみのページを含む。最後にだけ小さな一言',
                textAmount: '1枚0〜10文字。文章より「間」が主役',
                empathy: '何も要求しない。読むエネルギーすら要らないことが最大の共感',
                afterFeel: 'ほっとする・目が休まる・少し泣ける',
                charRole: 'ただそこにいる役の極致。マグカップ・湯気・布団などの小物が感情を全部語る',
                scene: 'お風呂・布団・温かい飲み物・夜',
                extraction: '疲れている読者に「読ませる」こと自体が負担。情報量を落とすほど深く届く日がある',
                bouConversion: 'ぼぅ変換例：湯気の3枚＋最後に「ほっと一息。」だけ（無言ページを恐れない）',
                source_note: '癒し系イラスト投稿の構造', data_type: 'estimated'
            },
            {
                id: 'st-ningen', type: '人間関係の本質型', theme: '人間関係・気遣い・本音',
                hook: '関係の機微を短く言語化。「あの一言、まだ考えてる」のような具体の入口',
                carousel: '4〜5枚。1枚目=具体的な機微／中間=気持ちの揺れを丁寧に／最後=教訓にせず、自分をゆるして終わる',
                textAmount: '1枚15〜25文字。感情語より状況描写',
                empathy: '「気にしすぎるあなたが悪い」と絶対に言わない。気にしてしまう側に立ち続ける',
                afterFeel: '少し泣ける・自分をゆるせる',
                charRole: '感情の代弁役。窓の外を見る・湯船に沈むなど、内省の姿勢で補う',
                scene: '窓・お風呂・夜・帰り道',
                extraction: '人間関係ネタは「相手を変える話」にした瞬間に説教になる。「自分の気持ちの置き場所」の話に留めると深く刺さる',
                bouConversion: 'ぼぅ変換例：「あれは、ひとりの延長戦だった。」→「そろそろ、終わりにする。」（相手を裁かず自分をゆるす着地）',
                source_note: '人間関係系共感投稿の構造', data_type: 'estimated'
            },
            {
                id: 'st-aruaru', type: '日常あるある型', theme: 'SNS・予定・明日に回したいこと',
                hook: '解像度の高い日常の切り取り。「5分だけ、のつもりが」のように続きを読者が自分で補完できる入口',
                carousel: '4〜5枚。1枚目=あるあるの提示／中間=時間経過や小さな展開／最後=オチではなく「まあ、そんなもん」の受容',
                textAmount: '1枚10〜20文字。具体的な数字や小物（5分・30分・電池1%）が効く',
                empathy: '笑いに寄せすぎない。「だめだね」ではなく「そんなもん。」で受け止める',
                afterFeel: '笑って力が抜ける・「今日の私」として送れる',
                charRole: '読者の分身。スマホ・ソファ・布団と一体化した姿が状況を1秒で伝える',
                scene: 'スマホ・ソファ・布団・電車',
                extraction: 'あるあるは「共通体験の証明」。ツッコまずに受容で終えると、笑いが安心に変わる',
                bouConversion: 'ぼぅ変換例：「5分だけ、のつもりが」→「それはそれで、すごい。」（責めない受容オチ）',
                source_note: 'あるある系投稿の構造', data_type: 'estimated'
            }
        ],

        /* ---- 人気投稿パターンの分析 ---- */
        patterns: {
            hooks: [
                '状態の言い切り型：「何もしてないのに疲れた」——説明せず状態だけ置く',
                '本音ぽろり型：普段言えないことをキャラが代弁する',
                'あるある提示型：「5分だけのつもりが」——続きを自分で補完させる',
                '無言＋表情型：文字なしでキャラの状態だけ見せる（ノンバーバル）',
                '疑問形フック：「今日、何した？」——コメントを誘うが押しつけがましくなりやすい'
            ],
            firstSecond: [
                '1枚目は「絵＋1行」で0.5秒で感情が伝わるのが共通',
                '状況説明はしない。感情 or 状態から入る',
                '文字は大きく短く。20文字以内が主流',
                'キャラの表情・ポーズだけで内容の8割が伝わる構図'
            ],
            textAndForm: [
                '画像内文字：1枚あたり1〜2行・10〜25文字が最頻',
                '言い切り（〜た。〜へん。）が共感系では強い。疑問形はコメント誘導用に少量',
                'カルーセルは3〜6枚が主流。最後の1枚は「オチ/着地/余韻」専用',
                '1投稿1テーマ・1感情。詰め込まない',
                'キャラは画面の1/3〜1/2サイズ・中央か下段。余白が世界観を作る',
                '背景は無地〜小物1つ。色数は3〜4色に絞る',
                '小物は「感情の小道具」（マグカップ・布団・スマホ）として反復使用'
            ],
            whySave: [
                '「あとで読み返したい言葉」になっている（お守り化）',
                '自分の状態を代弁してくれる（自己記録の代わり）',
                'シリーズでまとまっていて図鑑的に集めたくなる'
            ],
            whyShare: [
                '言葉が短く、相手へのメッセージ代わりになる（「これあなた」「休も？」）',
                '説明不要で誰にでも伝わる',
                '相手を傷つけない・説教にならない内容'
            ],
            whyComment: [
                '「わかる」と一言で参加できる余白がある',
                'キャラの安否や続きを気にかけたくなる',
                '自分のエピソードを話したくなる呼び水がある'
            ],
            whyFollow: [
                '「この子は毎回◯◯してくれる」という期待の固定（ねぎらい・脱力・悲哀…）',
                '世界観のルールが一貫していて裏切らない',
                '連載性・シリーズ性で「続きを見たい」が生まれる',
                '弱った時の避難場所として機能する'
            ],
            growing: [
                '状態言い切り型の1枚目フック', '1投稿1感情の徹底', '最後のページの「ゆるい着地」',
                '感情の小道具の反復（ぼぅなら：マグカップ・布団・水面の光）',
                '「この子は毎回◯◯」という期待の固定（ぼぅなら：急がない・解決しない）',
                'シリーズ化（同じ構造の安心感）', 'ノンバーバルページ（無言の1枚）の挿入',
                '保存されるお守り的な言葉（短く・説教なし）'
            ],
            fatigue: [
                '同じテーマの連投（疲れネタばかり等）', '同じ小物・同じ構図の連続',
                '毎回同じ語尾・同じオチ', '疑問形フックの多用（あざとく見える）',
                'あるあるの解像度が低いまま量産'
            ],
            notForBou: [
                '大喜利・ツッコミ系の笑い（ぼぅは争わない・急がない）',
                'ポジティブ全開の応援（励ましすぎはNG）',
                '感動の押し売り・泣かせにいく構成',
                '時事ネタ・トレンド即乗り（世界観が揺れる）',
                '派手な色・原色・大きなリアクション',
                'コメント返しの大喜利化（静かな場を保つ）'
            ],
            futureFormats: [
                '無言カルーセル（文字なし3枚＋最後に一言）',
                '「ぼぅの一週間」曜日シリーズ',
                '定番小道具シリーズ（マグカップの日・布団の日）',
                '読者の「今日はここまで」を集める参加型（Phase 2以降）',
                'ゆっくり動くだけのリール（漂うぼぅ・15秒ループ）（Phase 3以降）'
            ]
        },

        /* ---- 人気構造 → ぼぅ向け変換ルール ---- */
        conversion: [
            { from: '肯定・ねぎらい型（例：〜してえらい！）', to: 'ぼぅは褒めない。「それで、いい。」と隣に置くだけ。上からではなく横から' },
            { from: '不憫・報われない型', to: '可哀想を笑いにしない。「まあ、いっか」で本人が受け流す形に変換' },
            { from: '疑問形フックでコメント誘導', to: '多用しない。使うなら独り言（「〜でもいい。」）に変換して圧を消す' },
            { from: '名言・人生訓の保存型', to: '教えない。状態の言い切り（「今日は、ここまで。」）を保存される言葉にする' },
            { from: '感動ストーリー型', to: '泣かせにいかない。最後は必ず力が抜ける着地にする' },
            { from: '高頻度投稿で接触回数を稼ぐ', to: '頻度よりトーンの一貫性を優先。ぼぅは急がない' },
            { from: 'キャラを大きく目立たせる', to: 'ぼぅは画面の1/3以下・余白広め。静けさそのものを構図にする' },
            { from: 'トレンド音源・時事乗り', to: '乗らない。季節・天気・時間帯という普遍の文脈だけ使う' }
        ],

        bouUsable: [
            '1枚目＝状態の言い切りフック（20文字以内）',
            '3〜5枚カルーセルの「入口→小さな展開→ゆるい着地」構成',
            '無言ページ・余白・小さいキャラ配置',
            '感情の小道具の反復（マグカップ・布団・水面の光・スマホ）',
            '「ぼぅは毎回、急がず解決しない」という期待の固定',
            'お守りになる短い言葉（保存動機）',
            '「これあなた」と送りたくなる言葉（シェア動機）',
            'シリーズ化による安心感'
        ],
        bouAvoid: [
            '励まし・褒め・教え（コウペンちゃん型の直輸入はしない）',
            '不憫いじり・自虐の笑い', '疑問形の連発', '感動の演出', 'トレンド追従',
            '原色・大きな表情・にぎやかな構図', '長文・説明過多'
        ],

        /* ---- 投稿戦略の初期値 ---- */
        strategyDefaults: {
            positioning: '「がんばらない」の隣にいる、静かなマンボウ。励まさない・解決しない・急がない。見た人が「まあ、今日はこれでいっか」と力を抜ける場所。',
            audience: '疲れてSNSをぼーっと眺めている20〜40代。仕事・人間関係・SNS疲れを抱え、励ましより「わかってくれる沈黙」を求めている人。',
            followReasons: 'ぼぅは毎回：急がない／解決しない／責めない。この期待を裏切らないことがフォローの理由になる。',
            growThemes: '疲れ／返信／何もしたくない日／明日に回したいこと（採用・反応の実績で更新）',
            holdThemes: '比べてしまう日（重くなりやすい）／連続した同テーマ',
            nextFormats: '無言カルーセル／曜日シリーズ「ぼぅの一週間」／小道具シリーズ',
            weeklyPolicy: '今週は「返信」「休息」を中心に、C案（保存・シェア型）の言葉の強度を検証する。',
            monthlyExperiment: '最後のページを「無言＋小さな動作」にした時の読後感を試す月。'
        },

        /* ---- 成長段階ごとの戦略 ---- */
        phases: [
            { id: 1, range: '0〜1,000', goal: 'キャラクター認知と世界観の固定', freq: '週3〜4回（無理しない）', themes: '疲れ・休息・返信など「ぼぅの核」だけに絞る', carouselRatio: 'カルーセル90%・静止画10%', reelRatio: 'リール0%（まだやらない）', series: '「今日はここまで」を定番の締めとして反復', commentCta: '誘導しない。静かな場を保つ', fanActivity: 'なし。まず世界観の信頼を作る' },
            { id: 2, range: '1,000〜5,000', goal: '共感投稿の型を確立し、保存・シェアを増やす', freq: '週4〜5回', themes: '核テーマ＋あるある解像度の高い派生（SNS・予定・考えすぎ）', carouselRatio: 'カルーセル80%・静止画20%', reelRatio: 'リール0〜10%（実験のみ）', series: 'A/B/C型の当たりパターンをシリーズ化', commentCta: '独り言型の余白（「〜でもいい。」）で自然に', fanActivity: '保存を促す「お守り回」を月2回' },
            { id: 3, range: '5,000〜10,000', goal: 'シリーズ・リール・ファン化の強化', freq: '週5回＋リール週1', themes: 'シリーズ主導（曜日・小道具）＋読者の声からのテーマ', carouselRatio: 'カルーセル70%', reelRatio: 'リール20%（漂うだけの15秒ループ）', series: '曜日シリーズ・小道具シリーズを常設', commentCta: 'ストーリーズで「今日のまあいっか」を募集', fanActivity: '読者の「今日はここまで」紹介（許可制）' },
            { id: 4, range: '10,000〜', goal: 'キャラクターIPとして展開できる状態', freq: '週5回＋リール週2', themes: '世界観の深掘り（ぼぅの海・登場する小物の物語）', carouselRatio: 'カルーセル60%', reelRatio: 'リール30%', series: 'ミニ絵本連載・LINEスタンプ等の導線', commentCta: 'ファンネーム的な緩い合言葉（押しつけない）', fanActivity: 'グッズ・スタンプ投票などの参加企画' }
        ]
    };

    if (typeof window !== 'undefined') { window.BouResearchSeed = { SEED: SEED }; }
    if (typeof module !== 'undefined' && module.exports) { module.exports = { SEED: SEED }; }
})();
