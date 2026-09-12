/* =========================================================
   PIXEL OFFICE - アプリ層（描画ループ・UI・入力）
   engine.js のシミュレーションを回し、Canvasとパネルに反映する。
   ========================================================= */
(function () {
  'use strict';

  const E = window.OfficeEngine;
  const S = window.OfficeSprites;
  const T = S.T;

  const canvas = document.getElementById('office-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const office = new E.Office({});
  office.log('🏢', 'PIXEL OFFICE 始業。AI社員 ' + office.agents.length + '名が出勤しました');

  /* 静的マップは昼・夜の2枚をオフスクリーンに描いて使い回す */
  function bakeMap(night) {
    const c = document.createElement('canvas');
    c.width = canvas.width; c.height = canvas.height;
    const bctx = c.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    S.drawMap(bctx, E, night);
    return c;
  }
  const mapDay = bakeMap(false);
  const mapNight = bakeMap(true);

  /* サーバーラックはLEDが点滅するので毎フレーム描く */
  const serverTiles = [];
  for (let row = 0; row < E.ROWS; row++) {
    for (let col = 0; col < E.COLS; col++) {
      if (E.tileAt(col, row) === 's') serverTiles.push({ x: col * T, y: row * T });
    }
  }

  function isNight() {
    const h = (office.clock / 60) | 0;
    return h >= 19 || h < 7;
  }

  /* ---------- 速度切り替え ---------- */
  const SPEEDS = [1, 2, 4, 0];
  const SPEED_LABELS = ['▶ ×1', '▶▶ ×2', '▶▶▶ ×4', '⏸ 停止中'];
  let speedIndex = 0;
  const btnSpeed = document.getElementById('btn-speed');
  btnSpeed.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % SPEEDS.length;
    btnSpeed.textContent = SPEED_LABELS[speedIndex];
  });

  /* ---------- 社員パネル ---------- */
  const listEl = document.getElementById('agent-list');
  const rows = office.agents.map((agent) => {
    const li = document.createElement('li');
    li.className = 'agent-row';
    li.tabIndex = 0;
    li.setAttribute('role', 'button');

    const avatar = document.createElement('canvas');
    avatar.width = 36; avatar.height = 36;
    avatar.className = 'agent-avatar';
    S.drawAvatar(avatar, agent.def);

    const info = document.createElement('div');
    info.className = 'agent-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'agent-name';
    nameEl.innerHTML = agent.def.name + ' <span class="agent-role">' + agent.def.role + '</span>';
    const statusEl = document.createElement('div');
    statusEl.className = 'agent-status';
    const barWrap = document.createElement('div');
    barWrap.className = 'agent-bar';
    const bar = document.createElement('i');
    barWrap.appendChild(bar);
    info.append(nameEl, statusEl, barWrap);
    li.append(avatar, info);
    listEl.appendChild(li);

    const select = () => selectAgent(agent === selected ? null : agent);
    li.addEventListener('click', select);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
    });
    return { agent, li, statusEl, bar };
  });

  /* ---------- 選択と詳細カード ---------- */
  let selected = null;
  const card = document.getElementById('detail-card');

  function selectAgent(agent) {
    selected = agent;
    rows.forEach((r) => r.li.classList.toggle('selected', r.agent === selected));
    card.hidden = !selected;
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * canvas.width;
    const my = (e.clientY - rect.top) / rect.height * canvas.height;
    let best = null, bestD = 20 * 20;
    for (const a of office.agents) {
      const dx = a.x * T + 8 - mx, dy = a.y * T + 4 - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = a; }
    }
    selectAgent(best === selected ? null : best);
  });

  function stateIcon(agent) {
    switch (agent.state) {
      case 'working': return '🟢';
      case 'walking': return '🚶';
      case 'meeting': return '📋';
      case 'chat': return '💬';
      case 'coffee': return '☕';
      case 'vending': return '🥤';
      case 'whiteboard': return '🖊️';
      default: return '💭';
    }
  }

  /* ---------- フィード ---------- */
  const feedEl = document.getElementById('feed-list');
  function syncFeed() {
    /* office.events は新しい順。未描画のものだけ拾って古い順に先頭へ足す */
    const fresh = [];
    for (const ev of office.events) {
      if (ev._rendered) break;
      ev._rendered = true;
      fresh.push(ev);
    }
    for (let i = fresh.length - 1; i >= 0; i--) {
      const ev = fresh[i];
      const li = document.createElement('li');
      li.innerHTML = '<time>' + ev.time + '</time><span class="feed-icon">' + ev.icon +
        '</span>' + escapeHtml(ev.text);
      feedEl.prepend(li);
    }
    while (feedEl.children.length > 40) feedEl.removeChild(feedEl.lastChild);
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---------- パネル更新（描画より低頻度） ---------- */
  const clockEl = document.getElementById('clock');
  const onlineEl = document.getElementById('online');

  function syncPanels() {
    clockEl.textContent = 'Day ' + office.day + ' ' + office.clockText();
    const workingCount = office.agents.filter((a) => a.state === 'working').length;
    onlineEl.textContent = '🟢 ' + workingCount + '/' + office.agents.length + '人 作業中';

    for (const r of rows) {
      r.statusEl.textContent = stateIcon(r.agent) + ' ' + r.agent.statusText();
      const p = r.agent.progress();
      r.bar.style.width = p === null ? '0%' : Math.min(100, p * 100).toFixed(0) + '%';
      r.bar.parentElement.style.visibility = p === null ? 'hidden' : 'visible';
    }

    if (selected) {
      card.innerHTML =
        '<h3>' + selected.def.name + '<span>' + selected.def.role + '</span></h3>' +
        '<p class="card-status">' + stateIcon(selected) + ' ' +
        escapeHtml(selected.statusText()) + '</p>' +
        '<p class="card-meta">本日の完了タスク: <strong>' + selected.doneCount + '件</strong></p>';
    }
    syncFeed();
  }

  /* ---------- メインループ ---------- */
  let last = performance.now();
  let wallTime = 0;

  function frame(now) {
    const rdt = Math.min((now - last) / 1000, 0.1);
    last = now;
    wallTime += rdt;

    /* ×1 で実時間1秒 = オフィス1分 */
    const speed = SPEEDS[speedIndex];
    if (speed > 0) office.update(rdt * speed);

    const night = isNight();
    ctx.drawImage(night ? mapNight : mapDay, 0, 0);

    for (const sTile of serverTiles) S.drawServer(ctx, sTile.x, sTile.y, wallTime);

    /* モニター（作業中の席だけ点灯） */
    for (const a of office.agents) {
      const on = a.state === 'working';
      S.drawMonitor(ctx, a.seat.x * T, (a.seat.y - 1) * T, on, wallTime);
    }

    /* キャラクター（Yソートして重なりを自然に） */
    const sorted = office.agents.slice().sort((a, b) => a.y - b.y);
    for (const a of sorted) S.drawAgent(ctx, a);
    for (const a of sorted) S.drawEmote(ctx, a);
    if (selected) S.drawSelection(ctx, selected, wallTime);

    /* 夜はうっすら暗くして、モニター周りだけ明るく */
    if (night) {
      ctx.fillStyle = 'rgba(12,16,45,0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const a of office.agents) {
        if (a.state !== 'working') continue;
        ctx.fillStyle = 'rgba(140,190,255,0.07)';
        ctx.fillRect(a.seat.x * T - 8, (a.seat.y - 1) * T - 4, 32, 40);
      }
    }

    requestAnimationFrame(frame);
  }

  setInterval(syncPanels, 300);
  syncPanels();
  requestAnimationFrame(frame);
})();
