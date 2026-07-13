/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   カード定義とステージ定義（純データ・Nodeテスト可）
   カードはキャラクターだけでなく「ダサザウルスの世界」を
   表すアイテムで構成する。
   ========================================================= */
(function (global) {
  'use strict';

  /* メンバーカード（絵はcharacters.jsのSVGを使う） */
  const MEMBER_CARDS = [
    { id: 'takeru',    name: 'タケル憧れ',   type: 'member' },
    { id: 'funky',     name: 'ファンキー無糖', type: 'member' },
    { id: 'terako',    name: '大騒テラコ',   type: 'member' },
    { id: 'shibakuzo', name: 'SHIBAKUZO',   type: 'member' },
  ];

  /* 隠しキャラカード（低確率でデッキに混ざる） */
  const DOKI_CARD = { id: 'dokidoki', name: 'DOKIDOKI', type: 'secret' };

  /* アイテムカード（世界観の小道具たち） */
  const ITEM_CARDS = [
    { id: 'guitar',   emoji: '🎸', name: 'ギター' },
    { id: 'drum',     emoji: '🥁', name: 'ドラム' },
    { id: 'keyboard', emoji: '🎹', name: 'キーボード' },
    { id: 'mic',      emoji: '🎤', name: 'マイク' },
    { id: 'towel',    emoji: '🧣', name: 'バンドタオル' },
    { id: 'ticket',   emoji: '🎫', name: 'ライブチケット' },
    { id: 'penlight', emoji: '🔦', name: 'ペンライト' },
    { id: 'speaker',  emoji: '🔊', name: 'スピーカー' },
    { id: 'note',     emoji: '🎵', name: 'おんぷ' },
    { id: 'headphone',emoji: '🎧', name: 'ヘッドホン' },
    { id: 'radio',    emoji: '📻', name: 'ラジカセ' },
    { id: 'megaphone',emoji: '📣', name: 'メガホン' },
    { id: 'pizza',    emoji: '🍕', name: 'ピザ' },
    { id: 'beer',     emoji: '🍺', name: 'ビール' },
    { id: 'meat',     emoji: '🍖', name: 'おにく' },
    { id: 'veggie',   emoji: '🥦', name: 'やさい' },
    { id: 'onigiri',  emoji: '🍙', name: 'おにぎり' },
    { id: 'ramen',    emoji: '🍜', name: 'ラーメン' },
    { id: 'curry',    emoji: '🍛', name: 'カレー' },
    { id: 'umbrella', emoji: '☂️', name: 'かさ' },
    { id: 'mountain', emoji: '⛰️', name: 'やま' },
    { id: 'starsky',  emoji: '🌠', name: 'ほしぞら' },
    { id: 'park',     emoji: '🌳', name: 'こうえん' },
    { id: 'truck',    emoji: '🛻', name: 'きざい車' },
    { id: 'dreamnote',emoji: '📝', name: 'ゆめノート' },
    { id: 'dinomask', emoji: '🦖', name: '恐竜マスク' },
    { id: 'flower',   emoji: '🌼', name: 'はな' },
    { id: 'sneaker',  emoji: '👟', name: 'スニーカー' },
  ];

  /* 難易度（スマホ縦画面前提：cols×rows） */
  const DIFFICULTIES = [
    { id: 'easy',   name: 'EASY',   cols: 4, rows: 4, label: '4×4' },
    { id: 'normal', name: 'NORMAL', cols: 4, rows: 5, label: '5×4' },
    { id: 'hard',   name: 'HARD',   cols: 6, rows: 6, label: '6×6' },
    { id: 'legend', name: 'LEGEND', cols: 8, rows: 8, label: '8×8' },
  ];

  /* ステージ（進むほど会場が豪華に・観客が増える） */
  const STAGES = [
    { id: 'park',       name: '公園',         icon: '🌳', audience: 3,
      desc: 'ハトと子どもがお客さん。はじまりの場所。' },
    { id: 'restaurant', name: 'レストラン',   icon: '🍕', audience: 6,
      desc: 'ピザのにおい。店長のご厚意で夜だけステージ。' },
    { id: 'mountain',   name: '山',           icon: '⛰️', audience: 9,
      desc: '星空の下の野外ライブ。声がどこまでも届く。' },
    { id: 'livehouse',  name: 'ライブハウス', icon: '🎸', audience: 14,
      desc: 'はじめての屋内ワンマン。チケットは手売り。' },
    { id: 'makuhari',   name: '幕張メッセ',   icon: '🏟️', audience: 24,
      desc: 'まだ見ぬステージ。夢の続きはここから。' },
  ];

  const DZCards = { MEMBER_CARDS, ITEM_CARDS, DOKI_CARD, DIFFICULTIES, STAGES };

  if (typeof module !== 'undefined' && module.exports) module.exports = DZCards;
  global.DZCards = DZCards;
})(typeof window !== 'undefined' ? window : globalThis);
