/* =========================================================
   BAND STACK - ゲームデータ定義
   キャラクター・スキル・ピース・会場・レベル・チャレンジ・チュートリアル。
   後からの追加・調整はこのファイルを編集するだけで済むようにする。
   ========================================================= */
(function (global) {
  'use strict';

  /* ---- サウンドピース定義 ----
     色＋アイコン形状の両方で区別（色覚特性への配慮）。 */
  const PIECES = {
    guitar: { name: 'ギター',  color: '#e84545', dark: '#a02323', glyph: 'pick' },
    drum:   { name: 'ドラム',  color: '#f6b93b', dark: '#b07d14', glyph: 'drum' },
    bass:   { name: 'ベース',  color: '#3d7bf5', dark: '#1f4bb0', glyph: 'wave' },
    mic:    { name: 'マイク',  color: '#9b59d0', dark: '#66358f', glyph: 'mic' },
    note:   { name: '音符',    color: '#f8f4ec', dark: '#b8b0a0', glyph: 'note' },
    rock:   { name: '化石',    color: '#7d7468', dark: '#4a443c', glyph: 'fossil' },
  };

  /* ---- 公式メインキャラクター4人 ----
     ※4人目は名称未決定のため「？？？（NEW MEMBER）」表記を維持すること。 */
  const CHARACTERS = [
    {
      id: 'tyra',
      name: 'ティラ様',
      sub: 'ボーカル',
      desc: 'バンドザウルスのカリスマボーカル。真紅のティラノとターバン、カラフルな編み込みがトレードマーク。ステージのすべてを支配する。',
      theme: '#c0392b',
      themeLight: '#e8604a',
      skill: {
        name: 'カリスマオーダー',
        desc: '次の3ピースが盤面で一番多い楽器に変わり、8秒間ライブゲージが1.5倍たまる。',
        type: 'order',
      },
      voice: { base: 220, kind: 'sawtooth' },
    },
    {
      id: 'kaji',
      name: 'カジカジ',
      sub: 'ピアノ',
      desc: 'きらめくブルーのボディに花冠。黒いベルベットスーツで鍵盤を叩く豪快なピアニスト。演奏も破壊もダイナミック。',
      theme: '#2a9dc9',
      themeLight: '#56c8ee',
      skill: {
        name: 'グランドクラッシュ',
        desc: '鍵盤の一撃で盤面の下2段をまるごと消し飛ばす。ピンチの立て直しに最強。',
        type: 'crush',
      },
      voice: { base: 160, kind: 'triangle' },
    },
    {
      id: 'hanako',
      name: '花子',
      sub: 'ギター',
      desc: '金色のボディに赤いツノ、花飾りがチャームポイント。真っ赤な衣装の小さなギタリスト。細かい気配りでバンドを支える。',
      theme: '#d4a017',
      themeLight: '#f2c94c',
      skill: {
        name: 'フラワーチューニング',
        desc: '盤面で一番少ない楽器をぜんぶ音符（オールマイティ）に変えて、盤面を整える。',
        type: 'tune',
      },
      voice: { base: 330, kind: 'square' },
    },
    {
      id: 'newmember',
      name: '？？？',
      sub: 'NEW MEMBER',
      desc: 'ピンクのボディに大きなリボン。まつげがキュートな謎の新メンバー。正式名称は近日発表…！？',
      theme: '#e05fa0',
      themeLight: '#ff9ecb',
      skill: {
        name: 'ミラクルアンコール',
        desc: '12秒間スコアが2倍になり、観客のボルテージが一気に上がる。',
        type: 'encore',
      },
      voice: { base: 440, kind: 'sine' },
    },
  ];

  /* ---- ライブ会場（初期版は作り込んだ3ステージ） ---- */
  const VENUES = [
    {
      id: 'street',
      name: '路上ライブ',
      desc: 'すべてはここから。夕暮れの商店街で最初のファンをつかもう。',
      unlockFans: 0,
      fanRate: 1,
      crowd: 8,
      sky: ['#2b1a3d', '#6d3557', '#e8845a'],
      accent: '#ffb86b',
      fx: { confetti: false, laser: false, spotlights: 1 },
    },
    {
      id: 'livehouse',
      name: 'ライブハウス',
      desc: '熱気あふれる箱。ファン3,000人で解放。照明とスモークが本格化！',
      unlockFans: 3000,
      fanRate: 1.5,
      crowd: 16,
      sky: ['#120b1e', '#26123a', '#4a1f5e'],
      accent: '#c86bff',
      fx: { confetti: true, laser: false, spotlights: 2 },
    },
    {
      id: 'arena',
      name: 'アリーナ',
      desc: '2万人の大歓声。ファン15,000人で解放。レーザーと紙吹雪の大演出！',
      unlockFans: 15000,
      fanRate: 2,
      crowd: 26,
      sky: ['#050514', '#101038', '#232360'],
      accent: '#6bd7ff',
      fx: { confetti: true, laser: true, spotlights: 3 },
    },
  ];

  /* ---- レベルごとの落下間隔(ms)と化石出現率 ---- */
  const LEVELS = [
    { speed: 950, rock: 0 },
    { speed: 850, rock: 0 },
    { speed: 760, rock: 0 },
    { speed: 680, rock: 0 },
    { speed: 610, rock: 0.03 },
    { speed: 550, rock: 0.03 },
    { speed: 500, rock: 0.05 },
    { speed: 455, rock: 0.05 },
    { speed: 415, rock: 0.07 },
    { speed: 380, rock: 0.07 },
    { speed: 350, rock: 0.08 },
    { speed: 322, rock: 0.08 },
    { speed: 297, rock: 0.09 },
    { speed: 275, rock: 0.09 },
    { speed: 255, rock: 0.10 },
  ];
  const PIECES_PER_LEVEL = 12; // このピース数ごとにレベルアップ

  /* ---- ライブチャレンジ（時間内に目標ファン数を獲得） ---- */
  const CHALLENGES = [
    { id: 'c1', name: 'デビューライブ', time: 120, targetFans: 600,  venue: 'street',
      desc: '2分でファン600人を集めよう！' },
    { id: 'c2', name: 'ワンマンライブ', time: 150, targetFans: 2000, venue: 'livehouse',
      desc: '2分30秒でファン2,000人！コンボが鍵。' },
    { id: 'c3', name: '伝説のアンコール', time: 180, targetFans: 5000, venue: 'arena',
      desc: '3分でファン5,000人！バンドセットを狙え！' },
  ];

  /* ---- チュートリアルの手順 ---- */
  const TUTORIAL_STEPS = [
    { id: 'move',    text: '← → で ピースを うごかそう！\n（スワイプ か ボタン）', goal: 'move' },
    { id: 'rotate',  text: 'タップ か ⟳ボタンで むきを かえよう！', goal: 'rotate' },
    { id: 'drop',    text: 'したに スワイプで はやく おとせるよ！', goal: 'lock' },
    { id: 'match',   text: 'おなじ がっきを タテか ヨコに 3つ ならべて けそう！', goal: 'clear' },
    { id: 'bandset', text: '4しゅるいの がっきを 2×2に あつめると…\n「バンドセット」で 大ボーナス！', goal: 'bandset' },
    { id: 'skill',   text: 'ライブゲージが まんタンに なったら\nスキルボタンで ひっさつワザ！', goal: 'skill' },
    { id: 'done',    text: 'かんぺき！ さあ、ライブの じかんだ！！', goal: 'end' },
  ];

  /* チュートリアル用の固定ピース列（[下セル, 上セル]） */
  const TUTORIAL_QUEUE = [
    ['guitar', 'drum'],   // 移動練習
    ['bass', 'mic'],      // 回転練習
    ['guitar', 'guitar'], // 落下練習
    ['guitar', 'drum'],   // 3連消去（ギターを並べる）
    ['bass', 'drum'],     // バンドセット準備
    ['mic', 'guitar'],    // バンドセット完成用
    ['drum', 'bass'],
    ['guitar', 'mic'],
    ['drum', 'drum'],
    ['bass', 'bass'],
    ['mic', 'mic'],
    ['guitar', 'bass'],
  ];

  global.BSData = {
    PIECES, CHARACTERS, VENUES, LEVELS, PIECES_PER_LEVEL,
    CHALLENGES, TUTORIAL_STEPS, TUTORIAL_QUEUE,
    SAVE_KEY: 'bandstack.save.v1',
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.BSData;
})(typeof window !== 'undefined' ? window : globalThis);
