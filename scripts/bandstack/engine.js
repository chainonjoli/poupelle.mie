/* =========================================================
   BAND STACK - ゲームエンジン（盤面ロジック / 描画非依存）
   盤面・ピース・消去判定・連鎖・スコア計算を担当する純ロジック層。
   UIやアニメーションは app.js 側で行う。
   ========================================================= */
(function (global) {
  'use strict';

  const W = 8;            // 盤面の横マス数
  const H = 15;           // 盤面の縦マス数（上2段は非表示のスポーン領域）
  const HIDDEN = 2;       // 非表示段数
  const TYPES = ['guitar', 'drum', 'bass', 'mic']; // 楽器4種
  const NOTE = 'note';    // 音符（ワイルド）
  const ROCK = 'rock';    // 化石（障害物）

  // 回転ごとの2個目セルの相対位置（0:上 1:右 2:下 3:左）
  const ROT_OFFSET = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  /* ---- 乱数（シード付き。チュートリアルの再現用） ---- */
  function makeRng(seed) {
    let s = seed >>> 0 || 123456789;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  class Game {
    constructor(opts = {}) {
      this.rng = makeRng(opts.seed || ((Date.now() & 0xffffff) + 7));
      this.grid = [];
      for (let y = 0; y < H; y++) this.grid.push(new Array(W).fill(null));
      this.queue = [];          // 次ピースのキュー
      this.cur = null;          // 落下中ピース {x,y,rot,cells:[typeA,typeB]}
      this.over = false;
      this.pieces = 0;          // 投下したピース数
      this.typeCount = { guitar: 0, drum: 0, bass: 0, mic: 0 }; // 出現バランス管理
      this.sinceNote = 99;      // 音符の最短出現間隔管理
      this.rockChance = 0;      // 化石の出現率（レベルで上げる）
      this.forcedQueue = (opts.forcedQueue || []).slice(); // チュートリアル用固定ピース
      while (this.queue.length < 2) this.queue.push(this._genPiece());
    }

    /* ---- ピース生成（出現バランスを取った重み付き抽選） ---- */
    _genPiece() {
      if (this.forcedQueue.length) return this.forcedQueue.shift();
      const pick = () => {
        this.sinceNote++;
        if (this.sinceNote > 8 && this.rng() < 0.04) { this.sinceNote = 0; return NOTE; }
        if (this.rockChance > 0 && this.rng() < this.rockChance) return ROCK;
        const max = Math.max(...TYPES.map(t => this.typeCount[t])) + 1;
        const weights = TYPES.map(t => max - this.typeCount[t] + 1);
        let r = this.rng() * weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < TYPES.length; i++) {
          r -= weights[i];
          if (r <= 0) { this.typeCount[TYPES[i]]++; return TYPES[i]; }
        }
        return TYPES[0];
      };
      let a = pick(), b = pick();
      if (a === ROCK && b === ROCK) b = TYPES[Math.floor(this.rng() * 4)]; // 両方化石は禁止
      return [a, b];
    }

    /* ---- スポーン。置けなければゲームオーバー ---- */
    spawn() {
      const cells = this.queue.shift();
      this.queue.push(this._genPiece());
      this.cur = { x: 3, y: HIDDEN, rot: 0, cells };
      if (!this._fits(this.cur.x, this.cur.y, this.cur.rot)) {
        this.over = true;
        return false;
      }
      this.pieces++;
      return true;
    }

    _cellsOf(x, y, rot) {
      const [dx, dy] = ROT_OFFSET[rot];
      return [[x, y], [x + dx, y + dy]];
    }

    _fits(x, y, rot) {
      return this._cellsOf(x, y, rot).every(([cx, cy]) =>
        cx >= 0 && cx < W && cy < H && (cy < 0 || !this.grid[cy][cx]));
    }

    move(dx) {
      if (!this.cur || this.over) return false;
      const { x, y, rot } = this.cur;
      if (this._fits(x + dx, y, rot)) { this.cur.x += dx; return true; }
      return false;
    }

    /* ---- 回転（壁際は左右に蹴り出して補正） ---- */
    rotate(dir = 1) {
      if (!this.cur || this.over) return false;
      const { x, y } = this.cur;
      const nr = (this.cur.rot + dir + 4) % 4;
      for (const kick of [0, -1, 1]) {
        if (this._fits(x + kick, y, nr)) {
          this.cur.x += kick; this.cur.rot = nr; return true;
        }
      }
      return false;
    }

    /* ---- 1段落下。落ちれなければ固定して true を返す ---- */
    stepDown() {
      if (!this.cur || this.over) return { locked: false };
      const { x, y, rot } = this.cur;
      if (this._fits(x, y + 1, rot)) { this.cur.y++; return { locked: false }; }
      return { locked: true };
    }

    /* ---- 即時落下。落ちた段数を返す ---- */
    hardDrop() {
      if (!this.cur || this.over) return 0;
      let d = 0;
      while (this._fits(this.cur.x, this.cur.y + 1, this.cur.rot)) { this.cur.y++; d++; }
      return d;
    }

    ghostY() {
      if (!this.cur) return 0;
      let gy = this.cur.y;
      while (this._fits(this.cur.x, gy + 1, this.cur.rot)) gy++;
      return gy;
    }

    /* ---- 固定。分離落下（片方が宙に浮く場合は下まで落とす） ---- */
    lock() {
      const c = this.cur;
      const pts = this._cellsOf(c.x, c.y, c.rot);
      const placed = [];
      // 下のセルから順に置き、それぞれ独立に落とす
      pts.map((p, i) => ({ x: p[0], y: p[1], t: c.cells[i] }))
        .sort((a, b) => b.y - a.y)
        .forEach(cell => {
          let fy = cell.y;
          while (fy + 1 < H && !this.grid[fy + 1][cell.x]) fy++;
          this.grid[fy][cell.x] = { t: cell.t };
          placed.push({ x: cell.x, y: fy, t: cell.t });
        });
      this.cur = null;
      if (placed.some(p => p.y < HIDDEN)) this.over = true;
      return placed;
    }

    /* ---- 消去判定：同楽器3連結ライン ＋ バンドセット(2×2で4種) ---- */
    findClears() {
      const mark = new Set();
      const runs = [];
      const key = (x, y) => y * W + x;
      const matchable = (cell, t) => cell && (cell.t === t || cell.t === NOTE);

      // 横・縦の3連以上（音符はワイルド。音符だけの列は消えない）
      for (const t of TYPES) {
        for (let y = HIDDEN; y < H; y++) {
          let x = 0;
          while (x < W) {
            if (matchable(this.grid[y][x], t)) {
              let x2 = x, real = 0;
              while (x2 < W && matchable(this.grid[y][x2], t)) {
                if (this.grid[y][x2].t === t) real++;
                x2++;
              }
              if (x2 - x >= 3 && real > 0) {
                runs.push({ t, len: x2 - x });
                for (let i = x; i < x2; i++) mark.add(key(i, y));
              }
              x = x2;
            } else x++;
          }
        }
        for (let x = 0; x < W; x++) {
          let y = HIDDEN;
          while (y < H) {
            if (matchable(this.grid[y][x], t)) {
              let y2 = y, real = 0;
              while (y2 < H && matchable(this.grid[y2][x], t)) {
                if (this.grid[y2][x].t === t) real++;
                y2++;
              }
              if (y2 - y >= 3 && real > 0) {
                runs.push({ t, len: y2 - y });
                for (let i = y; i < y2; i++) mark.add(key(x, i));
              }
              y = y2;
            } else y++;
          }
        }
      }

      // バンドセット：2×2に4種の楽器が全部そろう（音符は不足分を補う）
      const bandsets = [];
      for (let y = HIDDEN; y < H - 1; y++) {
        for (let x = 0; x < W - 1; x++) {
          const cells = [this.grid[y][x], this.grid[y][x + 1], this.grid[y + 1][x], this.grid[y + 1][x + 1]];
          if (cells.some(c => !c || c.t === ROCK)) continue;
          const insts = cells.filter(c => c.t !== NOTE).map(c => c.t);
          const wilds = 4 - insts.length;
          const uniq = new Set(insts);
          if (uniq.size === insts.length && uniq.size + wilds === 4) {
            bandsets.push({ x, y });
            mark.add(key(x, y)); mark.add(key(x + 1, y));
            mark.add(key(x, y + 1)); mark.add(key(x + 1, y + 1));
          }
        }
      }

      // 消えるセルに隣接する化石も一緒に砕ける
      const rocks = [];
      mark.forEach(k => {
        const x = k % W, y = (k / W) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H &&
            this.grid[ny][nx] && this.grid[ny][nx].t === ROCK) {
            rocks.push(key(nx, ny));
          }
        });
      });
      rocks.forEach(k => mark.add(k));

      if (!mark.size) return null;
      const cells = [...mark].map(k => ({ x: k % W, y: (k / W) | 0, t: this.grid[(k / W) | 0][k % W].t }));
      return { cells, runs, bandsets };
    }

    clearCells(cells) {
      cells.forEach(c => { this.grid[c.y][c.x] = null; });
    }

    /* ---- 重力：各列を下へ詰める。動いたセルを返す ---- */
    applyGravity() {
      const moved = [];
      for (let x = 0; x < W; x++) {
        let write = H - 1;
        for (let y = H - 1; y >= 0; y--) {
          if (this.grid[y][x]) {
            if (write !== y) {
              this.grid[write][x] = this.grid[y][x];
              this.grid[y][x] = null;
              moved.push({ x, from: y, to: write });
            }
            write--;
          }
        }
      }
      return moved;
    }

    /* ---- 盤面の統計（スキル用） ---- */
    countTypes() {
      const c = { guitar: 0, drum: 0, bass: 0, mic: 0 };
      for (let y = HIDDEN; y < H; y++) for (let x = 0; x < W; x++) {
        const cell = this.grid[y][x];
        if (cell && c[cell.t] !== undefined) c[cell.t]++;
      }
      return c;
    }

    mostCommonType() {
      const c = this.countTypes();
      let best = TYPES[0];
      for (const t of TYPES) if (c[t] > c[best]) best = t;
      return best;
    }

    leastCommonType() {
      const c = this.countTypes();
      const present = TYPES.filter(t => c[t] > 0);
      if (!present.length) return null;
      let best = present[0];
      for (const t of present) if (c[t] < c[best]) best = t;
      return best;
    }

    /* ---- 危険度（上から3段以内にブロックがあるか） ---- */
    dangerLevel() {
      for (let y = HIDDEN; y < HIDDEN + 3; y++) {
        for (let x = 0; x < W; x++) if (this.grid[y][x]) return true;
      }
      return false;
    }

    stackHeight() {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) if (this.grid[y][x]) return H - y;
      }
      return 0;
    }
  }

  /* ---- スコア計算（1連鎖ステップ分） ---- */
  function scoreStep(clear, chain, opts = {}) {
    const mult = opts.scoreMult || 1;
    const chainMult = Math.min(chain, 8);
    let score = clear.cells.length * 10 * chainMult;
    score += clear.bandsets.length * 250 * chainMult;
    clear.runs.forEach(r => { if (r.len >= 4) score += (r.len - 3) * 40; });
    score = Math.round(score * mult);
    const fanRate = opts.fanRate || 1;
    const fans = Math.round((clear.cells.length * 3 * chainMult + clear.bandsets.length * 80) * fanRate);
    let gauge = clear.cells.length * 5 + clear.bandsets.length * 18 + (chain - 1) * 6;
    gauge = Math.round(gauge * (opts.gaugeMult || 1));
    return { score, fans, gauge };
  }

  const api = { W, H, HIDDEN, TYPES, NOTE, ROCK, Game, scoreStep, makeRng };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.BSEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
