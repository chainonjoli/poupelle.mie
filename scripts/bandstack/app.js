/* =========================================================
   BAND STACK - メインアプリケーション
   画面遷移・描画・入力・スキル・演出・チュートリアル・保存を統括。
   ロジックは engine.js、データは data.js、音は audio.js に分離。
   ========================================================= */
(function () {
  'use strict';

  const E = window.BSEngine;
  const D = window.BSData;
  const A = window.BSAudio;
  const C = window.BSChars;
  const { W, H, HIDDEN } = E;
  const ROT_OFFSET = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('ja-JP');

  // 古いブラウザ向け roundRect ポリフィル
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  /* ================= セーブデータ ================= */
  const defaultSave = () => ({
    hiScore: 0, bestFans: 0, totalFans: 0, plays: 0, maxCombo: 0,
    charId: 'tyra', venueId: 'street',
    settings: { sfx: true, bgm: true, buttons: true },
    challenges: {}, tutorialDone: false,
  });
  let save = defaultSave();
  try {
    const raw = localStorage.getItem(D.SAVE_KEY);
    if (raw) save = Object.assign(defaultSave(), JSON.parse(raw));
    save.settings = Object.assign(defaultSave().settings, save.settings);
  } catch (e) { /* プライベートモード等では既定値で続行 */ }
  function persist() {
    try { localStorage.setItem(D.SAVE_KEY, JSON.stringify(save)); } catch (e) { /* 保存不可でも続行 */ }
  }

  /* ================= 画面遷移 ================= */
  let currentScreen = 'splash';
  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
    currentScreen = name;
    if (name === 'home' || name === 'title') A.startBGM('menu');
  }

  /* ================= キャラクター配置ヘルパ ================= */
  function placeBand(containerId, opts = {}) {
    const el = $(containerId);
    el.innerHTML = '';
    D.CHARACTERS.forEach(ch => {
      const div = document.createElement('div');
      div.className = 'bandchar';
      div.dataset.chara = ch.id;
      div.innerHTML = C.charSVG(ch.id);
      if (opts.names) {
        const nm = document.createElement('span');
        nm.className = 'charname';
        nm.textContent = ch.name;
        div.appendChild(nm);
      }
      if (opts.center === ch.id) div.classList.add('center');
      el.appendChild(div);
    });
  }

  /* ================= ピース描画（canvas） ================= */
  const P = D.PIECES;
  function drawCell(ctx, px, py, s, type, opt = {}) {
    const p = P[type];
    if (!p) return;
    const r = Math.max(3, s * 0.18);
    const pad = Math.max(1, s * 0.04);
    ctx.save();
    if (opt.ghost) ctx.globalAlpha = 0.22;
    if (opt.flash) {
      const on = (Math.floor(performance.now() / 70) % 2) === 0;
      if (on) { ctx.globalAlpha = 1; ctx.filter = 'brightness(2.2)'; }
      else ctx.globalAlpha = 0.65;
    }
    // 本体
    ctx.beginPath();
    ctx.roundRect(px + pad, py + pad, s - pad * 2, s - pad * 2, r);
    const g = ctx.createLinearGradient(px, py, px, py + s);
    g.addColorStop(0, p.color);
    g.addColorStop(1, p.dark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, s * 0.05);
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.stroke();
    // ハイライト
    ctx.beginPath();
    ctx.roundRect(px + pad + s * 0.1, py + pad + s * 0.07, s * 0.55, s * 0.16, s * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.fill();
    // アイコン（色覚特性対応：形でも区別）
    drawGlyph(ctx, type, px + s / 2, py + s / 2, s);
    ctx.restore();
  }

  function drawGlyph(ctx, type, cx, cy, s) {
    const u = s * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = Math.max(1.6, s * 0.09);
    ctx.lineCap = 'round';
    switch (P[type].glyph) {
      case 'pick': // ギター：ピック（下向き三角）
        ctx.beginPath();
        ctx.moveTo(-u * 0.42, -u * 0.34);
        ctx.quadraticCurveTo(0, -u * 0.62, u * 0.42, -u * 0.34);
        ctx.quadraticCurveTo(u * 0.34, u * 0.22, 0, u * 0.52);
        ctx.quadraticCurveTo(-u * 0.34, u * 0.22, -u * 0.42, -u * 0.34);
        ctx.fill();
        break;
      case 'drum': // ドラム：太鼓＋スティック
        ctx.beginPath();
        ctx.ellipse(0, u * 0.1, u * 0.46, u * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-u * 0.5, -u * 0.5); ctx.lineTo(0, u * 0.02);
        ctx.moveTo(u * 0.5, -u * 0.5); ctx.lineTo(0, u * 0.02);
        ctx.stroke();
        break;
      case 'wave': // ベース：波形
        ctx.beginPath();
        ctx.moveTo(-u * 0.5, 0);
        ctx.lineTo(-u * 0.25, -u * 0.38);
        ctx.lineTo(0, u * 0.38);
        ctx.lineTo(u * 0.25, -u * 0.38);
        ctx.lineTo(u * 0.5, 0);
        ctx.stroke();
        break;
      case 'mic': // マイク
        ctx.beginPath();
        ctx.arc(0, -u * 0.18, u * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, u * 0.12); ctx.lineTo(0, u * 0.5);
        ctx.moveTo(-u * 0.2, u * 0.5); ctx.lineTo(u * 0.2, u * 0.5);
        ctx.stroke();
        break;
      case 'note': // 音符
        ctx.fillStyle = '#3a2f45'; ctx.strokeStyle = '#3a2f45';
        ctx.beginPath();
        ctx.ellipse(-u * 0.16, u * 0.3, u * 0.24, u * 0.18, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(u * 0.06, u * 0.26); ctx.lineTo(u * 0.06, -u * 0.44);
        ctx.quadraticCurveTo(u * 0.36, -u * 0.36, u * 0.44, -u * 0.1);
        ctx.stroke();
        break;
      case 'fossil': // 化石：アンモナイト
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4.2; a += 0.25) {
          const rr = u * 0.09 + a * u * 0.055;
          const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  /* ================= ゲーム本体 ================= */
  const game = {
    g: null,             // エンジン
    mode: 'endless',     // endless | challenge | tutorial
    challenge: null,
    venue: D.VENUES[0],
    chara: D.CHARACTERS[0],
    phase: 'idle',       // idle | drop | resolve | cutin | over
    paused: false,
    score: 0, fans: 0, level: 1, chain: 0, maxCombo: 0,
    gauge: 0, gaugeWasFull: false,
    dropAcc: 0, lastTime: 0, softDrop: false,
    fx: { gaugeMult: 1, scoreMult: 1, gaugeUntil: 0, scoreUntil: 0 },
    timeLeft: 0,
    tutorialStep: -1,
    over: false,
    raf: 0,
    runId: 0, // リスタート後に古い非同期処理を無効化するためのトークン
  };

  const canvas = $('board-canvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = $('next-canvas');
  const nctx = nextCanvas.getContext('2d');
  const hctx = $('hold-canvas').getContext('2d');
  let cell = 24, dpr = 1;

  function fitCanvas() {
    const wrap = $('board-wrap');
    const rect = wrap.getBoundingClientRect();
    const visH = H - HIDDEN;
    cell = Math.floor(Math.min((rect.width - 8) / W, (rect.height - 10) / visH));
    cell = Math.max(16, cell);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * cell * dpr;
    canvas.height = visH * cell * dpr;
    canvas.style.width = (W * cell) + 'px';
    canvas.style.height = (visH * cell) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { if (currentScreen === 'game') fitCanvas(); });

  /* ---- 開始 ---- */
  function startGame(mode, challenge) {
    game.mode = mode;
    game.challenge = challenge || null;
    game.venue = D.VENUES.find(v => v.id === (challenge ? challenge.venue : save.venueId)) || D.VENUES[0];
    game.chara = D.CHARACTERS.find(c => c.id === save.charId) || D.CHARACTERS[0];
    game.g = new E.Game(mode === 'tutorial'
      ? { seed: 777, forcedQueue: D.TUTORIAL_QUEUE.map(p => p.slice()) }
      : {});
    game.score = 0; game.fans = 0; game.level = 1; game.chain = 0; game.maxCombo = 0;
    game.gauge = 0; game.gaugeWasFull = false;
    game.fx = { gaugeMult: 1, scoreMult: 1, gaugeUntil: 0, scoreUntil: 0 };
    game.over = false; game.paused = false;
    game.dropAcc = 0; game.softDrop = false;
    game.timeLeft = challenge ? challenge.time : 0;
    game.tutorialStep = -1;
    game.runId++;
    flashCells = [];

    buildStage();
    const pop = $('combo-pop');
    pop.classList.remove('show', 'bandset');
    $('crowd').classList.remove('hype');
    $('skill-cutin').hidden = true;
    $('callout').hidden = true;
    calloutLast = 0;
    game.wasDanger = false;
    show('game');
    fitCanvas();
    updateHUD();
    setGauge(0);
    $('overlay-pause').hidden = true;
    $('challenge-hud').hidden = !challenge;
    if (challenge) {
      $('challenge-goal').textContent = `目標 ${fmt(challenge.targetFans)}人`;
      updateChallengeTimer();
    }
    $('tutorial-bar').hidden = mode !== 'tutorial';
    $('btn-hold').style.visibility = mode === 'tutorial' ? 'hidden' : 'visible';
    $('danger-flash').classList.remove('on');
    A.startBGM('play');

    if (mode === 'tutorial') {
      $('tutorial-chara').innerHTML = C.charSVG('tyra');
      advanceTutorial();
    } else {
      setTimeout(() => { if (!game.over && !game.paused) showCallout('start'); }, 700);
    }
    game.g.spawn();
    game.phase = 'drop';
    game.lastTime = performance.now();
    cancelAnimationFrame(game.raf);
    game.raf = requestAnimationFrame(loop);
  }

  /* ---- 会場・ステージ構築 ---- */
  function buildStage() {
    const v = game.venue;
    const bg = $('stage-bg');
    bg.style.background = `linear-gradient(180deg, ${v.sky[0]}, ${v.sky[1]} 55%, ${v.sky[2]})`;
    bg.classList.remove('hype');
    const spots = $('spotlights');
    spots.innerHTML = '';
    for (let i = 0; i < v.fx.spotlights; i++) {
      const s = document.createElement('div');
      s.className = 'spot s' + i;
      spots.appendChild(s);
    }
    // レーザー（アリーナ以上）
    const oldLasers = bg.querySelector('.lasers');
    if (oldLasers) oldLasers.remove();
    if (v.fx.laser) {
      const lasers = document.createElement('div');
      lasers.className = 'lasers';
      lasers.style.setProperty('--laser-color', v.accent);
      const n = v.id === 'dome' ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const l = document.createElement('div');
        l.className = 'laser';
        l.style.left = (20 + i * (60 / Math.max(1, n - 1))) + '%';
        lasers.appendChild(l);
      }
      bg.appendChild(lasers);
    }
    const crowd = $('crowd');
    crowd.innerHTML = '';
    crowd.classList.remove('hype');
    crowd.style.setProperty('--penlight', v.accent);
    for (let i = 0; i < v.crowd; i++) {
      const f = document.createElement('div');
      f.className = 'fan';
      f.style.height = (18 + Math.random() * 14) + 'px';
      crowd.appendChild(f);
    }
    placeBand('stage-row', { names: true, center: game.chara.id });
    const skill = game.chara.skill;
    $('btn-skill').title = `${skill.name}：${skill.desc}`;
  }

  /* ---- メインループ ---- */
  function loop(now) {
    game.raf = requestAnimationFrame(loop);
    const dt = Math.min(now - game.lastTime, 120);
    game.lastTime = now;
    if (game.paused || game.over) { render(); return; }

    // スキル効果の期限
    if (game.fx.gaugeMult > 1 && now > game.fx.gaugeUntil) game.fx.gaugeMult = 1;
    if (game.fx.scoreMult > 1 && now > game.fx.scoreUntil) {
      game.fx.scoreMult = 1;
      $('crowd').classList.remove('hype');
      $('stage-bg').classList.remove('hype');
    }

    // チャレンジの残り時間
    if (game.challenge && game.phase !== 'idle') {
      game.timeLeft -= dt / 1000;
      updateChallengeTimer();
      if (game.timeLeft <= 0) { game.timeLeft = 0; endRun(); return; }
    }

    if (game.phase === 'drop' && game.g.cur) {
      const speed = game.mode === 'tutorial' ? 1100 : D.LEVELS[game.level - 1].speed;
      game.dropAcc += dt * (game.softDrop ? 14 : 1);
      if (game.dropAcc >= speed) {
        game.dropAcc = 0;
        const r = game.g.stepDown();
        if (r.locked) lockAndResolve();
        else if (game.softDrop) addScore(1);
      }
    }
    render();
  }

  /* ---- 固定→連鎖解決（時間差アニメーション） ----
     fromSkill=true のときはピースを固定せず、盤面変化後の連鎖だけ解決し、
     落下中のピースを維持したまま復帰する。 */
  let flashCells = [];
  async function lockAndResolve(fromSkill) {
    if (game.phase === 'resolve') return; // 二重起動防止
    const run = game.runId;
    if (!fromSkill) {
      game.g.lock();
      A.sfx('land');
      fireTutorial('lock');
      if (game.g.over) { endRun(); return; }
    }
    game.phase = 'resolve';
    game.chain = 0;
    let clear;
    while ((clear = game.g.findClears())) {
      game.chain++;
      game.maxCombo = Math.max(game.maxCombo, game.chain);
      flashCells = clear.cells;
      render();
      // 消去音：含まれる楽器の音を重ねる（演奏になる）
      const types = new Set(clear.cells.map(c => c.t));
      let delay = 0;
      ['drum', 'bass', 'guitar', 'mic', 'note', 'rock'].forEach(t => {
        if (types.has(t)) { setTimeout(() => A.sfx('clear-' + t, { combo: game.chain }), delay); delay += 60; }
      });
      if (clear.bandsets.length) {
        A.sfx('bandset');
        popCombo('バンドセット!!', true);
        reactBand('superjoy', 900);
        spawnConfetti(26);
        showCallout('bandset', { important: true });
      } else if (game.chain >= 3) {
        A.sfx('combo', { combo: game.chain });
        popCombo(game.chain + ' コンボ!');
        reactChar(game.chara.id, 'joy');
        showCallout('bigcombo', { important: true });
      } else if (game.chain === 2) {
        A.sfx('combo', { combo: game.chain });
        popCombo(game.chain + ' コンボ!');
        reactChar(game.chara.id, 'joy');
        showCallout('combo');
      } else {
        reactChar(randomCharId(), 'joy');
      }
      const gain = E.scoreStep(clear, game.chain, {
        fanRate: game.venue.fanRate,
        scoreMult: game.fx.scoreMult,
        gaugeMult: game.fx.gaugeMult,
      });
      addScore(gain.score);
      addFans(gain.fans);
      addGauge(gain.gauge);
      fireTutorial('clear');
      if (clear.bandsets.length) fireTutorial('bandset');

      await wait(320);
      if (game.runId !== run || game.over) return; // リスタート/終了された
      game.g.clearCells(clear.cells);
      flashCells = [];
      game.g.applyGravity();
      render();
      await wait(140);
      if (game.runId !== run || game.over) return;
    }
    game.chain = 0;

    // レベルアップ判定（チュートリアル以外）
    if (game.mode !== 'tutorial') {
      const lv = Math.min(1 + Math.floor(game.g.pieces / D.PIECES_PER_LEVEL), D.LEVELS.length);
      if (lv !== game.level) {
        game.level = lv;
        game.g.rockChance = D.LEVELS[lv - 1].rock;
        A.sfx('levelup');
        popCombo('LEVEL ' + lv + '!');
        showCallout('levelup');
      }
    }

    // 危険演出
    const danger = game.g.dangerLevel();
    $('danger-flash').classList.toggle('on', danger);
    document.querySelectorAll('#stage-row .bandchar').forEach(el => {
      el.classList.toggle('pinch', danger);
    });
    if (danger) {
      A.sfx('danger');
      if (!game.wasDanger) showCallout('danger', { important: true });
    }
    game.wasDanger = danger;

    updateHUD();
    if (fromSkill && game.g.cur) {
      // スキル解決後は落下中のピースを維持して復帰。
      // 万一グリッドと重なっていたら上に逃がす。
      const g = game.g;
      while (!g._fits(g.cur.x, g.cur.y, g.cur.rot) && g.cur.y > 0) g.cur.y--;
      game.phase = 'drop';
      return;
    }
    if (!game.g.spawn()) { endRun(); return; }
    game.dropAcc = 0;
    game.softDrop = false;
    game.phase = 'drop';
  }

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---- スコア・ファン・ゲージ ---- */
  function addScore(n) { game.score += n; $('hud-score').textContent = fmt(game.score); }
  function addFans(n) {
    game.fans += n;
    $('hud-fans').textContent = fmt(game.fans);
    if (game.fans > 0 && n > 30) $('crowd').classList.add('hype');
  }
  function addGauge(n) {
    game.gauge = Math.min(100, game.gauge + n);
    setGauge(game.gauge);
  }
  function setGauge(v) {
    $('gauge-fill').style.width = v + '%';
    const full = v >= 100;
    // チュートリアル中はスキル練習ステップまでボタンをロック
    const tutorialLock = game.mode === 'tutorial' &&
      (D.TUTORIAL_STEPS[game.tutorialStep] || {}).goal !== 'skill';
    $('btn-skill').disabled = !full || tutorialLock;
    document.querySelector('.live-gauge').classList.toggle('full', full);
    const centerEl = document.querySelector(`#stage-row .bandchar[data-chara="${game.chara.id}"]`);
    if (centerEl) centerEl.classList.toggle('skillready', full);
    if (full && !game.gaugeWasFull) {
      A.sfx('gaugefull');
      if (game.mode !== 'tutorial') showCallout('skillready', { charId: game.chara.id, important: true });
    }
    game.gaugeWasFull = full;
  }

  function updateHUD() {
    $('hud-score').textContent = fmt(game.score);
    $('hud-fans').textContent = fmt(game.fans);
    $('hud-level').textContent = game.level;
    drawNext();
    updateHoldUI();
  }

  function updateChallengeTimer() {
    const t = Math.max(0, Math.ceil(game.timeLeft));
    $('challenge-time').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    $('challenge-hud').classList.toggle('urgent', t <= 15);
    $('challenge-goal').textContent =
      `${fmt(Math.min(game.fans, game.challenge.targetFans))}/${fmt(game.challenge.targetFans)}人`;
  }

  /* ---- 演出 ---- */
  function popCombo(text, isBandset) {
    const el = $('combo-pop');
    el.textContent = text;
    el.classList.toggle('bandset', !!isBandset);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function reactChar(id, mood, dur = 600) {
    const el = document.querySelector(`#stage-row .bandchar[data-chara="${id}"]`);
    if (!el) return;
    el.classList.add(mood);
    setTimeout(() => el.classList.remove(mood), dur);
  }
  function reactBand(mood, dur = 800) {
    document.querySelectorAll('#stage-row .bandchar').forEach(el => {
      el.classList.add(mood);
      setTimeout(() => el.classList.remove(mood), dur);
    });
  }
  function randomCharId() {
    return D.CHARACTERS[Math.floor(Math.random() * D.CHARACTERS.length)].id;
  }

  /* ---- 4人の掛け合い吹き出し ---- */
  let calloutLast = 0;
  function showCallout(event, opts = {}) {
    const lines = D.CALLOUTS[event];
    if (!lines) return;
    const now = performance.now();
    const cooldown = opts.important ? 1200 : 4000;
    if (now - calloutLast < cooldown) return;
    calloutLast = now;
    let pick;
    if (opts.charId) {
      pick = lines.find(l => l[0] === opts.charId) || lines[Math.floor(Math.random() * lines.length)];
    } else {
      pick = lines[Math.floor(Math.random() * lines.length)];
    }
    const ch = D.CHARACTERS.find(c => c.id === pick[0]);
    const el = $('callout');
    $('callout-name').textContent = ch.name;
    $('callout-name').style.color = ch.theme;
    $('callout-text').textContent = pick[1];
    el.hidden = true;
    void el.offsetWidth;
    el.hidden = false;
    reactChar(ch.id, 'joy');
    clearTimeout(showCallout._t);
    showCallout._t = setTimeout(() => { el.hidden = true; }, 2000);
  }

  /* ---- ホールド ---- */
  function inputHold() {
    if (game.phase !== 'drop' || game.paused || game.over) return;
    if (game.mode === 'tutorial') return; // チュートリアルでは混乱を避けるため無効
    if (game.g.holdSwap()) {
      A.sfx('hold');
      updateHoldUI();
      drawNext();
      render();
    }
  }
  function updateHoldUI() {
    const g = game.g;
    if (!g) return;
    $('btn-hold').classList.toggle('used', !g.canHold);
    hctx.setTransform(2, 0, 0, 2, 0, 0);
    hctx.clearRect(0, 0, 30, 30);
    if (g.holdPiece) {
      drawCell(hctx, 1, 1, 13, g.holdPiece[1]);
      drawCell(hctx, 1, 15, 13, g.holdPiece[0]);
    }
  }

  function spawnConfetti(n) {
    if (!game.venue.fx.confetti && game.mode !== 'tutorial') n = Math.min(n, 10);
    const host = $('screen-game');
    const colors = ['#ff5f7a', '#ffc93c', '#56c8ee', '#58d68d', '#c86bff', '#fff'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.4 + Math.random() * 1.2) + 's';
      p.style.animationDelay = (Math.random() * 0.3) + 's';
      host.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }

  /* ---- 描画 ---- */
  function render() {
    const visH = H - HIDDEN;
    ctx.clearRect(0, 0, W * cell, visH * cell);
    // グリッド線
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    ctx.lineWidth = 1;
    for (let x = 1; x < W; x++) {
      ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, visH * cell); ctx.stroke();
    }
    for (let y = 1; y < visH; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(W * cell, y * cell); ctx.stroke();
    }
    // 危険ライン
    ctx.strokeStyle = 'rgba(232,69,69,.25)';
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(0, 2 * cell); ctx.lineTo(W * cell, 2 * cell); ctx.stroke();
    ctx.setLineDash([]);

    const flashSet = new Set(flashCells.map(c => c.y * W + c.x));
    // 盤面
    const g = game.g;
    if (!g) return;
    for (let y = HIDDEN; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const c = g.grid[y][x];
        if (!c) continue;
        drawCell(ctx, x * cell, (y - HIDDEN) * cell, cell, c.t,
          { flash: flashSet.has(y * W + x) });
      }
    }
    // ゴーストと現在ピース
    if (g.cur && (game.phase === 'drop' || game.phase === 'cutin')) {
      const gy = g.ghostY();
      const [dx, dy] = ROT_OFFSET[g.cur.rot];
      const cells = [
        { x: g.cur.x, y: gy, t: g.cur.cells[0] },
        { x: g.cur.x + dx, y: gy + dy, t: g.cur.cells[1] },
      ];
      cells.forEach(c => {
        if (c.y >= HIDDEN) drawCell(ctx, c.x * cell, (c.y - HIDDEN) * cell, cell, c.t, { ghost: true });
      });
      const cur = [
        { x: g.cur.x, y: g.cur.y, t: g.cur.cells[0] },
        { x: g.cur.x + dx, y: g.cur.y + dy, t: g.cur.cells[1] },
      ];
      cur.forEach(c => {
        if (c.y >= HIDDEN) drawCell(ctx, c.x * cell, (c.y - HIDDEN) * cell, cell, c.t);
      });
    }
  }

  function drawNext() {
    const g = game.g;
    if (!g) return;
    const s = 26;
    nctx.setTransform(2, 0, 0, 2, 0, 0);
    nctx.clearRect(0, 0, 30, 60);
    const q = g.queue[0];
    if (q) {
      drawCell(nctx, 2, 2, s / 2 * 0.95, q[1]);
      drawCell(nctx, 2, 2 + s / 2, s / 2 * 0.95, q[0]);
    }
    const q2 = g.queue[1];
    if (q2) {
      nctx.globalAlpha = 0.45;
      drawCell(nctx, 6, 34, s / 2 * 0.7, q2[1]);
      drawCell(nctx, 6, 34 + s / 2 * 0.72, s / 2 * 0.7, q2[0]);
      nctx.globalAlpha = 1;
    }
  }

  /* ================= スキル ================= */
  async function useSkill() {
    if (game.gauge < 100 || game.phase !== 'drop' || game.paused || game.over) return;
    const run = game.runId;
    game.gauge = 0;
    setGauge(0);
    game.phase = 'cutin';
    const ch = game.chara;
    A.sfx('skill');
    // カットイン
    $('cutin-char').innerHTML = C.charSVG(ch.id);
    $('cutin-name').textContent = ch.name;
    $('cutin-skill').textContent = ch.skill.name;
    const cutin = $('skill-cutin');
    cutin.hidden = false;
    void cutin.offsetWidth;
    reactChar(ch.id, 'superjoy', 1500);
    spawnConfetti(18);
    $('stage-bg').classList.add('hype');
    setTimeout(() => { if (game.fx.scoreMult === 1) $('stage-bg').classList.remove('hype'); }, 2000);
    await wait(900);
    cutin.hidden = true;
    if (game.runId !== run || game.over) return;

    const g = game.g;
    switch (ch.skill.type) {
      case 'order': { // ティラ様：次3ピースを最多楽器に＋ゲージ1.5倍(8秒)
        const t = g.mostCommonType();
        g.queue = g.queue.map(() => [t, t]);
        g.forcedQueue.unshift([t, t]);
        game.fx.gaugeMult = 1.5;
        game.fx.gaugeUntil = performance.now() + 8000;
        drawNext();
        break;
      }
      case 'crush': { // カジカジ：下2段を消し飛ばす
        const cells = [];
        for (let y = H - 2; y < H; y++) for (let x = 0; x < W; x++) {
          if (g.grid[y][x]) cells.push({ x, y, t: g.grid[y][x].t });
        }
        if (cells.length) {
          flashCells = cells;
          render();
          await wait(300);
          if (game.runId !== run || game.over) return;
          g.clearCells(cells);
          flashCells = [];
          addScore(cells.length * 15);
          addFans(Math.round(cells.length * 4 * game.venue.fanRate));
          g.applyGravity();
          render();
          await wait(140);
          fireTutorial('skill');
          await resolveAfterSkill();
          return;
        }
        break;
      }
      case 'tune': { // 花子：最少楽器をぜんぶ音符に
        const t = g.leastCommonType();
        if (t) {
          for (let y = HIDDEN; y < H; y++) for (let x = 0; x < W; x++) {
            if (g.grid[y][x] && g.grid[y][x].t === t) g.grid[y][x].t = E.NOTE;
          }
          render();
          await wait(200);
          fireTutorial('skill');
          await resolveAfterSkill();
          return;
        }
        break;
      }
      case 'encore': { // ？？？：スコア2倍(12秒)＋観客ヒートアップ
        game.fx.scoreMult = 2;
        game.fx.scoreUntil = performance.now() + 12000;
        $('crowd').classList.add('hype');
        $('stage-bg').classList.add('hype');
        A.cheer(1);
        break;
      }
    }
    fireTutorial('skill');
    game.phase = 'drop';
  }

  async function resolveAfterSkill() {
    // スキルで盤面が変わった後の連鎖処理
    await lockAndResolveFromBoard();
  }
  async function lockAndResolveFromBoard() {
    game.phase = 'resolve';
    await lockAndResolve(true);
  }

  /* ================= 終了処理 ================= */
  function endRun() {
    if (game.over) return;
    game.over = true;
    game.phase = 'over';
    flashCells = [];
    $('danger-flash').classList.remove('on');
    document.querySelectorAll('#stage-row .bandchar').forEach(el => el.classList.remove('pinch', 'skillready'));

    const isChallenge = game.mode === 'challenge';
    const success = isChallenge ? game.fans >= game.challenge.targetFans : null;
    const isTutorial = game.mode === 'tutorial';

    if (success === false) A.sfx('gameover');
    else if (isChallenge || isTutorial) A.sfx('result');
    else A.sfx('gameover');

    // 記録更新
    const badges = [];
    if (!isTutorial) {
      save.plays++;
      save.totalFans += game.fans;
      if (game.score > save.hiScore) { save.hiScore = game.score; badges.push('🏆 ハイスコア!'); }
      if (game.fans > save.bestFans) { save.bestFans = game.fans; badges.push('💖 ファンきろく!'); }
      if (game.maxCombo > save.maxCombo) { save.maxCombo = game.maxCombo; badges.push('🔥 コンボきろく!'); }
      if (isChallenge && success) {
        if (!save.challenges[game.challenge.id]) badges.push('⭐ チャレンジクリア!');
        save.challenges[game.challenge.id] = true;
      }
      persist();
    } else {
      save.tutorialDone = true;
      persist();
    }

    setTimeout(() => {
      cancelAnimationFrame(game.raf);
      showResult({ success, badges, isTutorial });
    }, 1100);
  }

  function showResult({ success, badges, isTutorial }) {
    A.startBGM('menu');
    const title = $('result-title');
    title.classList.remove('fail');
    if (isTutorial) title.textContent = 'レッスンかんりょう！🎓';
    else if (success === true) { title.textContent = 'ライブ大せいこう！！🎉'; }
    else if (success === false) { title.textContent = 'ライブしっぱい…'; title.classList.add('fail'); }
    else title.textContent = 'ライブしゅうりょう！';

    placeBand('result-band');
    const band = $('result-band');
    band.querySelectorAll('.bandchar').forEach(el => {
      if (success === false) el.classList.add('sad');
      else el.classList.add('superjoy');
    });
    if (success !== false) spawnResultConfetti();

    const comments = {
      tyra: 'ティラ様「フッ…今日の観客も、私の旋律に酔いしれたようだな」',
      kaji: 'カジカジ「サイコーのシャウトだったろ！？また歌いまくるぜ！」',
      hanako: '花子「みんなの拍手…えへへ、花まるだね！」',
      newmember: '？？？「……つぎのライブも、きっと来てね」',
    };
    const failComments = {
      tyra: 'ティラ様「…この程度で終わる私たちではない。次だ！」',
      kaji: 'カジカジ「ドンマイドンマイ！次はもっとぶちかまそうぜ！」',
      hanako: '花子「だいじょうぶ！れんしゅうすれば、もっとよくなるよ」',
      newmember: '？？？「……まだ、終わりじゃないよ」',
    };
    $('result-comment').textContent =
      (success === false ? failComments : comments)[game.chara.id];

    $('res-score').textContent = fmt(game.score);
    $('res-fans').textContent = fmt(game.fans);
    $('res-combo').textContent = game.maxCombo;
    $('res-level').textContent = game.level;
    const bd = $('result-badges');
    bd.innerHTML = '';
    badges.forEach(b => {
      const s = document.createElement('span');
      s.className = 'badge';
      s.textContent = b;
      bd.appendChild(s);
    });
    show('result');
    refreshHome();
  }

  function spawnResultConfetti() {
    const host = $('screen-result');
    const colors = ['#ff5f7a', '#ffc93c', '#56c8ee', '#58d68d', '#c86bff'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('i');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
      host.appendChild(p);
      setTimeout(() => p.remove(), 3400);
    }
  }

  /* ================= チュートリアル ================= */
  function advanceTutorial() {
    game.tutorialStep++;
    const step = D.TUTORIAL_STEPS[game.tutorialStep];
    if (!step) { endRun(); return; }
    $('tutorial-text').textContent = step.text;
    A.sfx('ui');
    if (step.goal === 'clear') {
      // ギター2つを置いて3つ目で消せる形にする
      const g = game.g;
      if (!g.grid[H - 1][0]) g.grid[H - 1][0] = { t: 'guitar' };
      if (!g.grid[H - 1][1]) g.grid[H - 1][1] = { t: 'guitar' };
      g.forcedQueue.unshift(['guitar', 'drum']);
      g.queue[0] = ['guitar', 'drum'];
      drawNext();
    } else if (step.goal === 'bandset') {
      const g = game.g;
      if (!g.grid[H - 1][5]) g.grid[H - 1][5] = { t: 'guitar' };
      if (!g.grid[H - 1][6]) g.grid[H - 1][6] = { t: 'drum' };
      if (!g.grid[H - 2][5]) g.grid[H - 2][5] = { t: 'bass' };
      g.queue[0] = ['mic', 'bass'];
      g.forcedQueue.unshift(['mic', 'bass']);
      drawNext();
    } else if (step.goal === 'skill') {
      addGauge(100);
    } else if (step.goal === 'end') {
      setTimeout(() => { if (game.mode === 'tutorial' && !game.over) endRun(); }, 2600);
    }
  }
  function fireTutorial(goal) {
    if (game.mode !== 'tutorial') return;
    const step = D.TUTORIAL_STEPS[game.tutorialStep];
    if (step && step.goal === goal) advanceTutorial();
  }

  /* ================= 入力 ================= */
  function inputMove(dx) {
    if (game.phase !== 'drop' || game.paused || game.over) return;
    if (game.g.move(dx)) { A.sfx('move'); fireTutorial('move'); render(); }
  }
  function inputRotate() {
    if (game.phase !== 'drop' || game.paused || game.over) return;
    if (game.g.rotate(1)) { A.sfx('rotate'); fireTutorial('rotate'); render(); }
  }
  function inputHardDrop() {
    if (game.phase !== 'drop' || game.paused || game.over) return;
    const d = game.g.hardDrop();
    if (d >= 0) {
      addScore(d * 2);
      A.sfx('harddrop');
      render();
      lockAndResolve();
    }
  }

  // タッチ操作（スワイプ移動・タップ回転・下スワイプ落下）
  let touch = null;
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    A.unlock();
    if (game.paused || game.over) return;
    const t = e.changedTouches[0];
    touch = { x0: t.clientX, y0: t.clientY, lx: t.clientX, ly: t.clientY, t0: performance.now(), moved: 0, dropped: 0 };
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touch || game.phase !== 'drop') return;
    const t = e.changedTouches[0];
    const stepX = Math.max(cell * 0.9, 20);
    let dx = t.clientX - touch.lx;
    while (Math.abs(dx) >= stepX) {
      inputMove(dx > 0 ? 1 : -1);
      touch.lx += (dx > 0 ? stepX : -stepX);
      touch.moved++;
      dx = t.clientX - touch.lx;
    }
    // 下方向ドラッグでソフトドロップ
    let dy = t.clientY - touch.ly;
    const stepY = Math.max(cell * 0.8, 18);
    while (dy >= stepY) {
      if (game.g && game.g.cur) {
        const r = game.g.stepDown();
        if (!r.locked) { addScore(1); touch.dropped++; render(); }
        else break;
      }
      touch.ly += stepY;
      dy = t.clientY - touch.ly;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!touch) return;
    const t = e.changedTouches[0];
    const dt = performance.now() - touch.t0;
    const totalDy = t.clientY - touch.y0;
    const totalDx = Math.abs(t.clientX - touch.x0);
    if (totalDy > 70 && dt < 260 && totalDx < 60) {
      inputHardDrop(); // 強い下フリック＝即落下
    } else if (dt < 260 && touch.moved === 0 && touch.dropped === 0 && Math.abs(totalDy) < 16 && totalDx < 16) {
      inputRotate(); // タップ＝回転
    }
    touch = null;
  }, { passive: false });

  // マウス（PC確認用）：クリックで回転
  canvas.addEventListener('mousedown', (e) => {
    A.unlock();
    if ('ontouchstart' in window) return;
    inputRotate();
  });

  // キーボード（PC）
  document.addEventListener('keydown', (e) => {
    if (currentScreen !== 'game') return;
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); inputMove(-1); break;
      case 'ArrowRight': e.preventDefault(); inputMove(1); break;
      case 'ArrowUp': case 'x': case 'X': e.preventDefault(); inputRotate(); break;
      case 'z': case 'Z': if (game.g && game.phase === 'drop' && game.g.rotate(-1)) { A.sfx('rotate'); render(); } break;
      case 'ArrowDown': e.preventDefault(); game.softDrop = true; break;
      case ' ': e.preventDefault(); inputHardDrop(); break;
      case 'c': case 'C': inputHold(); break;
      case 's': case 'S': useSkill(); break;
      case 'p': case 'P': case 'Escape': togglePause(); break;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') game.softDrop = false;
  });

  // 操作ボタン（長押しで連続移動）
  function bindHold(id, fn, interval = 140) {
    const el = $(id);
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      A.unlock();
      fn();
      timer = setInterval(fn, interval);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', stop);
    el.addEventListener('touchcancel', stop);
    el.addEventListener('mousedown', (e) => { if (!('ontouchstart' in window)) start(e); });
    el.addEventListener('mouseup', stop);
    el.addEventListener('mouseleave', stop);
  }
  bindHold('ctrl-left', () => inputMove(-1));
  bindHold('ctrl-right', () => inputMove(1));
  bindHold('ctrl-rot', () => inputRotate(), 220);
  bindHold('ctrl-down', () => {
    if (game.phase !== 'drop' || game.paused) return;
    const r = game.g.stepDown();
    if (!r.locked) { addScore(1); render(); }
    else lockAndResolve();
  }, 60);
  $('ctrl-drop').addEventListener('click', () => { A.unlock(); inputHardDrop(); });
  $('btn-skill').addEventListener('click', () => { A.unlock(); useSkill(); });
  $('btn-hold').addEventListener('click', () => { A.unlock(); inputHold(); });

  /* ================= 一時停止 ================= */
  function togglePause(force) {
    if (game.over || currentScreen !== 'game') return;
    const to = force !== undefined ? force : !game.paused;
    game.paused = to;
    $('overlay-pause').hidden = !to;
    if (to) {
      $('pause-sfx').checked = save.settings.sfx;
      $('pause-bgm').checked = save.settings.bgm;
    }
    A.sfx('ui');
  }
  $('btn-pause').addEventListener('click', () => togglePause(true));
  $('btn-resume').addEventListener('click', () => { game.lastTime = performance.now(); togglePause(false); });
  $('btn-restart').addEventListener('click', () => {
    togglePause(false);
    cancelAnimationFrame(game.raf);
    startGame(game.mode, game.challenge);
  });
  $('btn-quit').addEventListener('click', () => {
    game.over = true;
    cancelAnimationFrame(game.raf);
    $('overlay-pause').hidden = true;
    show('home');
    refreshHome();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentScreen === 'game' && !game.over && !game.paused) togglePause(true);
  });

  /* ================= 各画面の構築 ================= */
  function refreshHome() {
    $('home-hiscore').textContent = fmt(save.hiScore);
    $('home-fans').textContent = fmt(save.totalFans);
  }

  function buildCharaScreen() {
    const grid = $('chara-grid');
    grid.innerHTML = '';
    D.CHARACTERS.forEach(ch => {
      const card = document.createElement('button');
      card.className = 'chara-card' + (save.charId === ch.id ? ' selected' : '');
      card.innerHTML = `
        <div class="bandchar">${C.charSVG(ch.id)}</div>
        <h3 style="color:${ch.themeLight}">${ch.name}</h3>
        <span class="chara-sub">${ch.sub}</span>
        <div class="chara-skill"><b>${ch.skill.name}</b><br>${ch.skill.desc}</div>`;
      card.addEventListener('click', () => {
        save.charId = ch.id;
        persist();
        A.sfx('ui');
        grid.querySelectorAll('.chara-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      grid.appendChild(card);
    });
  }

  function buildVenueScreen() {
    const list = $('venue-list');
    list.innerHTML = '';
    D.VENUES.forEach(v => {
      const locked = save.totalFans < v.unlockFans;
      const card = document.createElement('button');
      card.className = 'venue-card' + (save.venueId === v.id ? ' selected' : '') + (locked ? ' locked' : '');
      if (locked) card.dataset.lock = `ファン${fmt(v.unlockFans)}人でかいほう`;
      card.innerHTML = `
        <div class="venue-visual" style="background:linear-gradient(180deg,${v.sky[0]},${v.sky[1]} 60%,${v.sky[2]})"></div>
        <div class="venue-body">
          <h3>${v.name}</h3>
          <p>${v.desc}</p>
          <span class="venue-bonus">ファンかくとく ×${v.fanRate}</span>
        </div>`;
      if (!locked) {
        card.addEventListener('click', () => {
          save.venueId = v.id;
          persist();
          A.sfx('ui');
          list.querySelectorAll('.venue-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      }
      list.appendChild(card);
    });
  }

  function buildIntroScreen() {
    const list = $('intro-list');
    list.innerHTML = '';
    D.CHARACTERS.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'intro-card';
      card.innerHTML = `
        <div class="bandchar">${C.charSVG(ch.id)}</div>
        <div>
          <h3 style="color:${ch.themeLight}">${ch.name}<small>${ch.sub}</small></h3>
          <p>${ch.desc}</p>
          <div class="intro-skill"><b>⚡ ${ch.skill.name}</b>：${ch.skill.desc}</div>
        </div>`;
      list.appendChild(card);
    });
  }

  function buildChallengeList() {
    const list = $('challenge-list');
    list.innerHTML = '';
    D.CHALLENGES.forEach(c => {
      const venue = D.VENUES.find(v => v.id === c.venue);
      const locked = save.totalFans < venue.unlockFans;
      const card = document.createElement('button');
      card.className = 'challenge-card';
      if (locked) card.disabled = true;
      card.innerHTML = `
        <span><b>${c.name}</b><small>${locked ? `※${venue.name}のかいほうが必要` : c.desc}</small></span>
        ${save.challenges[c.id] ? '<span class="cleared">クリア✔</span>' : ''}`;
      if (!locked) {
        card.addEventListener('click', () => {
          A.sfx('ui');
          pendingChallenge = c;
          buildCharaScreen();
          show('chara');
        });
      }
      list.appendChild(card);
    });
    list.hidden = false;
  }

  function buildHowtoPieces() {
    const host = $('howto-pieces');
    host.innerHTML = '';
    ['guitar', 'drum', 'bass', 'mic', 'note', 'rock'].forEach(t => {
      const wrap = document.createElement('div');
      wrap.className = 'howto-piece';
      const cv = document.createElement('canvas');
      cv.width = 72; cv.height = 72;
      cv.style.width = '36px'; cv.style.height = '36px';
      const c2 = cv.getContext('2d');
      c2.setTransform(2, 0, 0, 2, 0, 0);
      drawCell(c2, 0, 0, 36, t);
      wrap.appendChild(cv);
      const label = document.createElement('span');
      label.textContent = P[t].name;
      wrap.appendChild(label);
      host.appendChild(wrap);
    });
  }

  function buildRecords() {
    const dl = $('records-list');
    dl.innerHTML = `
      <dt>ハイスコア</dt><dd>${fmt(save.hiScore)}</dd>
      <dt>さいこうファンすう（1ライブ）</dt><dd>${fmt(save.bestFans)}</dd>
      <dt>そうファンすう</dt><dd>${fmt(save.totalFans)}</dd>
      <dt>さいだいコンボ</dt><dd>${save.maxCombo}</dd>
      <dt>プレイかいすう</dt><dd>${save.plays}</dd>`;
  }

  /* ================= 画面遷移の配線 ================= */
  let pendingChallenge = null;

  $('btn-title-start').addEventListener('click', () => { A.unlock(); A.sfx('ui'); show('home'); refreshHome(); });
  $('btn-home-play').addEventListener('click', () => {
    A.unlock(); A.sfx('ui');
    $('challenge-list').hidden = true;
    show('mode');
  });
  $('btn-home-chara').addEventListener('click', () => { A.sfx('ui'); buildIntroScreen(); show('charaintro'); });
  $('btn-home-venue').addEventListener('click', () => { A.sfx('ui'); buildVenueScreen(); show('venue'); });
  $('btn-home-howto').addEventListener('click', () => { A.sfx('ui'); buildHowtoPieces(); show('howto'); });
  $('btn-home-settings').addEventListener('click', () => {
    A.sfx('ui');
    $('set-sfx').checked = save.settings.sfx;
    $('set-bgm').checked = save.settings.bgm;
    $('set-buttons').checked = save.settings.buttons;
    buildRecords();
    show('settings');
  });

  $('btn-mode-endless').addEventListener('click', () => {
    A.sfx('ui'); pendingChallenge = null; buildCharaScreen(); show('chara');
  });
  $('btn-mode-challenge').addEventListener('click', () => { A.sfx('ui'); buildChallengeList(); });
  $('btn-mode-tutorial').addEventListener('click', () => { A.unlock(); A.sfx('ui'); startGame('tutorial'); });

  $('btn-chara-go').addEventListener('click', () => {
    A.unlock(); A.sfx('ui');
    if (pendingChallenge) startGame('challenge', pendingChallenge);
    else startGame('endless');
  });
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      A.sfx('uiback');
      const to = btn.dataset.back;
      if (to === 'mode') { $('challenge-list').hidden = true; }
      show(to);
      if (to === 'home') refreshHome();
    });
  });

  $('btn-res-retry').addEventListener('click', () => {
    A.sfx('ui');
    if (game.mode === 'tutorial') startGame('endless');
    else startGame(game.mode, game.challenge);
  });
  $('btn-res-home').addEventListener('click', () => { A.sfx('uiback'); show('home'); refreshHome(); });

  $('btn-tutorial-skip').addEventListener('click', () => {
    A.sfx('ui');
    endRun();
  });

  /* 設定トグル */
  function applySettings() {
    A.setSfx(save.settings.sfx);
    A.setBgm(save.settings.bgm);
    if (save.settings.bgm) {
      if (currentScreen === 'game') A.startBGM('play');
      else A.startBGM('menu');
    }
    $('ctrl-row').hidden = !save.settings.buttons;
    persist();
  }
  $('set-sfx').addEventListener('change', (e) => { save.settings.sfx = e.target.checked; applySettings(); });
  $('set-bgm').addEventListener('change', (e) => { save.settings.bgm = e.target.checked; applySettings(); });
  $('set-buttons').addEventListener('change', (e) => { save.settings.buttons = e.target.checked; applySettings(); });
  $('pause-sfx').addEventListener('change', (e) => { save.settings.sfx = e.target.checked; applySettings(); });
  $('pause-bgm').addEventListener('change', (e) => { save.settings.bgm = e.target.checked; applySettings(); });

  /* ================= 初期化 ================= */
  function init() {
    // スプラッシュ
    $('splash-mark').innerHTML = C.charSVG('tyra');
    placeBand('title-band');
    placeBand('home-band');
    buildCharaScreen();
    A.setSfx(save.settings.sfx);
    A.setBgm(save.settings.bgm);
    $('ctrl-row').hidden = !save.settings.buttons;
    refreshHome();
    setTimeout(() => show('title'), 1500);
    // 最初のユーザー操作で音声を解錠
    document.addEventListener('pointerdown', () => A.unlock(), { once: true });
  }
  init();
})();
