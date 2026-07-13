/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   音響システム（WebAudio合成・外部ファイル不要）
   ・コミカルSE：めくり、正解（コンボで音程UP）、はずれ、居眠り
   ・クリア時ファンファーレ＋歓声、通知音
   ・軽量BGMループ（メニュー/プレイ）
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
      this.bgmMode = null;
      this.bgmStep = 0;
      this.noiseBuf = null;
    }

    /* ユーザー操作をきっかけに初期化（モバイル自動再生制限対策） */
    unlock() {
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.3;
        this.bgmGain.connect(this.master);
        const len = this.ctx.sampleRate * 1.2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    _now() { return this.ctx ? this.ctx.currentTime : 0; }

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

    sfx(name, opt = {}) {
      if (!this.sfxOn || !this.ctx) return;
      const combo = Math.min(opt.combo || 1, 8);
      const up = Math.pow(1.1, combo - 1);
      const t0 = this._now();
      switch (name) {
        case 'ui':     this._tone(600, 0.06, 'sine', 0.08); this._tone(900, 0.06, 'sine', 0.06, t0 + 0.05); break;
        case 'uiback': this._tone(500, 0.07, 'sine', 0.07, null, null, 0.7); break;
        case 'flip':   this._tone(480, 0.06, 'triangle', 0.1, null, null, 1.4); break;
        case 'match':  // 正解：明るいコード（コンボで音程UP）
          [523, 659, 784].forEach((f, i) => this._tone(f * up, 0.28, 'triangle', 0.1, t0 + i * 0.05));
          this._tone(1046 * up, 0.3, 'sine', 0.07, t0 + 0.16);
          break;
        case 'miss':   // はずれ：コミカルな「ぷゅ〜」
          this._tone(420, 0.3, 'square', 0.07, t0, null, 0.45);
          this._tone(300, 0.22, 'triangle', 0.06, t0 + 0.06, null, 0.5);
          break;
        case 'sleep':  // 居眠り：いびき風
          this._tone(90, 0.35, 'sawtooth', 0.08, t0, null, 0.7);
          this._tone(75, 0.3, 'sawtooth', 0.06, t0 + 0.4, null, 1.3);
          break;
        case 'doki': { // 隠しキャラ：キラキラ＋ドキドキ
          [880, 1175, 1568, 2093].forEach((f, i) => this._tone(f, 0.22, 'sine', 0.08, t0 + i * 0.06));
          this._tone(140, 0.12, 'sine', 0.16, t0 + 0.05, null, 0.8);
          this._tone(140, 0.12, 'sine', 0.16, t0 + 0.3, null, 0.8);
          break;
        }
        case 'combo':  this._tone(660 * up, 0.14, 'square', 0.08, null, null, 1.3); break;
        case 'notify': // スマホ通知：ピロン
          this._tone(1318, 0.12, 'sine', 0.12, t0);
          this._tone(1760, 0.22, 'sine', 0.1, t0 + 0.1);
          break;
        case 'fanfare': {
          [262, 330, 392, 523].forEach((f, i) => this._tone(f, 0.5, 'square', 0.09, t0 + i * 0.08));
          [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.4, 'triangle', 0.1, t0 + 0.35 + i * 0.09));
          this.cheer(0.8);
          break;
        }
        case 'stageup': {
          [392, 523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.18, 'triangle', 0.1, t0 + i * 0.07));
          break;
        }
      }
    }

    /* 歓声（観客の多さでボリュームが変わる） */
    cheer(vol) {
      if (!this.sfxOn || !this.ctx) return;
      const t = this._now();
      this._noise(1.0, (vol || 0.5) * 0.18, 1500, t, 0.4);
      this._noise(0.8, (vol || 0.5) * 0.1, 3400, t + 0.1, 0.6);
      this._noise(0.5, (vol || 0.5) * 0.06, 800, t + 0.05, 0.5);
    }

    /* 軽量BGM（8ビートのゆるいバンド練習風） */
    startBGM(mode) {
      if (!this.ctx) return;
      if (this.bgmMode === mode && this.bgmTimer) return;
      this.stopBGM();
      this.bgmMode = mode;
      if (!this.bgmOn) return;
      this.bgmStep = 0;
      const bpm = mode === 'menu' ? 92 : 112;
      const stepDur = 60 / bpm / 2;
      const bass = [196, 196, 165, 165, 147, 147, 175, 175]; // G Em(略) C D風
      const melody = {
        menu: [0, 294, 0, 330, 0, 294, 0, 247, 0, 262, 0, 294, 0, 262, 0, 0],
        play: [392, 0, 440, 0, 392, 330, 0, 294, 392, 0, 440, 494, 0, 440, 0, 330],
      };
      const tick = () => {
        if (!this.bgmOn || !this.ctx) return;
        const s = this.bgmStep % 16;
        const bar = (this.bgmStep >> 4) % 2;
        const t = this._now() + 0.02;
        if (s % 2 === 0) this._tone(bass[(s / 2) | 0] / 2, stepDur * 1.8, 'triangle', 0.15, t, this.bgmGain);
        this._noise(0.03, s % 4 === 2 ? 0.045 : 0.028, 6000, t, 3);
        if (this.bgmMode === 'play' && s % 4 === 0) {
          this._tone(70, 0.1, 'sine', 0.2, t, this.bgmGain, 0.5);
        }
        const mel = melody[this.bgmMode || 'menu'];
        const f = mel[s];
        if (f && (this.bgmMode === 'play' || bar === 1)) {
          this._tone(f, stepDur * 1.2, 'square', 0.04, t, this.bgmGain);
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
    setBgm(on) { this.bgmOn = on; if (!on) this.stopBGM(); }
  }

  global.DZAudio = new AudioMan();
})(typeof window !== 'undefined' ? window : globalThis);
