/* =========================================================
   PIXEL OFFICE - ドット絵描画（ブラウザ専用）
   タイルとキャラクターをすべてCanvas矩形で手打ちする。
   1タイル = 16px。imageSmoothingを切って拡大表示する。
   ========================================================= */
(function (global) {
  'use strict';

  const T = 16;

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  /* ---------- タイル ---------- */

  function drawFloor(ctx, x, y, col, row) {
    const even = (col + row) % 2 === 0;
    px(ctx, x, y, T, T, even ? '#8a7a63' : '#93826b');
    px(ctx, x, y + T - 1, T, 1, 'rgba(0,0,0,0.08)');
    if ((col * 7 + row * 13) % 11 === 0) px(ctx, x + 4, y + 6, 2, 1, 'rgba(0,0,0,0.10)');
  }

  function drawWall(ctx, x, y) {
    px(ctx, x, y, T, T, '#3d4457');
    px(ctx, x, y + T - 4, T, 4, '#2c3242');
    px(ctx, x, y, T, 2, '#4c5570');
  }

  function drawWindow(ctx, x, y, night) {
    drawWall(ctx, x, y);
    px(ctx, x + 2, y + 2, 12, 9, night ? '#1a2547' : '#9fd4ea');
    if (night) {
      px(ctx, x + 4, y + 3, 1, 1, '#e8e2c0');   /* 星 */
      px(ctx, x + 10, y + 5, 1, 1, '#e8e2c0');
      px(ctx, x + 7, y + 8, 1, 1, '#c8d2f0');
    } else {
      px(ctx, x + 3, y + 3, 4, 2, '#e6f4fa');   /* 雲 */
      px(ctx, x + 9, y + 6, 4, 2, '#d2ecf6');
    }
    px(ctx, x + 7, y + 2, 2, 9, '#3d4457');      /* サッシ */
    px(ctx, x + 2, y + 6, 12, 1, '#3d4457');
  }

  function drawDesk(ctx, x, y) {
    px(ctx, x, y + 2, T, 12, '#a56a3a');
    px(ctx, x, y + 2, T, 2, '#c58a52');
    px(ctx, x, y + 12, T, 2, '#7c4d28');
  }

  /* モニター。on のとき画面が光り、コード行が流れる */
  function drawMonitor(ctx, x, y, on, time) {
    px(ctx, x + 3, y + 3, 10, 8, '#22252e');
    px(ctx, x + 4, y + 4, 8, 6, on ? '#15324a' : '#101318');
    if (on) {
      const shift = ((time * 3) | 0) % 3;
      for (let i = 0; i < 3; i++) {
        const w = 3 + ((x + i * 3 + shift) % 4);
        px(ctx, x + 4, y + 4 + i * 2, w, 1, i === shift ? '#7be6a2' : '#3f7ea6');
      }
    }
    px(ctx, x + 7, y + 11, 2, 1, '#454a58');
    px(ctx, x + 5, y + 12, 6, 1, '#454a58');
  }

  function drawChair(ctx, x, y) {
    px(ctx, x + 4, y + 6, 8, 7, '#4d5668');
    px(ctx, x + 4, y + 6, 8, 2, '#5d6880');
    px(ctx, x + 7, y + 13, 2, 2, '#333a48');
  }

  function drawTable(ctx, x, y) {
    px(ctx, x, y + 1, T, 13, '#5f8fb0');
    px(ctx, x, y + 1, T, 2, '#7cabc8');
    px(ctx, x, y + 12, T, 2, '#456a85');
  }

  function drawPlant(ctx, x, y) {
    px(ctx, x + 5, y + 10, 6, 5, '#a5502e');
    px(ctx, x + 5, y + 10, 6, 1, '#c26a40');
    px(ctx, x + 6, y + 3, 4, 7, '#2e8a4a');
    px(ctx, x + 4, y + 5, 3, 4, '#37a55a');
    px(ctx, x + 9, y + 4, 3, 4, '#37a55a');
    px(ctx, x + 7, y + 1, 2, 3, '#45c06a');
  }

  function drawBookshelf(ctx, x, y) {
    px(ctx, x + 1, y, 14, 15, '#7c4d28');
    px(ctx, x + 2, y + 2, 12, 4, '#4a2d16');
    px(ctx, x + 2, y + 8, 12, 4, '#4a2d16');
    const colors = ['#c94f4f', '#4f7ec9', '#4fc97e', '#c9a54f'];
    for (let i = 0; i < 4; i++) {
      px(ctx, x + 3 + i * 3, y + 2, 2, 4, colors[i]);
      px(ctx, x + 3 + i * 3, y + 8, 2, 4, colors[(i + 2) % 4]);
    }
  }

  function drawServer(ctx, x, y, time) {
    px(ctx, x + 2, y, 12, 15, '#262b36');
    px(ctx, x + 2, y, 12, 1, '#3a4152');
    for (let i = 0; i < 3; i++) {
      px(ctx, x + 4, y + 3 + i * 4, 8, 2, '#171a22');
      const blink = ((time * 2 + i * 0.7) | 0) % 2 === 0;
      px(ctx, x + 10, y + 3 + i * 4, 1, 1, blink ? '#57e88a' : '#1d4a2e');
      px(ctx, x + 12, y + 3 + i * 4, 1, 1, blink ? '#123d22' : '#e85757');
    }
  }

  function drawCoffee(ctx, x, y) {
    px(ctx, x + 3, y + 2, 10, 13, '#8a2f2f');
    px(ctx, x + 3, y + 2, 10, 2, '#a84444');
    px(ctx, x + 5, y + 5, 6, 3, '#22252e');
    px(ctx, x + 6, y + 9, 4, 3, '#e8e2d0');    /* カップ */
    px(ctx, x + 7, y + 8, 2, 1, '#6b4a2f');
  }

  function drawVending(ctx, x, y) {
    px(ctx, x + 3, y + 1, 10, 14, '#2f5e8a');
    px(ctx, x + 3, y + 1, 10, 1, '#4478a8');
    px(ctx, x + 5, y + 3, 6, 6, '#cfe8f5');
    px(ctx, x + 5, y + 3, 2, 2, '#e85757');
    px(ctx, x + 8, y + 3, 2, 2, '#57c9e8');
    px(ctx, x + 5, y + 6, 2, 2, '#e8c957');
    px(ctx, x + 5, y + 11, 6, 2, '#1d2733');
  }

  function drawWhiteboard(ctx, x, y) {
    px(ctx, x + 2, y + 1, 12, 10, '#e9edf0');
    px(ctx, x + 1, y, 14, 1, '#8f95a3');
    px(ctx, x + 1, y + 11, 14, 1, '#8f95a3');
    px(ctx, x + 4, y + 3, 5, 1, '#c94f4f');   /* 走り書き */
    px(ctx, x + 4, y + 5, 8, 1, '#4f7ec9');
    px(ctx, x + 4, y + 7, 4, 1, '#2f9e5b');
    px(ctx, x + 10, y + 7, 2, 2, '#c94f4f');
    px(ctx, x + 6, y + 12, 1, 3, '#6b7280');  /* 脚 */
    px(ctx, x + 9, y + 12, 1, 3, '#6b7280');
  }

  /* 静的マップを一括描画（オフスクリーンに1回だけ） */
  function drawMap(ctx, engine, night) {
    for (let row = 0; row < engine.ROWS; row++) {
      for (let col = 0; col < engine.COLS; col++) {
        const t = engine.tileAt(col, row);
        const x = col * T, y = row * T;
        if (t === '#') { drawWall(ctx, x, y); continue; }
        if (t === 'W') { drawWindow(ctx, x, y, night); continue; }
        drawFloor(ctx, x, y, col, row);
        if (t === 'D') drawDesk(ctx, x, y);
        else if (t >= '1' && t <= '6') drawChair(ctx, x, y);
        else if (t === 'T') drawTable(ctx, x, y);
        else if (t === 'p') drawPlant(ctx, x, y);
        else if (t === 'b') drawBookshelf(ctx, x, y);
        else if (t === 'm') drawCoffee(ctx, x, y);
        else if (t === 'v') drawVending(ctx, x, y);
        else if (t === 'w') drawWhiteboard(ctx, x, y);
      }
    }
  }

  /* ---------- キャラクター ----------
     16x16。足元がタイル下端に合うよう、少し上にはみ出して描く。 */
  function drawAgent(ctx, agent) {
    const c = agent.def.colors;
    const sx = Math.round(agent.x * T);
    const sy = Math.round(agent.y * T) - 4 + (agent.sitting ? 3 : 0);
    const dir = agent.dir;
    const walking = agent.state === 'walking';
    const frame = walking ? ((agent.walkPhase * 4) | 0) % 2 : 0;

    /* 影 */
    if (!agent.sitting) px(ctx, sx + 4, Math.round(agent.y * T) + 14, 8, 2, 'rgba(0,0,0,0.22)');

    /* 脚（座り中は描かない） */
    if (!agent.sitting) {
      const lift = frame === 0 ? 1 : 0;
      px(ctx, sx + 5, sy + 13, 2, 3 - lift, c.pants);
      px(ctx, sx + 9, sy + 13, 2, 3 - (1 - lift) * (walking ? 1 : 0), c.pants);
      px(ctx, sx + 5, sy + 15, 2, 1, '#1d2026');
      px(ctx, sx + 9, sy + 15, 2, 1, '#1d2026');
    }

    /* 胴体と腕 */
    px(ctx, sx + 4, sy + 8, 8, 5, c.shirt);
    px(ctx, sx + 3, sy + 8, 1, 4, c.shirt);
    px(ctx, sx + 12, sy + 8, 1, 4, c.shirt);
    px(ctx, sx + 3, sy + 11, 1, 1, c.skin);
    px(ctx, sx + 12, sy + 11, 1, 1, c.skin);

    /* 頭 */
    px(ctx, sx + 4, sy + 1, 8, 3, c.hair);
    if (dir === 'up') {
      px(ctx, sx + 4, sy + 4, 8, 4, c.hair);           /* 後頭部 */
    } else {
      px(ctx, sx + 5, sy + 4, 6, 4, c.skin);
      px(ctx, sx + 4, sy + 4, 1, 2, c.hair);
      px(ctx, sx + 11, sy + 4, 1, 2, c.hair);
      const eo = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      px(ctx, sx + 6 + eo, sy + 5, 1, 1, '#1d2026');
      px(ctx, sx + 9 + eo, sy + 5, 1, 1, '#1d2026');
      if (agent.def.accessory === 'glasses') {
        px(ctx, sx + 5 + eo, sy + 5, 3, 1, 'rgba(30,34,44,0.55)');
        px(ctx, sx + 8 + eo, sy + 5, 3, 1, 'rgba(30,34,44,0.55)');
      }
    }
    if (agent.def.accessory === 'headphones') {
      px(ctx, sx + 4, sy, 8, 1, '#22252e');
      px(ctx, sx + 3, sy + 3, 2, 3, '#22252e');
      px(ctx, sx + 11, sy + 3, 2, 3, '#22252e');
    } else if (agent.def.accessory === 'cap') {
      px(ctx, sx + 4, sy, 8, 2, '#c94f4f');
      if (dir === 'down') px(ctx, sx + 4, sy + 2, 8, 1, '#a83b3b');
    }
  }

  /* エモート吹き出し（頭上） */
  function drawEmote(ctx, agent) {
    if (!agent.emote) return;
    const sx = Math.round(agent.x * T) + 8;
    const sy = Math.round(agent.y * T) - 12 + (agent.sitting ? 3 : 0);
    ctx.fillStyle = '#fdfdf5';
    ctx.fillRect(sx - 7, sy - 6, 14, 12);
    ctx.fillStyle = '#22252e';
    ctx.fillRect(sx - 7, sy - 7, 14, 1);
    ctx.fillRect(sx - 7, sy + 6, 14, 1);
    ctx.fillRect(sx - 8, sy - 6, 1, 12);
    ctx.fillRect(sx + 7, sy - 6, 1, 12);
    ctx.fillRect(sx - 1, sy + 7, 2, 2);   /* しっぽ */
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(agent.emote.icon, sx, sy + 1);
  }

  /* 選択中の社員の足元リング＋名前ラベル */
  function drawSelection(ctx, agent, time) {
    const sx = Math.round(agent.x * T);
    const sy = Math.round(agent.y * T);
    const blink = ((time * 4) | 0) % 2 === 0;
    ctx.fillStyle = blink ? '#ffd94a' : '#ffb347';
    ctx.fillRect(sx, sy + 14, 3, 2);
    ctx.fillRect(sx + 13, sy + 14, 3, 2);
    ctx.fillRect(sx, sy - 6, 3, 2);
    ctx.fillRect(sx + 13, sy - 6, 3, 2);

    const name = agent.def.name;
    ctx.font = '8px "DotGothic16", sans-serif';
    const w = ctx.measureText(name).width + 6;
    const lx = Math.min(Math.max(sx + 8 - w / 2, 1), ctx.canvas.width - w - 1);
    ctx.fillStyle = 'rgba(20,22,30,0.85)';
    ctx.fillRect(lx, sy - 18, w, 10);
    ctx.fillStyle = '#ffd94a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(name, lx + 3, sy - 17);
  }

  /* パネル用ミニアバター（顔だけを拡大して描く） */
  function drawAvatar(canvas, def) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const s = canvas.width / 12;
    ctx.fillStyle = '#2a2f3d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const P = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * s, y * s, w * s, h * s);
    };
    P(2, 1, 8, 3, def.colors.hair);
    P(3, 4, 6, 4, def.colors.skin);
    P(2, 4, 1, 2, def.colors.hair);
    P(9, 4, 1, 2, def.colors.hair);
    P(4, 5, 1, 1, '#1d2026');
    P(7, 5, 1, 1, '#1d2026');
    P(2, 8, 8, 3, def.colors.shirt);
    if (def.accessory === 'glasses') {
      P(3, 5, 3, 1, 'rgba(30,34,44,0.55)');
      P(6, 5, 3, 1, 'rgba(30,34,44,0.55)');
    } else if (def.accessory === 'headphones') {
      P(2, 0.4, 8, 0.8, '#22252e');
      P(1, 3, 1.2, 3, '#22252e');
      P(9.8, 3, 1.2, 3, '#22252e');
    } else if (def.accessory === 'cap') {
      P(2, 0.4, 8, 1.6, '#c94f4f');
    }
  }

  global.OfficeSprites = {
    T, drawMap, drawMonitor, drawServer, drawAgent, drawEmote, drawSelection, drawAvatar
  };
})(window);
