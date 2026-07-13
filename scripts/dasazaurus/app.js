/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   アプリ本体（画面遷移・盤面UI・演出）
   目的：勝ち負けよりも「この恐竜たち、応援したくなる」
   ========================================================= */
(function () {
  'use strict';

  const Cards = window.DZCards;
  const Lines = window.DZLines;
  const Engine = window.DZEngine;
  const Chars = window.DZChars;
  const Audio = window.DZAudio;

  const $ = (id) => document.getElementById(id);

  /* ---------- セーブデータ ---------- */
  const SAVE_KEY = 'dasazaurus-save-v1';
  const defaultSave = () => ({
    stageIndex: 0,           // いまの会場（クリアで進む）
    totalClears: 0,
    best: {},                // diffId -> {moves, timeMs}
    dokiSeen: false,
    sfx: true, bgm: true,
  });
  let save = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) save = Object.assign(defaultSave(), JSON.parse(raw));
  } catch (e) { /* プライベートモード等では記録なしで遊べる */ }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* noop */ }
  }

  /* ---------- キャラ表示名 ---------- */
  const CHAR_NAMES = {
    takeru: 'タケル憧れ', funky: 'ファンキー無糖', terako: '大騒テラコ',
    shibakuzo: 'SHIBAKUZO', dokidoki: 'DOKIDOKI', charmy: 'チャーミー',
  };
  const MEMBER_IDS = ['takeru', 'funky', 'terako', 'shibakuzo'];

  const MEMBER_PROFILES = [
    { id: 'takeru', part: 'ボーカル', text: '超前向き。何があってもポジティブで、すぐ夢を語る。口ぐせは「ちゃうやん！」と「幕張行くで」。' },
    { id: 'funky', part: 'ベース', text: '冷静なツッコミ担当。じつは少し心配性で、無糖ブラックを1日3本飲む。甘いのは苦手、仲間には甘い。' },
    { id: 'terako', part: 'ドラム＆応援団長', text: '声がとにかく大きい。メンバーの成功を自分のことのように大騒ぎして祝う。メガホンは魂。' },
    { id: 'shibakuzo', part: 'ギター', text: 'いつも眠そう。名前はいかついが、カードより睡眠優先。ギターを弾くと少しだけ目が覚める。' },
    { id: 'dokidoki', part: '？？？', text: 'めったに姿を見せない、ひみつのなかま。会えたらラッキー。', secret: true },
    { id: 'charmy', part: '？？？', text: '最後まで姿は見えない。でも、いつもどこかでダサザウルスを見ている……らしい。', silhouette: true },
  ];

  /* ---------- 画面遷移 ---------- */
  let current = 'title';
  function show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
    current = name;
    if (name === 'home') { Audio.startBGM('menu'); renderHome(); }
    if (name === 'game') Audio.startBGM('play');
    if (name === 'live') Audio.stopBGM();
  }

  document.querySelectorAll('.btn-back[data-back]').forEach((b) => {
    b.addEventListener('click', () => { Audio.unlock(); Audio.sfx('uiback'); show(b.dataset.back); });
  });

  /* ---------- タイトル ---------- */
  function bandLineup(el, opt) {
    el.innerHTML = MEMBER_IDS.map((id, i) =>
      `<div class="band-member m-${id}" style="animation-delay:${i * 0.18}s">${Chars.charSVG(id, opt)}</div>`
    ).join('');
  }
  bandLineup($('title-band'));

  $('btn-title-start').addEventListener('click', () => {
    Audio.unlock(); Audio.sfx('ui');
    show('home');
  });

  /* ---------- ホーム ---------- */
  function renderHome() {
    // ステージの道のり
    const j = $('journey');
    j.innerHTML = Cards.STAGES.map((s, i) => {
      const state = i < save.stageIndex ? 'done' : i === save.stageIndex ? 'now' : 'todo';
      return `<div class="j-node ${state}"><span class="j-icon">${s.icon}</span><span class="j-name">${s.name}</span></div>`;
    }).join('<i class="j-road"></i>');
    const st = Cards.STAGES[save.stageIndex];
    $('journey-desc').textContent = `つぎのライブ会場：${st.name} — ${st.desc}`;

    bandLineup($('home-band'));

    // 難易度ボタン
    const dg = $('diff-grid');
    dg.innerHTML = Cards.DIFFICULTIES.map((d) => {
      const best = save.best[d.id];
      const bestText = best ? `ベスト ${best.moves}手` : 'みちのり はこれから';
      return `<button class="diff-card d-${d.id}" data-diff="${d.id}">
        <b>${d.name}</b><span class="diff-size">${d.label}</span><small>${bestText}</small>
      </button>`;
    }).join('');
    dg.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => { Audio.unlock(); Audio.sfx('ui'); startGame(b.dataset.diff); });
    });
  }

  $('btn-home-members').addEventListener('click', () => { Audio.sfx('ui'); renderMembers(); show('members'); });
  $('btn-home-howto').addEventListener('click', () => { Audio.sfx('ui'); show('howto'); });
  $('btn-home-settings').addEventListener('click', () => { Audio.sfx('ui'); renderSettings(); show('settings'); });

  /* ---------- メンバー ---------- */
  function renderMembers() {
    $('member-list').innerHTML = MEMBER_PROFILES.map((m) => {
      const hidden = m.secret && !save.dokiSeen;
      const art = m.silhouette ? Chars.charSVG('charmy')
        : hidden ? `<div class="member-unknown">？</div>`
        : Chars.charSVG(m.id);
      const name = hidden ? '？？？' : CHAR_NAMES[m.id];
      const text = hidden ? 'めったに出ない、ひみつのなかま。カードのどこかで待っている……。' : m.text;
      return `<div class="member-card ${m.silhouette ? 'is-silhouette' : ''}">
        <div class="member-art">${art}</div>
        <div class="member-info"><b>${name}</b><span class="member-part">${m.part}</span><p>${text}</p></div>
      </div>`;
    }).join('');
  }

  /* ---------- せってい ---------- */
  function renderSettings() {
    $('set-sfx').checked = save.sfx;
    $('set-bgm').checked = save.bgm;
    const rl = $('records-list');
    const rows = [
      ['クリアかいすう', save.totalClears + ' 回'],
      ['いまの会場', Cards.STAGES[save.stageIndex].name],
      ['DOKIDOKI', save.dokiSeen ? '会えた！💗' : 'まだ会えていない'],
    ];
    Cards.DIFFICULTIES.forEach((d) => {
      const b = save.best[d.id];
      if (b) rows.push([d.name + ' ベスト', `${b.moves}手 / ${fmtTime(b.timeMs)}`]);
    });
    rl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
  $('set-sfx').addEventListener('change', (e) => { save.sfx = e.target.checked; Audio.setSfx(save.sfx); persist(); });
  $('set-bgm').addEventListener('change', (e) => {
    save.bgm = e.target.checked; Audio.setBgm(save.bgm); persist();
    if (save.bgm) Audio.startBGM(current === 'game' ? 'play' : 'menu');
  });
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('プレイきろくを けしますか？')) return;
    save = defaultSave(); persist(); renderSettings(); Audio.sfx('uiback');
  });
  Audio.setSfx(save.sfx); Audio.setBgm(save.bgm);

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /* ---------- ゲーム ---------- */
  let game = null;
  let picker = null;
  let diff = null;
  let startedAt = 0;
  let talkTimer = null;
  let missTimer = null;

  const ITEM_MAP = {};
  Cards.ITEM_CARDS.forEach((c) => { ITEM_MAP[c.id] = c; });

  function cardFaceHTML(id) {
    if (id === Cards.DOKI_CARD.id) {
      return `<div class="face-member face-doki">${Chars.charSVG('dokidoki')}</div>`;
    }
    if (MEMBER_IDS.indexOf(id) !== -1) {
      return `<div class="face-member">${Chars.charSVG(id)}</div><span class="face-name">${CHAR_NAMES[id]}</span>`;
    }
    const item = ITEM_MAP[id];
    return `<span class="face-emoji">${item.emoji}</span><span class="face-name">${item.name}</span>`;
  }

  function startGame(diffId) {
    diff = Cards.DIFFICULTIES.find((d) => d.id === diffId);
    const dokiChance = diffId === 'legend' ? 0.15 : 0.07;
    game = new Engine.MemoryGame({ cols: diff.cols, rows: diff.rows, dokiChance });
    picker = new Engine.ReactionPicker(Math.random);
    startedAt = Date.now();
    clearTimeout(missTimer);
    const combo = $('combo-pop');
    combo.textContent = '';
    combo.classList.remove('show');

    // ステージ背景
    const stage = Cards.STAGES[save.stageIndex];
    const bg = $('stage-bg');
    bg.className = 'stage-bg s-' + stage.id;
    $('stage-deco').innerHTML = stageDecoHTML(stage.id);
    $('hud-stage').textContent = `${stage.icon} ${stage.name}`;

    // 盤面
    const board = $('board');
    board.className = 'board cols-' + diff.cols;
    board.style.setProperty('--cols', diff.cols);
    board.innerHTML = game.deck.map((id, i) => `
      <button class="card" data-i="${i}" aria-label="カード${i + 1}">
        <div class="card-inner">
          <div class="card-back">🦕</div>
          <div class="card-face">${cardFaceHTML(id)}</div>
        </div>
      </button>`).join('');
    board.querySelectorAll('.card').forEach((c) => {
      c.addEventListener('click', () => onFlip(Number(c.dataset.i)));
    });

    updateHud();
    show('game');
    talk(picker.pick('start'));
  }

  function updateHud() {
    $('hud-left').textContent = game.pairs - game.matchedPairs;
    $('hud-moves').textContent = game.moves;
  }

  function cardEl(i) { return $('board').querySelector(`.card[data-i="${i}"]`); }

  function onFlip(i) {
    if (!game) return;
    const ev = game.flip(i);
    if (ev.type === 'reject') return;
    Audio.unlock();

    const el = cardEl(i);
    el.classList.add('open');
    Audio.sfx('flip');

    if (ev.type === 'first') {
      // 1枚目：ときどきひとこと（毎回だとテンポが落ちるので半分くらい）
      if (Math.random() < 0.5) talk(picker.pick('first'));
      return;
    }

    updateHud();

    if (ev.type === 'match') {
      const [a, b] = ev.indices;
      setTimeout(() => {
        cardEl(a).classList.add('matched');
        cardEl(b).classList.add('matched');
      }, 260);

      if (ev.isDoki) {
        save.dokiSeen = true; persist();
        Audio.sfx('doki');
        showDokiCutin();
        talk(picker.pick('doki'));
      } else if (ev.combo >= 2) {
        Audio.sfx('match', { combo: ev.combo });
        popCombo(ev.combo);
        talk(picker.pick('combo'));
      } else {
        Audio.sfx('match');
        talk(picker.pick('match'));
      }

      if (ev.cleared) {
        setTimeout(() => onClear(), 1100);
      }
      return;
    }

    // miss
    const missIdx = ev.indices;
    const lines = picker.pick('miss');
    if (lines[0].sleeping) Audio.sfx('sleep'); else Audio.sfx('miss');
    talk(lines);
    missTimer = setTimeout(() => {
      game.closeMiss();
      missIdx.forEach((k) => cardEl(k).classList.remove('open'));
    }, 900);
  }

  /* コンボ表示 */
  function popCombo(n) {
    const el = $('combo-pop');
    el.textContent = n + ' コンボ！！';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  /* 隠しキャラカットイン */
  function showDokiCutin() {
    const c = $('doki-cutin');
    $('doki-char').innerHTML = Chars.charSVG('dokidoki');
    c.hidden = false;
    setTimeout(() => { c.hidden = true; }, 2200);
  }

  /* ---------- 吹き出し（キャラのひとこと） ---------- */
  function talk(entries) {
    clearTimeout(talkTimer);
    const showOne = (idx) => {
      const e = entries[idx];
      const bar = $('talk-bar');
      const art = e.c === 'shibakuzo'
        ? Chars.charSVG('shibakuzo', { sleeping: !!e.sleeping })
        : Chars.charSVG(e.c);
      $('talk-avatar').innerHTML = art;
      $('talk-name').textContent = CHAR_NAMES[e.c];
      $('talk-text').textContent = e.t;
      bar.classList.remove('pop');
      void bar.offsetWidth;
      bar.classList.add('pop');
      if (idx + 1 < entries.length) {
        talkTimer = setTimeout(() => showOne(idx + 1), 1500);
      }
    };
    showOne(0);
  }

  $('btn-game-quit').addEventListener('click', () => {
    Audio.sfx('uiback');
    clearTimeout(missTimer);
    show('home');
  });

  /* ---------- ステージ装飾 ---------- */
  function stageDecoHTML(id) {
    const D = {
      park:       ['🌳', '🛝', '🕊️', '🌼', '🌳'],
      restaurant: ['🍕', '🪑', '🕯️', '🍝', '🧀'],
      mountain:   ['⛰️', '🌲', '⭐', '🏕️', '🌙'],
      livehouse:  ['🎸', '🔊', '🍺', '📣', '💡'],
      makuhari:   ['🏟️', '🎆', '📣', '🎇', '✨'],
    };
    return (D[id] || D.park).map((e, i) => `<span class="deco d${i}">${e}</span>`).join('');
  }

  /* ---------- クリア → ライブ演出 ---------- */
  function onClear() {
    const timeMs = Date.now() - startedAt;
    const stage = Cards.STAGES[save.stageIndex];

    // 記録更新
    save.totalClears++;
    const best = save.best[diff.id];
    if (!best || game.moves < best.moves) save.best[diff.id] = { moves: game.moves, timeMs };
    persist();

    talk(picker.pick('clear'));

    // ライブ画面セットアップ
    const bg = $('live-bg');
    bg.className = 'live-bg s-' + stage.id;
    $('live-deco').innerHTML = stageDecoHTML(stage.id);
    $('live-title').textContent = `🎤 ${stage.name}ライブ、スタート！！`;
    bandLineup($('live-band'), { sleeping: false });
    $('live-band').classList.add('playing');

    // 観客（少ないけど、みんな最高の笑顔）＋チャーミーのシルエット演出
    const AUD = ['😆', '🥰', '😄', '🤩', '😊', '🦖', '🕊️', '👶', '🧑‍🦱', '👧', '👵', '🧔'];
    const n = stage.audience;
    let audHtml = '';
    for (let k = 0; k < n; k++) {
      audHtml += `<span class="aud" style="animation-delay:${(k % 5) * 0.12}s">${AUD[k % AUD.length]}</span>`;
    }
    // 最後のひとり：会場のすみの、名前のわからない影
    audHtml += `<span class="aud aud-charmy" title="？？？">${Chars.charSVG('charmy')}</span>`;
    $('live-audience').innerHTML = audHtml;

    const captions = {
      park: 'お客さんは ハトと子どもだけ。でも、みんな最高の笑顔で演奏した。',
      restaurant: '拍手より フォークの音のほうが大きい。それでも、アンコールが1回きた。',
      mountain: '星空が スポットライトの代わりだった。声は、どこまでも届いた。',
      livehouse: '手売りのチケット、ぜんぶで14枚。ぜんいんの顔と名前を覚えている。',
      makuhari: 'まだ見ぬステージのはずだった場所に、いま立っている。',
    };
    $('live-caption').textContent = captions[stage.id] || captions.park;

    $('notify').hidden = true;
    $('result-card').hidden = true;
    spawnConfetti();
    show('live');
    setTimeout(() => Audio.sfx('fanfare'), 700);
    Audio.cheer(0.4 + stage.audience * 0.03);

    // スマホ通知 →「？？？」からのメッセージ
    setTimeout(() => {
      $('notify').hidden = false;
      Audio.sfx('notify');
    }, 3600);

    // リザルト
    setTimeout(() => {
      const isLast = save.stageIndex >= Cards.STAGES.length - 1;
      $('result-title').textContent = `${stage.name}ライブ 大せいこう！`;
      $('res-moves').textContent = game.moves;
      $('res-time').textContent = fmtTime(timeMs);
      $('res-combo').textContent = game.maxCombo;
      $('result-note').textContent = isLast
        ? '幕張のステージに立った。それでも夢は、まだ続く。'
        : `つぎの会場は「${Cards.STAGES[save.stageIndex + 1].name}」！`;
      $('btn-res-next').textContent = isLast ? '🎸 もういちど 幕張ライブ！' : '🎸 つぎのステージへ！';
      $('result-card').hidden = false;

      // ステージを進める（最後は幕張のまま）
      if (!isLast) { save.stageIndex++; persist(); Audio.sfx('stageup'); }
    }, 5600);
  }

  $('btn-res-next').addEventListener('click', () => {
    Audio.sfx('ui');
    startGame(diff.id);
  });
  $('btn-res-home').addEventListener('click', () => {
    Audio.sfx('uiback');
    show('home');
  });

  /* ---------- 紙吹雪 ---------- */
  function spawnConfetti() {
    const box = $('confetti');
    const colors = ['#ff6b8a', '#ffd23f', '#5ad1a5', '#6fb8ff', '#c58aff', '#ff9d5c'];
    let html = '';
    for (let i = 0; i < 60; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 2.4;
      const dur = 2.6 + Math.random() * 2;
      const c = colors[i % colors.length];
      const w = 6 + Math.random() * 6;
      html += `<i style="left:${left}%;background:${c};width:${w}px;height:${w * 0.6}px;
        animation-delay:${delay}s;animation-duration:${dur}s"></i>`;
    }
    box.innerHTML = html;
  }

  /* ---------- iOSダブルタップズーム抑止 ---------- */
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 350) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

})();
