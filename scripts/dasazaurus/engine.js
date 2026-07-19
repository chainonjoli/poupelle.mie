/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   ゲームエンジン（純ロジック・DOM非依存・Nodeテスト可）
   ・デッキ生成（メンバー必ず入り＋隠しキャラ低確率）
   ・神経衰弱の状態遷移（first / match / miss / clear）
   ・リアクション抽選（直近の重複を避ける・掛け合い・居眠り）
   ========================================================= */
(function (global) {
  'use strict';

  const Cards = (typeof require === 'function' && typeof module !== 'undefined')
    ? require('./cards.js') : global.DZCards;
  const Lines = (typeof require === 'function' && typeof module !== 'undefined')
    ? require('./lines.js') : global.DZLines;

  /* 再現可能な乱数（mulberry32） */
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* デッキ生成：
     - メンバー4種は必ず入れる（ペア数が足りる限り）
     - dokiChance の確率でアイテム1種を DOKIDOKI に差し替え
     - 残りはアイテムからランダム */
  function buildDeck(opt) {
    const { cols, rows, rng } = opt;
    const dokiChance = opt.dokiChance == null ? 0.07 : opt.dokiChance;
    // チャーミーはさらにまれ（人気なので出現機会は作るが、姿は見せない）
    const charmyChance = opt.charmyChance == null ? 0.05 : opt.charmyChance;
    const total = cols * rows;
    if (total % 2 !== 0) throw new Error('カード枚数は偶数が必要');
    const pairs = total / 2;

    const ids = [];
    const members = Cards.MEMBER_CARDS.map((c) => c.id);
    for (let i = 0; i < Math.min(members.length, pairs); i++) ids.push(members[i]);

    const items = shuffle(Cards.ITEM_CARDS.map((c) => c.id), rng);
    while (ids.length < pairs) {
      const next = items.pop();
      if (!next) throw new Error('カード種が足りません');
      ids.push(next);
    }

    // メンバー以外のアイテム枠を、隠しキャラに差し替える
    const replaceItem = (newId) => {
      for (let i = ids.length - 1; i >= 0; i--) {
        if (members.indexOf(ids[i]) === -1 &&
            ids[i] !== Cards.DOKI_CARD.id && ids[i] !== Cards.CHARMY_CARD.id) {
          ids[i] = newId;
          return true;
        }
      }
      return false;
    };

    let hasDoki = false;
    if (rng() < dokiChance) hasDoki = replaceItem(Cards.DOKI_CARD.id);

    let hasCharmy = false;
    if (rng() < charmyChance) hasCharmy = replaceItem(Cards.CHARMY_CARD.id);

    const deck = [];
    ids.forEach((id) => { deck.push(id, id); });
    shuffle(deck, rng);
    return { deck, hasDoki, hasCharmy, pairs };
  }

  /* 神経衰弱ゲーム本体 */
  class MemoryGame {
    constructor(opt) {
      this.cols = opt.cols;
      this.rows = opt.rows;
      this.rng = opt.rng || makeRng(opt.seed || (Date.now() & 0xffffffff));
      const built = buildDeck({ cols: this.cols, rows: this.rows, rng: this.rng,
        dokiChance: opt.dokiChance, charmyChance: opt.charmyChance });
      this.deck = built.deck;          // カードID配列
      this.hasDoki = built.hasDoki;
      this.hasCharmy = built.hasCharmy;
      this.pairs = built.pairs;
      this.matched = new Array(this.deck.length).fill(false);
      this.open = [];                  // 現在オープン中のindex（最大2）
      this.pendingMiss = false;        // miss後、closeMiss()待ち
      this.moves = 0;                  // めくった組数
      this.combo = 0;                  // 連続マッチ数
      this.maxCombo = 0;
      this.matchedPairs = 0;
      this.cleared = false;
    }

    canFlip(i) {
      return !this.cleared && !this.pendingMiss &&
        i >= 0 && i < this.deck.length &&
        !this.matched[i] && this.open.indexOf(i) === -1 &&
        this.open.length < 2;
    }

    /* 1枚めくる。結果イベントを返す */
    flip(i) {
      if (!this.canFlip(i)) return { type: 'reject' };
      this.open.push(i);
      if (this.open.length === 1) {
        return { type: 'first', index: i, cardId: this.deck[i] };
      }
      // 2枚目
      this.moves++;
      const [a, b] = this.open;
      if (this.deck[a] === this.deck[b]) {
        this.matched[a] = this.matched[b] = true;
        this.open = [];
        this.matchedPairs++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.cleared = this.matchedPairs === this.pairs;
        return {
          type: 'match', indices: [a, b], cardId: this.deck[a],
          combo: this.combo, cleared: this.cleared,
          isDoki: this.deck[a] === Cards.DOKI_CARD.id,
          isCharmy: this.deck[a] === Cards.CHARMY_CARD.id,
        };
      }
      this.combo = 0;
      this.pendingMiss = true;
      return { type: 'miss', indices: [a, b], cardIds: [this.deck[a], this.deck[b]] };
    }

    /* miss後にカードを裏へ戻す（アニメ終了後にUIから呼ぶ） */
    closeMiss() {
      if (!this.pendingMiss) return false;
      this.open = [];
      this.pendingMiss = false;
      return true;
    }
  }

  /* リアクション抽選：
     - 直近に出た台詞は避ける（重複感をなくす）
     - SHIBAKUZOは一定確率で場面に関係なく居眠り
     - たまに2人の掛け合いになる
     - 返り値: [{c: charId, t: text}] （1〜2件） */
  class ReactionPicker {
    constructor(rng) {
      this.rng = rng || Math.random;
      this.recent = [];        // 直近に使った台詞
      this.recentMax = 14;
      this.duoChance = 0.16;
      this.sleepChance = 0.28; // SHIBAKUZOが選ばれた時に寝ている確率
      this.lastChar = null;
    }

    _remember(t) {
      this.recent.push(t);
      if (this.recent.length > this.recentMax) this.recent.shift();
    }

    _pickFrom(arr) {
      const fresh = arr.filter((t) => this.recent.indexOf(t) === -1);
      const pool = fresh.length ? fresh : arr;
      const t = pool[Math.floor(this.rng() * pool.length)];
      this._remember(t);
      return t;
    }

    /* event: 'start'|'first'|'match'|'miss'|'combo'|'clear'|'doki'|'charmy' */
    pick(event) {
      const solo = Lines.solo;
      if (event === 'doki') {
        return [{ c: 'dokidoki', t: this._pickFrom(solo.dokidoki.doki) }];
      }
      if (event === 'charmy') {
        // チャーミーは姿を見せず、謎めいた一言だけ残す（ラストの通知への伏線）
        return [{ c: 'charmy', t: this._pickFrom(solo.charmy.charmy) }];
      }

      // 掛け合い（開始・クリア以外の通常イベントで発生）
      if ((event === 'first' || event === 'match' || event === 'miss') &&
          this.rng() < this.duoChance) {
        const fresh = Lines.duo.filter((d) => this.recent.indexOf(d[0].t) === -1);
        const pool = fresh.length ? fresh : Lines.duo;
        const d = pool[Math.floor(this.rng() * pool.length)];
        this._remember(d[0].t);
        this._remember(d[1].t);
        return d.map((x) => ({ c: x.c, t: x.t }));
      }

      // 話すキャラを選ぶ（同じキャラの連続を避けめに）
      const chars = ['takeru', 'funky', 'terako', 'shibakuzo'];
      let c = chars[Math.floor(this.rng() * chars.length)];
      if (c === this.lastChar) c = chars[Math.floor(this.rng() * chars.length)];
      this.lastChar = c;

      // SHIBAKUZOはカードより睡眠優先
      if (c === 'shibakuzo' && event !== 'clear' && event !== 'start' &&
          this.rng() < this.sleepChance) {
        return [{ c, t: this._pickFrom(solo.shibakuzo.sleep), sleeping: true }];
      }

      const bucket = solo[c][event] || solo[c].first;
      return [{ c, t: this._pickFrom(bucket) }];
    }
  }

  const DZEngine = { makeRng, shuffle, buildDeck, MemoryGame, ReactionPicker };
  if (typeof module !== 'undefined' && module.exports) module.exports = DZEngine;
  global.DZEngine = DZEngine;
})(typeof window !== 'undefined' ? window : globalThis);
