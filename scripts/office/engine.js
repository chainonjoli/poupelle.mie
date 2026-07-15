/* =========================================================
   PIXEL OFFICE - シミュレーションエンジン（描画非依存）
   マップ・経路探索・AI社員の状態機械を担当する純ロジック層。
   描画とUIは app.js / sprites.js 側で行う。
   時間の単位は「オフィス内の分」。×1速度で実時間1秒=1分。
   ========================================================= */
(function (global) {
  'use strict';

  const DATA = (typeof module !== 'undefined' && module.exports)
    ? require('./data.js')
    : global.OfficeData;

  /* ---- マップ ----
     # 壁  W 窓  . 床  D デスク  1-6 座席  T 会議テーブル
     m コーヒーメーカー  v 自販機  w ホワイトボード
     p 観葉植物  b 本棚  s サーバーラック */
  const MAP_ROWS = [
    '###WW####WW####WW#####',
    '#........p.......p...#',
    '#..DDD..DDD..DDD.....#',
    '#...1....2....3....s.#',
    '#..................s.#',
    '#..DDD..DDD..DDD.....#',
    '#...4....5....6......#',
    '#....................#',
    '#p..................p#',
    '#w..TTT..........m...#',
    '#...TTT..........v...#',
    '#....................#',
    '#b.................b.#',
    '#....................#',
    '######################'
  ];
  const COLS = MAP_ROWS[0].length;
  const ROWS = MAP_ROWS.length;

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return '#';
    return MAP_ROWS[y].charAt(x);
  }
  function isWalkable(x, y) {
    const t = tileAt(x, y);
    return t === '.' || (t >= '1' && t <= '6');
  }

  /* 座席(1〜6)・設備ごとの立ち位置を走査して拾う */
  const SEATS = {};
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = tileAt(x, y);
      if (t >= '1' && t <= '6') SEATS[+t] = { x, y };
    }
  }
  /* 立ち位置と、そのとき向く方向 */
  const SPOTS = {
    coffee:     { x: 16, y: 9,  dir: 'right' },
    vending:    { x: 16, y: 10, dir: 'right' },
    whiteboard: { x: 2,  y: 9,  dir: 'left' }
  };
  const MEETING_SPOTS = [
    { x: 3, y: 9,  dir: 'right' }, { x: 3, y: 10, dir: 'right' },
    { x: 7, y: 9,  dir: 'left'  }, { x: 7, y: 10, dir: 'left'  },
    { x: 4, y: 8,  dir: 'down'  }, { x: 6, y: 8,  dir: 'down'  },
    { x: 4, y: 11, dir: 'up'    }, { x: 6, y: 11, dir: 'up'    }
  ];

  /* ---- 乱数（シード付き。テストの再現用） ---- */
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ---- 経路探索（BFS。マップが小さいのでこれで十分） ---- */
  function findPath(sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    if (!isWalkable(gx, gy)) return null;
    const prev = new Array(COLS * ROWS).fill(-1);
    const queue = [sy * COLS + sx];
    prev[sy * COLS + sx] = sy * COLS + sx;
    const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    while (queue.length) {
      const cur = queue.shift();
      const cx = cur % COLS, cy = (cur / COLS) | 0;
      if (cx === gx && cy === gy) {
        const path = [];
        let node = cur;
        while (node !== sy * COLS + sx) {
          path.push({ x: node % COLS, y: (node / COLS) | 0 });
          node = prev[node];
        }
        return path.reverse();
      }
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!isWalkable(nx, ny)) continue;
        const ni = ny * COLS + nx;
        if (prev[ni] !== -1) continue;
        prev[ni] = cur;
        queue.push(ni);
      }
    }
    return null;
  }

  const MOVE_SPEED = 3.4;      /* タイル/分 */
  const EMOTE_LIFE = 4;        /* エモート表示時間（分） */

  /* ---- AI社員 ---- */
  class Agent {
    constructor(def, rng) {
      this.def = def;
      this.rng = rng;
      this.seat = SEATS[def.desk];
      this.x = this.seat.x;
      this.y = this.seat.y;
      this.dir = 'up';
      this.state = 'working';
      this.sitting = true;
      this.path = [];
      this.after = null;        /* walking終了後に入る状態 */
      this.afterSpot = null;    /* 到着後に向く方向など */
      this.stateT = 0;          /* 現在の休憩などの残り時間（分） */
      this.stateLabel = '';
      this.chatPartner = null;
      this.task = null;
      this.doneCount = 0;
      this.emote = null;        /* {icon, t} */
      this.emoteTimer = this.range(8, 20);
      this.walkPhase = 0;       /* 歩行アニメ用の累積距離 */
      this.startTask();
    }

    range(min, max) { return min + this.rng() * (max - min); }
    pick(arr) { return arr[(this.rng() * arr.length) | 0]; }

    startTask() {
      const text = this.pick(this.def.tasks)
        .replace('{n}', String(2 + ((this.rng() * 120) | 0)));
      this.task = { text, total: this.range(15, 45), done: 0 };
      this.state = 'working';
      this.sitting = true;
      this.dir = 'up';
      this.stateLabel = '';
      return this.task;
    }

    /* 目的地へ歩き、到着したら after 状態に入る */
    goTo(spot, after, minutes, label) {
      const path = findPath(Math.round(this.x), Math.round(this.y), spot.x, spot.y);
      if (path === null) { this.startTask(); return false; }
      this.sitting = false;
      this.path = path;
      this.state = 'walking';
      this.after = after;
      this.afterSpot = spot;
      this.stateT = minutes;
      this.stateLabel = label;
      return true;
    }

    setEmote(icon) { this.emote = { icon, t: EMOTE_LIFE }; }

    /* 状態表示用テキスト（サイドパネルで使う） */
    statusText() {
      if (this.state === 'working') return this.task.text;
      if (this.state === 'walking') return '🚶 移動中…';
      if (this.state === 'chat' && this.chatPartner) {
        return '💬 ' + this.chatPartner.def.name + 'と相談中';
      }
      if (this.state === 'meeting') return '📋 ミーティング中';
      return this.stateLabel || '…';
    }

    progress() {
      return this.state === 'working' ? this.task.done / this.task.total : null;
    }

    update(dt, office) {
      if (this.emote) {
        this.emote.t -= dt;
        if (this.emote.t <= 0) this.emote = null;
      }

      if (this.state === 'working') {
        this.task.done += dt;
        this.emoteTimer -= dt;
        if (this.emoteTimer <= 0) {
          this.setEmote(this.pick(DATA.WORK_EMOTES));
          this.emoteTimer = this.range(10, 22);
        }
        if (this.task.done >= this.task.total) {
          this.doneCount++;
          office.log('✅', this.def.name + '「' + this.task.text.replace(/中$/, '') + '」完了。' +
            this.pick(DATA.DONE_FLAVORS));
          this.chooseNext(office);
        }
        return;
      }

      if (this.state === 'walking') {
        let budget = dt * MOVE_SPEED;
        while (budget > 0 && this.path.length) {
          const next = this.path[0];
          const dx = next.x - this.x, dy = next.y - this.y;
          const dist = Math.abs(dx) + Math.abs(dy);
          this.dir = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
          if (dist <= budget) {
            this.x = next.x; this.y = next.y;
            this.path.shift();
            budget -= dist;
            this.walkPhase += dist;
          } else {
            const step = budget / dist;
            this.x += dx * step; this.y += dy * step;
            this.walkPhase += budget;
            budget = 0;
          }
        }
        if (!this.path.length) this.arrive(office);
        return;
      }

      /* 滞在系の状態（coffee / vending / chat / whiteboard / meeting / wander） */
      this.stateT -= dt;
      if (this.state === 'chat' && this.emote === null && this.rng() < dt * 0.4) {
        this.setEmote('💬');
      }
      if (this.stateT <= 0) this.finishBreak(office);
    }

    arrive(office) {
      if (this.after === 'seat') {
        this.startTask();
        office.log('🗒️', this.def.name + '「' + this.task.text + '」に着手');
        return;
      }
      this.state = this.after;
      if (this.afterSpot && this.afterSpot.dir) this.dir = this.afterSpot.dir;
      if (this.state === 'coffee') this.setEmote('☕');
      if (this.state === 'vending') this.setEmote('🥤');
      if (this.state === 'whiteboard') this.setEmote('🖊️');
      if (this.state === 'meeting') this.setEmote('📋');
    }

    finishBreak(office) {
      if (this.state === 'chat' && this.chatPartner) {
        const partner = this.chatPartner;
        this.chatPartner = null;
        if (partner.chatPartner === this) partner.chatPartner = null;
      }
      this.goTo(this.seat, 'seat', 0, '');
    }

    /* タスク完了後の行動を選ぶ */
    chooseNext(office) {
      if (this.rng() < 0.55) {
        this.startTask();
        office.log('🗒️', this.def.name + '「' + this.task.text + '」に着手');
        return;
      }
      const total = DATA.BREAKS.reduce((s, b) => s + b.weight, 0);
      let roll = this.rng() * total;
      let br = DATA.BREAKS[0];
      for (const b of DATA.BREAKS) { roll -= b.weight; if (roll <= 0) { br = b; break; } }
      const minutes = this.range(br.minutes[0], br.minutes[1]);

      if (br.type === 'coffee' || br.type === 'vending' || br.type === 'whiteboard') {
        this.goTo(SPOTS[br.type], br.type, minutes, br.label);
        office.log('🚶', this.def.name + ' が席を立った（' + br.label.replace(/中$/, '') + 'へ）');
      } else if (br.type === 'chat') {
        const partner = office.agents.find(
          (a) => a !== this && a.state === 'working' && !a.chatPartner
        );
        if (!partner) { this.startTask(); return; }
        /* 相手の席の隣（歩ける床）まで行って立ち話。相手は座ったまま応対する */
        const cand = [
          { x: partner.seat.x - 1, y: partner.seat.y, dir: 'right' },
          { x: partner.seat.x + 1, y: partner.seat.y, dir: 'left' },
          { x: partner.seat.x, y: partner.seat.y + 1, dir: 'up' }
        ].filter((s) => isWalkable(s.x, s.y));
        if (!cand.length) { this.startTask(); return; }
        this.chatPartner = partner;
        partner.chatPartner = this;
        this.goTo(this.pick(cand), 'chat', minutes, br.label);
        office.log('💬', this.def.name + ' が ' + partner.def.name + ' に相談しに行った');
      } else { /* wander: 適当な床タイルへ散歩 */
        let spot = null;
        for (let i = 0; i < 30 && !spot; i++) {
          const x = 1 + ((this.rng() * (COLS - 2)) | 0);
          const y = 1 + ((this.rng() * (ROWS - 2)) | 0);
          if (isWalkable(x, y)) spot = { x, y };
        }
        if (!spot) { this.startTask(); return; }
        this.goTo(spot, 'wander', minutes, br.label);
      }
    }
  }

  /* ---- オフィス全体 ---- */
  class Office {
    constructor(opts) {
      opts = opts || {};
      this.rng = makeRng(opts.seed !== undefined ? opts.seed : (Date.now() & 0xffffffff));
      this.clock = 9 * 60;   /* 9:00 スタート（分） */
      this.day = 1;
      this.events = [];      /* {time, icon, text} 新しい順 */
      this.meetingTimer = 60 + this.rng() * 60;
      this.meetingLeft = 0;
      this.agents = DATA.AGENTS.map((def) => new Agent(def, this.rng));
    }

    clockText() {
      const h = ((this.clock / 60) | 0) % 24;
      const m = (this.clock % 60) | 0;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }

    log(icon, text) {
      this.events.unshift({ time: this.clockText(), icon, text });
      if (this.events.length > 60) this.events.length = 60;
    }

    /* 定例ミーティング: 作業中の社員を最大3人集める */
    startMeeting() {
      const attendees = this.agents.filter((a) => a.state === 'working').slice(0, 3);
      if (attendees.length < 2) return false;
      const spots = MEETING_SPOTS.slice();
      const duration = 20 + this.rng() * 15;
      attendees.forEach((a, i) => {
        a.goTo(spots[i], 'meeting', duration, '📋 ミーティング中');
      });
      this.meetingLeft = duration;
      this.log('📋', 'スタンドアップ開始: ' + attendees.map((a) => a.def.name).join('・'));
      return true;
    }

    update(dt) {
      this.clock += dt;
      if (this.clock >= 24 * 60) { this.clock -= 24 * 60; this.day++; }

      if (this.meetingLeft > 0) {
        this.meetingLeft -= dt;
        if (this.meetingLeft <= 0) this.log('📋', 'ミーティング終了。それぞれ持ち場へ');
      } else {
        this.meetingTimer -= dt;
        if (this.meetingTimer <= 0) {
          this.startMeeting();
          this.meetingTimer = 90 + this.rng() * 60;
        }
      }

      for (const a of this.agents) a.update(dt, this);
    }
  }

  const OfficeEngine = {
    MAP_ROWS, COLS, ROWS, SEATS, SPOTS, MEETING_SPOTS,
    tileAt, isWalkable, findPath, makeRng, Agent, Office
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = OfficeEngine;
  else global.OfficeEngine = OfficeEngine;
})(typeof window !== 'undefined' ? window : globalThis);
