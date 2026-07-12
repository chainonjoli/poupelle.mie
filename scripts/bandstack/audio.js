/* =========================================================
   BAND STACK - 音響システム（WebAudio合成・外部ファイル不要）
   ・楽器ピースごとに違う消去音（重ねると演奏に聞こえる設計）
   ・コンボで音程が上がる
   ・軽量BGMループ（メニュー/プレイ/ライブ）
   ・効果音とBGMを別々にオン/オフ可能
   ========================================================= */
(function (global) {
  'use strict';

  const AC = global.AudioContext || global.webkitAudioContext;

  class AudioMan {
    constructor() {
      this.ctx = null;
      this.sfxOn = true;
      this.bgmOn = true;
      this.master = null;
      this.bgmGain = null;
      this.bgmTimer = null;
      this.bgmMode = null;   // 'menu' | 'play'
      this.bgmStep = 0;
      this.noiseBuf = null;
    }

    /* ユーザー操作をきっかけに初期化（モバイルの自動再生制限対策） */
    unlock() {
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.32;
        this.bgmGain.connect(this.master);
        // 歓声用ノイズバッファ
        const len = this.ctx.sampleRate * 1.2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    _now() { return this.ctx ? this.ctx.currentTime : 0; }

    /* 基本トーン */
    _tone(freq, dur, kind, vol, when, dest, bend) {
      if (!this.ctx) return;
      const t = when || this._now();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = kind || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * bend), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.master);
      o.start(t); o.stop(t + dur + 0.02);
    }

    _noise(dur, vol, filterFreq, when, q) {
      if (!this.ctx || !this.noiseBuf) return;
      const t = when || this._now();
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = filterFreq || 1200; f.Q.value = q || 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + dur + 0.05);
    }

    /* ---------- 効果音 ---------- */
    sfx(name, opt = {}) {
      if (!this.sfxOn || !this.ctx) return;
      const combo = Math.min(opt.combo || 1, 8);
      const up = Math.pow(1.12, combo - 1); // コンボで音程アップ
      switch (name) {
        case 'move':   this._tone(340, 0.05, 'square', 0.05); break;
        case 'rotate': this._tone(520, 0.06, 'square', 0.06); this._tone(700, 0.05, 'square', 0.04, this._now() + 0.03); break;
        case 'land':   this._tone(150, 0.09, 'triangle', 0.14, null, null, 0.6); this._noise(0.06, 0.05, 500); break;
        case 'harddrop': this._tone(120, 0.12, 'sawtooth', 0.12, null, null, 0.4); this._noise(0.1, 0.08, 800); break;
        case 'hold': this._tone(400, 0.07, 'sine', 0.08); break;
        case 'ui':     this._tone(600, 0.06, 'sine', 0.08); this._tone(900, 0.06, 'sine', 0.06, this._now() + 0.05); break;
        case 'uiback': this._tone(500, 0.07, 'sine', 0.07, null, null, 0.7); break;

        /* 楽器別の消去音：重なると演奏になる */
        case 'clear-guitar': { // ギター:コード
          [330, 415, 494].forEach((f, i) => this._tone(f * up, 0.35, 'sawtooth', 0.07, this._now() + i * 0.02));
          break;
        }
        case 'clear-drum':   // ドラム:キック＋スネア
          this._tone(90, 0.18, 'sine', 0.3, null, null, 0.4);
          this._noise(0.12, 0.16, 2200, this._now() + 0.02);
          break;
        case 'clear-bass':   // ベース:低音スライド
          this._tone(82 * Math.pow(1.06, combo), 0.4, 'triangle', 0.26, null, null, 1.5);
          break;
        case 'clear-mic':    // マイク:ボーカル風＋小歓声
          this._tone(523 * up, 0.3, 'sine', 0.14, null, null, 1.25);
          this._noise(0.35, 0.05, 3000, this._now() + 0.05, 0.5);
          break;
        case 'clear-note':   // 音符:きらきら
          [880, 1175, 1568].forEach((f, i) => this._tone(f, 0.22, 'sine', 0.08, this._now() + i * 0.05));
          break;
        case 'clear-rock':   // 化石:砕ける
          this._noise(0.2, 0.14, 600, null, 2);
          break;

        case 'bandset': { // バンドセット:4音ファンファーレ＋歓声
          const t0 = this._now();
          [262, 330, 392, 523].forEach((f, i) => this._tone(f * 1.0, 0.5, 'square', 0.1, t0 + i * 0.07));
          this._tone(1046, 0.6, 'sine', 0.1, t0 + 0.3);
          this.cheer(0.5);
          break;
        }
        case 'combo': this._tone(660 * up, 0.15, 'square', 0.09, null, null, 1.3); break;
        case 'gaugefull': {
          const t0 = this._now();
          [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.18, 'sine', 0.1, t0 + i * 0.06));
          break;
        }
        case 'skill': {
          const t0 = this._now();
          this._tone(196, 0.5, 'sawtooth', 0.14, t0, null, 2);
          [392, 494, 587, 784].forEach((f, i) => this._tone(f, 0.35, 'square', 0.08, t0 + 0.1 + i * 0.08));
          this.cheer(0.7);
          break;
        }
        case 'danger': this._tone(180, 0.25, 'sawtooth', 0.08, null, null, 0.8); break;
        case 'levelup': {
          const t0 = this._now();
          [392, 523, 659, 784].forEach((f, i) => this._tone(f, 0.16, 'triangle', 0.11, t0 + i * 0.07));
          break;
        }
        case 'gameover': {
          const t0 = this._now();
          [392, 370, 330, 262].forEach((f, i) => this._tone(f, 0.4, 'triangle', 0.12, t0 + i * 0.22, null, 0.95));
          break;
        }
        case 'result': {
          const t0 = this._now();
          [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.1, t0 + i * 0.1));
          this.cheer(0.8);
          break;
        }
      }
    }

    /* 歓声 */
    cheer(vol) {
      if (!this.sfxOn || !this.ctx) return;
      const t = this._now();
      this._noise(0.9, (vol || 0.5) * 0.18, 1500, t, 0.4);
      this._noise(0.7, (vol || 0.5) * 0.1, 3400, t + 0.08, 0.6);
    }

    /* ---------- BGM（16ステップの軽量シーケンサ） ---------- */
    startBGM(mode) {
      if (!this.ctx) return;
      if (this.bgmMode === mode && this.bgmTimer) return;
      this.stopBGM();
      this.bgmMode = mode;
      if (!this.bgmOn) return;
      this.bgmStep = 0;
      const bpm = mode === 'menu' ? 96 : 118;
      const stepDur = 60 / bpm / 2; // 8分音符
      // シンプルなコード進行 (Am F C G 風)
      const bassLines = {
        menu: [220, 220, 175, 175, 131, 131, 196, 196],
        play: [220, 220, 175, 175, 131, 131, 196, 196],
      };
      const melody = {
        menu: [0, 330, 0, 392, 0, 349, 0, 330, 0, 262, 0, 294, 0, 330, 0, 0],
        play: [440, 0, 523, 0, 440, 392, 0, 349, 440, 0, 523, 587, 0, 523, 0, 392],
      };
      const tick = () => {
        if (!this.bgmOn || !this.ctx) return;
        const s = this.bgmStep % 16;
        const bar = (this.bgmStep >> 4) % 2;
        const t = this._now() + 0.02;
        const bass = bassLines[this.bgmMode || 'menu'];
        // ベース（4分）
        if (s % 2 === 0) {
          this._tone(bass[(s / 2) | 0] / 2, stepDur * 1.8, 'triangle', 0.16, t, this.bgmGain);
        }
        // ハイハット（8分）
        this._noise(0.03, s % 4 === 2 ? 0.05 : 0.03, 6000, t, 3);
        // キック（プレイ時のみ強め）
        if (this.bgmMode === 'play' && s % 4 === 0) {
          this._tone(70, 0.1, 'sine', 0.22, t, this.bgmGain, 0.5);
        }
        // メロディ
        const mel = melody[this.bgmMode || 'menu'];
        const f = mel[s];
        if (f && (this.bgmMode === 'play' || bar === 1)) {
          this._tone(f, stepDur * 1.2, 'square', 0.045, t, this.bgmGain);
        }
        this.bgmStep++;
      };
      this.bgmTimer = setInterval(tick, stepDur * 1000);
    }

    stopBGM() {
      if (this.bgmTimer) { clearInterval(this.bgmTimer); this.bgmTimer = null; }
      this.bgmMode = null;
    }

    setSfx(on) { this.sfxOn = on; }
    setBgm(on) {
      this.bgmOn = on;
      if (!on) this.stopBGM();
    }
  }

  global.BSAudio = new AudioMan();
})(typeof window !== 'undefined' ? window : globalThis);
