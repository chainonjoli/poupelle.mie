/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   キャラクターアート（SVG・外部画像不要）
   公式ビジュアル準拠：恐竜マスクをかぶった普段着のバンド。
   ・タケル憧れ : 赤ティラノマスク＋白T（ピンクで名前）＋黒短パン
   ・ファンキー無糖 : 青ティラノマスク＋白T（無糖）＋青パンツ
   ・大騒テラコ : 橙トリケラマスク＋オレンジのつなぎ＋両手上げ
   ・SHIBAKUZO : 緑ティラノマスク＋白T（しばくぞ）＋マスタードパンツ
   ・DOKIDOKI : 赤のつるっとマスク＋全身黒＋両手を頬に（隠しキャラ）
   ・チャーミー : シルエットのみ（姿は最後まで見せない）
   ========================================================= */
(function (global) {
  'use strict';

  const SKIN = '#f2c79b';
  const SKIN_D = '#cf9a66';

  /* ---------- マスク（頭部。y14〜60あたりに描く） ---------- */

  /* ティラノ系ゴムマスク：大きな開いた口＋ギザ歯 */
  function trexMask(c, d) {
    return `
      <g class="dz-mask">
        <path d="M34 50 Q28 18 60 13 Q92 18 86 50 Q86 60 76 60 L44 60 Q34 60 34 50 Z"
              fill="${c}" stroke="${d}" stroke-width="2.5"/>
        <!-- 開いた口 -->
        <path d="M40 37 Q60 31 80 37 L78 55 Q60 61 42 55 Z" fill="#5a2026"/>
        <!-- 上の歯 -->
        <path d="M42 35 L78 35 L78 38 L75 45 L72 38 L69 45 L66 38 L63 45 L60 38 L57 45 L54 38 L51 45 L48 38 L45 45 L42 38 Z" fill="#fff"/>
        <!-- 下の歯 -->
        <path d="M44 56 L76 56 L76 54 L73 48 L70 54 L67 48 L64 54 L61 48 L58 54 L55 48 L52 54 L49 48 L46 54 L44 54 Z" fill="#fff"/>
        <!-- 目 -->
        <circle cx="46" cy="25" r="5" fill="#fff"/><circle cx="46.6" cy="25.6" r="2.3" fill="#26221e"/>
        <circle cx="74" cy="25" r="5" fill="#fff"/><circle cx="73.4" cy="25.6" r="2.3" fill="#26221e"/>
        <!-- 鼻の穴・ゴムのしわ -->
        <circle cx="55" cy="17" r="1.5" fill="${d}"/><circle cx="65" cy="17" r="1.5" fill="${d}"/>
        <path d="M38 30 Q36 26 38 22 M82 30 Q84 26 82 22" fill="none" stroke="${d}" stroke-width="1.6" opacity=".7"/>
      </g>`;
  }

  /* トリケラトプスマスク：フリル＋3本ツノ＋くちばし */
  function triceraMask(c, d) {
    return `
      <g class="dz-mask">
        <!-- フリル -->
        <path d="M60 8 Q92 8 94 36 Q94 52 78 54 L42 54 Q26 52 26 36 Q28 8 60 8 Z"
              fill="${d}" stroke="${d}" stroke-width="2"/>
        <path d="M60 12 Q88 12 90 36 Q90 48 76 50 L44 50 Q30 48 30 36 Q32 12 60 12 Z" fill="${c}"/>
        <!-- 顔 -->
        <path d="M40 46 Q38 24 60 22 Q82 24 80 46 Q80 58 60 58 Q40 58 40 46 Z"
              fill="${c}" stroke="${d}" stroke-width="2.5"/>
        <!-- ツノ（眉2本＋鼻1本） -->
        <path d="M45 26 Q41 14 47 10 Q51 18 51 26 Z" fill="#f5ead0" stroke="#c9b98a" stroke-width="1.6"/>
        <path d="M75 26 Q79 14 73 10 Q69 18 69 26 Z" fill="#f5ead0" stroke="#c9b98a" stroke-width="1.6"/>
        <path d="M57 47 Q60 40 63 47 Q63 52 60 52 Q57 52 57 47 Z" fill="#f5ead0" stroke="#c9b98a" stroke-width="1.4"/>
        <!-- 目 -->
        <circle cx="49" cy="36" r="4.6" fill="#fff"/><circle cx="49.6" cy="36.6" r="2.1" fill="#26221e"/>
        <circle cx="71" cy="36" r="4.6" fill="#fff"/><circle cx="70.4" cy="36.6" r="2.1" fill="#26221e"/>
        <!-- くちばし -->
        <path d="M52 54 Q60 60 68 54" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>
      </g>`;
  }

  /* つるっとした赤マスク（DOKIDOKI）：目穴＋おでこにハート */
  function roundMask(c, d) {
    return `
      <g class="dz-mask">
        <path d="M34 42 Q34 14 60 14 Q86 14 86 42 Q86 60 60 60 Q34 60 34 42 Z"
              fill="${c}" stroke="${d}" stroke-width="2.5"/>
        <ellipse cx="48" cy="38" rx="5" ry="6" fill="#3a1114"/>
        <ellipse cx="72" cy="38" rx="5" ry="6" fill="#3a1114"/>
        <circle cx="49.5" cy="36.5" r="1.6" fill="#fff" opacity=".85"/>
        <circle cx="73.5" cy="36.5" r="1.6" fill="#fff" opacity=".85"/>
        <ellipse cx="60" cy="52" rx="4" ry="2.6" fill="#3a1114"/>
        <path d="M60 20.5 c1.7 -2.6 5.5 -1 5.5 1.7 0 2.3 -3.3 4.5 -5.5 5.8 -2.2 -1.3 -5.5 -3.5 -5.5 -5.8 0 -2.7 3.8 -4.3 5.5 -1.7 Z"
              fill="#fff" opacity=".9"/>
        <path d="M40 24 Q48 18 60 17" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>
      </g>`;
  }

  /* ---------- 体（普段着の人間） ----------
     o: {shirt, shirtD, print, sleeve, pants, pantsD, shorts, legs, shoes, shoesD,
         pose: 'down'|'up'|'cheeks', overall} */
  function body(o) {
    const pose = o.pose || 'down';
    const sleeve = o.sleeve || o.shirt;

    /* 腕 */
    let arms = '';
    if (pose === 'up') {
      arms = `
        <g class="dz-arm-l"><path d="M44 70 L28 44 Q26 40 30 38 Q34 36 36 40 L50 66 Z"
          fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <circle cx="31" cy="41" r="5.5" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <path d="M44 70 L38 60 L48 54 L52 64 Z" fill="${sleeve}" stroke="${o.shirtD}" stroke-width="2"/></g>
        <g class="dz-arm-r"><path d="M76 70 L92 44 Q94 40 90 38 Q86 36 84 40 L70 66 Z"
          fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <circle cx="89" cy="41" r="5.5" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <path d="M76 70 L82 60 L72 54 L68 64 Z" fill="${sleeve}" stroke="${o.shirtD}" stroke-width="2"/></g>`;
    } else if (pose === 'cheeks') {
      arms = `
        <g class="dz-arm-l"><path d="M42 72 Q30 72 30 60 L32 50 Q33 46 37 47 Q40 48 39 52 L38 60 Q40 66 48 66 Z"
          fill="${o.shirt}" stroke="${o.shirtD}" stroke-width="2"/>
          <circle cx="36" cy="50" r="5.5" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/></g>
        <g class="dz-arm-r"><path d="M78 72 Q90 72 90 60 L88 50 Q87 46 83 47 Q80 48 81 52 L82 60 Q80 66 72 66 Z"
          fill="${o.shirt}" stroke="${o.shirtD}" stroke-width="2"/>
          <circle cx="84" cy="50" r="5.5" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/></g>`;
    } else {
      arms = `
        <g class="dz-arm-l">
          <path d="M42 68 Q34 70 33 80 L32 96 Q32 101 36.5 101 Q41 101 41 96 L43 80 Z"
            fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <path d="M42 67 Q35 69 34 78 L45 80 L46 70 Z" fill="${sleeve}" stroke="${o.shirtD}" stroke-width="2"/>
        </g>
        <g class="dz-arm-r">
          <path d="M78 68 Q86 70 87 80 L88 96 Q88 101 83.5 101 Q79 101 79 96 L77 80 Z"
            fill="${SKIN}" stroke="${SKIN_D}" stroke-width="2"/>
          <path d="M78 67 Q85 69 86 78 L75 80 L74 70 Z" fill="${sleeve}" stroke="${o.shirtD}" stroke-width="2"/>
        </g>`;
    }

    /* 脚：ズボン or 短パン＋生足 */
    let legs;
    if (o.shorts) {
      legs = `
        <path d="M46 100 L46 120 Q46 123 49.5 123 L56 123 L58 102 Z" fill="${o.pants}" stroke="${o.pantsD}" stroke-width="2"/>
        <path d="M74 100 L74 120 Q74 123 70.5 123 L64 123 L62 102 Z" fill="${o.pants}" stroke="${o.pantsD}" stroke-width="2"/>
        <rect x="48.5" y="121" width="7" height="16" rx="3.4" fill="${o.legs || SKIN}" stroke="${SKIN_D}" stroke-width="1.6"/>
        <rect x="64.5" y="121" width="7" height="16" rx="3.4" fill="${o.legs || SKIN}" stroke="${SKIN_D}" stroke-width="1.6"/>`;
    } else {
      legs = `
        <path d="M46 100 L46 134 Q46 137 49.5 137 L56 137 L58 102 Z" fill="${o.pants}" stroke="${o.pantsD}" stroke-width="2"/>
        <path d="M74 100 L74 134 Q74 137 70.5 137 L64 137 L62 102 Z" fill="${o.pants}" stroke="${o.pantsD}" stroke-width="2"/>`;
    }

    const shoes = `
      <path d="M45 137 Q44 143 49 143.5 L58 143.5 Q60 143.5 60 140.5 L59 137 Z" fill="${o.shoes}" stroke="${o.shoesD}" stroke-width="1.8"/>
      <path d="M75 137 Q76 143 71 143.5 L62 143.5 Q60 143.5 60 140.5 L61 137 Z" fill="${o.shoes}" stroke="${o.shoesD}" stroke-width="1.8"/>`;

    /* 胴（Tシャツ or つなぎ上半身） */
    const torso = `
      <rect x="53" y="54" width="14" height="12" fill="${SKIN}"/>
      <path d="M44 66 Q60 62 76 66 L78 100 Q60 105 42 100 Z"
            fill="${o.shirt}" stroke="${o.shirtD}" stroke-width="2.5"/>
      ${o.print || ''}`;

    return legs + shoes + arms + torso;
  }

  /* Tシャツの縦書きネーム */
  function shirtText(chars, color, x, y0, size) {
    const s = size || 7.5;
    return `<text x="${x}" y="${y0}" font-size="${s}" text-anchor="middle" fill="${color}"
      font-family="sans-serif" font-weight="bold">` +
      chars.split('').map((ch, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : s + 0.8}">${ch}</tspan>`).join('') +
      '</text>';
  }

  const ART = {
    /* タケル憧れ：赤ティラノマスク＋白T（ピンクで「タケル憧れ」）＋黒短パン＋赤ソックス */
    takeru() {
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g class="dz-char">
          ${body({
            shirt: '#f7f4ec', shirtD: '#c9c2b2',
            print: shirtText('タケル憧れ', '#f0799e', 60, 74, 6.6),
            pants: '#3a3a40', pantsD: '#222226', shorts: true,
            legs: SKIN,
            shoes: '#2c2c30', shoesD: '#111114',
          })}
          <!-- 赤ソックス -->
          <rect x="48" y="130" width="8" height="8" fill="#e0453a"/>
          <rect x="64" y="130" width="8" height="8" fill="#e0453a"/>
          <g class="dz-head">${trexMask('#d93a30', '#9c231c')}</g>
        </g>
      </svg>`;
    },

    /* ファンキー無糖：青ティラノマスク＋白T（無糖）＋青パンツ＋無糖ブラック缶 */
    funky() {
      const can = `
        <g class="dz-can">
          <rect x="83" y="92" width="11" height="16" rx="2.5" fill="#2b2b30" stroke="#111" stroke-width="1.6"/>
          <rect x="83" y="96" width="11" height="5.6" fill="#f2f2f2"/>
          <text x="88.5" y="100.6" font-size="4.4" text-anchor="middle" fill="#2b2b30"
                font-family="sans-serif" font-weight="bold">無糖</text>
          <ellipse cx="88.5" cy="92" rx="5.5" ry="1.8" fill="#9aa0a8"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g class="dz-char">
          ${body({
            shirt: '#f7f4ec', shirtD: '#c9c2b2',
            print: `<text x="60" y="80" font-size="7" text-anchor="middle" fill="#3a5fa8"
              font-family="sans-serif" font-weight="bold">無糖</text>`,
            pants: '#4a7fd0', pantsD: '#2f5a96',
            shoes: '#f2f2f2', shoesD: '#b9b9bd',
          })}
          <!-- リストバンド -->
          <rect x="31.5" y="92" width="10" height="5" rx="2.5" fill="#2f5a96"/>
          ${can}
          <g class="dz-head">${trexMask('#2f6fd6', '#1c4a99')}</g>
        </g>
      </svg>`;
    },

    /* 大騒テラコ：橙トリケラマスク＋オレンジのつなぎ＋両手を上げて大騒ぎ */
    terako() {
      const nametag = `
        <rect x="52" y="72" width="16" height="9" rx="2" fill="#fff" stroke="#c9c2b2" stroke-width="1.4"/>
        <text x="60" y="78.6" font-size="5" text-anchor="middle" fill="#c96f24"
              font-family="sans-serif" font-weight="bold">テラコ</text>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g class="dz-char">
          ${body({
            shirt: '#ee6f1e', shirtD: '#bf4f0e',
            print: nametag + `<path d="M52 66 L52 100 M68 66 L68 100" stroke="#bf4f0e" stroke-width="1.6" opacity=".5"/>`,
            pants: '#ee6f1e', pantsD: '#bf4f0e',
            shoes: '#e0453a', shoesD: '#9c231c',
            pose: 'up',
          })}
          <g class="dz-head">${triceraMask('#f07a2e', '#b34e13')}</g>
        </g>
      </svg>`;
    },

    /* SHIBAKUZO：緑ティラノマスク＋白T（しばくぞ）＋マスタードパンツ＋サンダル＋zzz */
    shibakuzo(opt) {
      const sleeping = !opt || opt.sleeping !== false;
      const zzz = `
        <g class="dz-zzz" font-family="sans-serif" font-weight="bold" fill="#8fb8e8">
          <text x="92" y="26" font-size="13">z</text>
          <text x="100" y="17" font-size="10">z</text>
          <text x="107" y="10" font-size="7">z</text>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g class="dz-char">
          ${body({
            shirt: '#f7f4ec', shirtD: '#c9c2b2',
            print: shirtText('しばくぞ', '#3f9b45', 60, 75, 7.2),
            pants: '#c8963e', pantsD: '#96692a',
            shoes: '#8a5a2b', shoesD: '#5c3a17',
          })}
          <!-- サンダルの鼻緒 -->
          <path d="M50 139 l4 3 M70 139 l-4 3" stroke="#5c3a17" stroke-width="1.6"/>
          <g class="dz-head">
            ${trexMask('#3f9b45', '#276b2c')}
            <!-- 眠そうな半目まぶた -->
            <path d="M40.5 24 A 5.5 5.5 0 0 1 51.5 24" fill="#3f9b45"/>
            <path d="M68.5 24 A 5.5 5.5 0 0 1 79.5 24" fill="#3f9b45"/>
            <line x1="41" y1="24.5" x2="51" y2="24.5" stroke="#26221e" stroke-width="1.8"/>
            <line x1="69" y1="24.5" x2="79" y2="24.5" stroke="#26221e" stroke-width="1.8"/>
            ${sleeping ? zzz : ''}
          </g>
        </g>
      </svg>`;
    },

    /* DOKIDOKI：赤のつるっとマスク＋全身黒＋両手を頬に当てるドキドキポーズ */
    dokidoki() {
      const sparkles = `
        <g fill="#ffd23f">
          <path d="M22 30 l2 -4.5 2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 Z"/>
          <path d="M92 24 l1.6 -3.6 1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 Z"/>
          <circle cx="26" cy="66" r="2"/>
          <circle cx="96" cy="60" r="2"/>
        </g>
        <g fill="#ff5f8f">
          <path d="M18 48 c1.4 -2.2 4.6 -0.8 4.6 1.4 0 1.9 -2.8 3.8 -4.6 4.9 -1.8 -1.1 -4.6 -3 -4.6 -4.9 0 -2.2 3.2 -3.6 4.6 -1.4 Z"/>
          <path d="M100 42 c1.2 -1.9 4 -0.7 4 1.2 0 1.6 -2.4 3.3 -4 4.2 -1.6 -0.9 -4 -2.6 -4 -4.2 0 -1.9 2.8 -3.1 4 -1.2 Z"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g class="dz-char">
          ${body({
            shirt: '#2b2b30', shirtD: '#141417',
            print: `<path d="M60 80 c1.4 -2.2 4.6 -0.8 4.6 1.4 0 1.9 -2.8 3.8 -4.6 4.9 -1.8 -1.1 -4.6 -3 -4.6 -4.9 0 -2.2 3.2 -3.6 4.6 -1.4 Z" fill="#ff5f8f"/>`,
            pants: '#2b2b30', pantsD: '#141417',
            shoes: '#3a3a40', shoesD: '#1c1c20',
            pose: 'cheeks',
          })}
          <g class="dz-head">${roundMask('#d5352f', '#951b16')}</g>
          ${sparkles}
        </g>
      </svg>`;
    },

    /* チャーミー：最後までシルエットのみ。ローブ姿の誰か */
    charmy() {
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g fill="#221a3d">
          <!-- とんがりマスクの影 -->
          <path d="M42 44 Q40 18 60 14 Q74 12 84 22 Q94 30 88 42 Q86 52 74 54 L48 54 Q42 52 42 44 Z"/>
          <!-- ローブ -->
          <path d="M44 54 Q60 48 76 54 L86 130 Q88 140 78 140 L42 140 Q32 140 34 130 Z"/>
          <path d="M40 66 Q28 76 30 92 L40 90 Z M80 66 Q92 76 90 92 L80 90 Z"/>
          <ellipse cx="52" cy="143" rx="9" ry="4"/>
          <ellipse cx="70" cy="143" rx="9" ry="4"/>
        </g>
        <g fill="#ffd23f" opacity=".9">
          <path d="M94 20 l2 -4.5 2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 Z"/>
          <circle cx="24" cy="40" r="2"/>
          <circle cx="100" cy="66" r="1.6"/>
        </g>
      </svg>`;
    },
  };

  /* キャラクターIDからSVG文字列を返す */
  function charSVG(id, opt) {
    const fn = ART[id] || ART.takeru;
    return fn(opt);
  }

  const DZChars = { charSVG };
  if (typeof module !== 'undefined' && module.exports) module.exports = DZChars;
  global.DZChars = DZChars;
})(typeof window !== 'undefined' ? window : globalThis);
