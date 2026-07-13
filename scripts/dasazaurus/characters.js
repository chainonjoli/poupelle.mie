/* =========================================================
   ダサザウルス ～まだ見ぬステージへ～
   キャラクターアート（SVG・外部画像不要）
   バンドザウルスに憧れる、まだ無名の恐竜バンド。
   ・タケル憧れ : 緑ボディ＋赤ハチマキ＋白バンドタオル（Vo）
   ・ファンキー無糖 : 青ボディ＋丸メガネ＋無糖コーヒー（Ba）
   ・大騒テラコ : オレンジのプテラ娘＋メガホン＋大口（応援&Dr）
   ・SHIBAKUZO : うす紫ボディ＋ナイトキャップ＋居眠り（Gt）
   ・DOKIDOKI : ピンク＋ハートのツノ（隠しキャラ）
   ・チャーミー : シルエットのみ（姿は最後まで見せない）
   ========================================================= */
(function (global) {
  'use strict';

  /* 共通：正面向きの恐竜ベース
     o: {skin, dark, belly, eyes, mouth, extra, armL, armR, spikes} */
  function dinoBase(o) {
    const spikes = o.spikes !== false ? `
      <path d="M38 22 L44 8 L50 21 Z" fill="${o.dark}"/>
      <path d="M52 18 L60 4 L68 18 Z" fill="${o.dark}"/>
      <path d="M70 21 L76 8 L82 22 Z" fill="${o.dark}"/>` : '';
    return `
      <g class="dz-char">
        <!-- しっぽ -->
        <path d="M86 118 Q112 122 108 100 Q106 92 98 96 Q100 104 92 106 Z"
              fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>
        <!-- 足 -->
        <ellipse cx="46" cy="141" rx="12" ry="7" fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>
        <ellipse cx="74" cy="141" rx="12" ry="7" fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>
        <!-- 体 -->
        <ellipse cx="60" cy="112" rx="29" ry="27" fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>
        <ellipse cx="60" cy="116" rx="19" ry="18" fill="${o.belly}"/>
        <!-- 腕 -->
        ${o.armL || `<path class="dz-arm-l" d="M34 104 Q22 108 24 118 Q25 123 31 121 Q35 114 39 109 Z"
              fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>`}
        ${o.armR || `<path class="dz-arm-r" d="M86 104 Q98 108 96 118 Q95 123 89 121 Q85 114 81 109 Z"
              fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>`}
        <!-- 頭 -->
        <g class="dz-head">
          ${spikes}
          <circle cx="60" cy="52" r="33" fill="${o.skin}" stroke="${o.dark}" stroke-width="2.5"/>
          <!-- 口まわり -->
          <ellipse cx="60" cy="66" rx="19" ry="12" fill="${o.belly}"/>
          <circle cx="53" cy="61" r="1.7" fill="${o.dark}"/>
          <circle cx="67" cy="61" r="1.7" fill="${o.dark}"/>
          ${o.mouth}
          ${o.eyes}
          ${o.extra || ''}
        </g>
      </g>`;
  }

  /* 目のバリエーション */
  function eyesSparkle() {
    return `
      <g class="dz-eyes">
        <circle cx="46" cy="46" r="8" fill="#fff"/><circle cx="74" cy="46" r="8" fill="#fff"/>
        <circle cx="47" cy="47" r="4.5" fill="#26221e"/><circle cx="73" cy="47" r="4.5" fill="#26221e"/>
        <circle cx="48.6" cy="45" r="1.6" fill="#fff"/><circle cx="74.6" cy="45" r="1.6" fill="#fff"/>
        <path d="M42 44 l1.2 -2.6 1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 Z" fill="#fff" opacity=".9"/>
      </g>`;
  }
  function eyesCalm(dark) {
    return `
      <g class="dz-eyes">
        <circle cx="46" cy="47" r="7.5" fill="#fff"/><circle cx="74" cy="47" r="7.5" fill="#fff"/>
        <circle cx="46" cy="48.5" r="4" fill="#26221e"/><circle cx="74" cy="48.5" r="4" fill="#26221e"/>
        <path d="M38.5 43 A 8 8 0 0 1 53.5 43" fill="${dark}"/>
        <path d="M66.5 43 A 8 8 0 0 1 81.5 43" fill="${dark}"/>
        <line x1="39" y1="43.5" x2="53" y2="43.5" stroke="#26221e" stroke-width="2"/>
        <line x1="67" y1="43.5" x2="81" y2="43.5" stroke="#26221e" stroke-width="2"/>
      </g>`;
  }
  function eyesShout() {
    return `
      <g class="dz-eyes">
        <path d="M39 46 A 7.5 7.5 0 0 1 53 44" fill="none" stroke="#26221e" stroke-width="3" stroke-linecap="round"/>
        <path d="M67 44 A 7.5 7.5 0 0 1 81 46" fill="none" stroke="#26221e" stroke-width="3" stroke-linecap="round"/>
        <circle cx="40" cy="56" r="4" fill="#ff9d9d" opacity=".75"/>
        <circle cx="80" cy="56" r="4" fill="#ff9d9d" opacity=".75"/>
      </g>`;
  }
  function eyesSleepy() {
    return `
      <g class="dz-eyes">
        <path d="M39 49 Q46 53 53 49" fill="none" stroke="#26221e" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M67 49 Q74 53 81 49" fill="none" stroke="#26221e" stroke-width="2.8" stroke-linecap="round"/>
      </g>`;
  }
  function eyesHeart() {
    return `
      <g class="dz-eyes">
        <circle cx="46" cy="46" r="8" fill="#fff"/><circle cx="74" cy="46" r="8" fill="#fff"/>
        <circle cx="46" cy="47" r="4.6" fill="#26221e"/><circle cx="74" cy="47" r="4.6" fill="#26221e"/>
        <path d="M46 44.2 c1 -1.6 3.4 -0.6 3.4 1 0 1.4 -2 2.8 -3.4 3.6 -1.4 -0.8 -3.4 -2.2 -3.4 -3.6 0 -1.6 2.4 -2.6 3.4 -1 Z" fill="#ff5f8f"/>
        <path d="M74 44.2 c1 -1.6 3.4 -0.6 3.4 1 0 1.4 -2 2.8 -3.4 3.6 -1.4 -0.8 -3.4 -2.2 -3.4 -3.6 0 -1.6 2.4 -2.6 3.4 -1 Z" fill="#ff5f8f"/>
      </g>`;
  }

  /* 口のバリエーション */
  function mouthGrin(dark) {
    return `
      <path d="M46 64 Q60 76 74 64 Q68 72 60 72 Q52 72 46 64 Z" fill="#8f3b45"/>
      <path d="M50 66 l3 4 3 -4 Z" fill="#fff"/><path d="M64 66 l3 4 3 -4 Z" fill="#fff"/>
      <path d="M46 64 Q60 76 74 64" fill="none" stroke="${dark}" stroke-width="2"/>`;
  }
  function mouthFlat(dark) {
    return `<path d="M52 67 Q60 70 68 67" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  function mouthShout(dark) {
    return `
      <ellipse cx="60" cy="68" rx="11" ry="8.5" fill="#8f3b45" stroke="${dark}" stroke-width="2"/>
      <ellipse cx="60" cy="72" rx="6" ry="3.4" fill="#e0567a"/>
      <path d="M52 62.5 l3 3.6 3 -3.6 Z" fill="#fff"/><path d="M62 62.5 l3 3.6 3 -3.6 Z" fill="#fff"/>`;
  }
  function mouthSleep(dark) {
    return `
      <path d="M54 67 Q60 71 66 67" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
      <path class="dz-drool" d="M66 68 q3 4 1 8 q-1 2 -2.4 0.6 q-1 -3 1.4 -8.6" fill="#bfe6ff" opacity=".9"/>`;
  }

  const ART = {
    /* タケル憧れ：前向きなボーカル。赤ハチマキ＋白バンドタオル */
    takeru() {
      const hachimaki = `
        <g>
          <path d="M28 36 Q60 26 92 36 L92 44 Q60 34 28 44 Z" fill="#e0453a" stroke="#a82c23" stroke-width="2"/>
          <circle cx="60" cy="34" r="3.2" fill="#fff"/>
          <path d="M90 38 q10 -2 12 6 q-6 0 -9 3 Z" fill="#e0453a" stroke="#a82c23" stroke-width="1.5"/>
          <path d="M92 42 q8 4 6 12 q-5 -3 -8 -4 Z" fill="#e0453a" stroke="#a82c23" stroke-width="1.5"/>
        </g>`;
      const towel = `
        <g>
          <path d="M38 88 Q60 80 82 88 L82 97 Q60 89 38 97 Z" fill="#f7f4ec" stroke="#c9c2b2" stroke-width="2"/>
          <path d="M42 89.5 L42 95.5 M50 87.5 L50 93.5 M70 87.5 L70 93.5 M78 89.5 L78 95.5"
                stroke="#e0453a" stroke-width="2.4"/>
          <rect x="72" y="93" width="9" height="14" rx="2" fill="#f7f4ec" stroke="#c9c2b2" stroke-width="2"/>
          <path d="M73.5 104 l2 3 M77 104 l2 3" stroke="#e0453a" stroke-width="1.6"/>
        </g>`;
      const armR = `
        <g class="dz-arm-r">
          <path d="M86 102 Q100 96 100 84 Q100 78 94 80 Q88 90 82 100 Z"
                fill="#58b368" stroke="#3a8a4d" stroke-width="2.5"/>
          <circle cx="97" cy="81" r="6" fill="#58b368" stroke="#3a8a4d" stroke-width="2.5"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        ${dinoBase({ skin: '#58b368', dark: '#3a8a4d', belly: '#dcf2c5',
          eyes: eyesSparkle(), mouth: mouthGrin('#3a8a4d'),
          extra: hachimaki, armR })}
        ${towel}
      </svg>`;
    },

    /* ファンキー無糖：冷静なベース。丸メガネ＋無糖ブラック缶 */
    funky() {
      const glasses = `
        <g fill="none" stroke="#3d3a34" stroke-width="2.6">
          <circle cx="46" cy="47" r="10.5"/>
          <circle cx="74" cy="47" r="10.5"/>
          <path d="M56.5 47 Q60 44.5 63.5 47"/>
          <path d="M35.5 45 L29 42 M84.5 45 L91 42"/>
        </g>`;
      const can = `
        <g class="dz-can">
          <rect x="93" y="105" width="12" height="17" rx="2.5" fill="#2b2b30" stroke="#111" stroke-width="1.6"/>
          <rect x="93" y="109" width="12" height="6" fill="#f2f2f2"/>
          <text x="99" y="114" font-size="4.6" text-anchor="middle" fill="#2b2b30"
                font-family="sans-serif" font-weight="bold">無糖</text>
          <ellipse cx="99" cy="105" rx="6" ry="2" fill="#9aa0a8"/>
        </g>`;
      const armR = `
        <g class="dz-arm-r">
          <path d="M86 104 Q100 104 99 116 Q98 121 92 120 Q87 113 82 108 Z"
                fill="#6f7fb8" stroke="#4c5a8e" stroke-width="2.5"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        ${dinoBase({ skin: '#6f7fb8', dark: '#4c5a8e', belly: '#e2e6f5',
          eyes: eyesCalm('#6f7fb8'), mouth: mouthFlat('#4c5a8e'),
          extra: glasses, armR })}
        ${can}
      </svg>`;
    },

    /* 大騒テラコ：応援団長のプテラ娘。大口＋メガホン＋トサカ */
    terako() {
      const crest = `
        <g>
          <path d="M74 26 Q94 10 102 20 Q96 30 82 34 Z" fill="#e8623a" stroke="#b34423" stroke-width="2"/>
          <path d="M46 22 Q40 12 30 14 Q34 22 42 27 Z" fill="#e8623a" stroke="#b34423" stroke-width="2"/>
          <circle cx="40" cy="30" r="4.5" fill="#ffd23f" stroke="#c99a13" stroke-width="1.5"/>
        </g>`;
      const sash = `
        <g>
          <path d="M40 92 L84 128 L76 134 L34 100 Z" fill="#e0453a" opacity=".92"/>
          <text x="57" y="115" font-size="8.4" fill="#fff" font-family="sans-serif" font-weight="bold"
                transform="rotate(38 57 115)">応援団長</text>
        </g>`;
      const megaphone = `
        <g class="dz-mega">
          <path d="M96 92 L112 84 L112 106 L96 98 Z" fill="#ffd23f" stroke="#c99a13" stroke-width="2"/>
          <rect x="90" y="90.5" width="7" height="9" rx="2" fill="#e8623a" stroke="#b34423" stroke-width="1.6"/>
          <path d="M114 88 l4 -3 M115 95 l5 0 M114 102 l4 3" stroke="#c99a13" stroke-width="2" stroke-linecap="round"/>
        </g>`;
      const armR = `
        <g class="dz-arm-r">
          <path d="M86 102 Q96 96 94 88 Q93 83 88 85 Q84 93 80 102 Z"
                fill="#f2984a" stroke="#c96f24" stroke-width="2.5"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        ${dinoBase({ skin: '#f2984a', dark: '#c96f24', belly: '#ffe3bd', spikes: false,
          eyes: eyesShout(), mouth: mouthShout('#c96f24'),
          extra: crest, armR })}
        ${sash}
        ${megaphone}
      </svg>`;
    },

    /* SHIBAKUZO：いつも眠いギター。ナイトキャップ＋よだれ＋zzz */
    shibakuzo(opt) {
      const sleeping = opt && opt.sleeping;
      const cap = `
        <g>
          <path d="M30 34 Q40 8 74 12 Q94 15 92 34 Q60 24 30 34 Z"
                fill="#43466e" stroke="#2c2e4d" stroke-width="2"/>
          <path d="M74 12 Q96 4 100 18 Q101 24 94 24 Q90 16 74 12 Z"
                fill="#43466e" stroke="#2c2e4d" stroke-width="2"/>
          <circle cx="100" cy="21" r="5" fill="#f7f4ec" stroke="#c9c2b2" stroke-width="1.6"/>
          <path d="M34 32 Q60 22 90 31" stroke="#f7f4ec" stroke-width="3" fill="none"/>
        </g>`;
      const zzz = `
        <g class="dz-zzz" font-family="sans-serif" font-weight="bold" fill="#8fb8e8">
          <text x="96" y="40" font-size="13">z</text>
          <text x="104" y="30" font-size="10">z</text>
          <text x="110" y="22" font-size="7">z</text>
        </g>`;
      const guitar = `
        <g transform="rotate(-18 30 118)">
          <rect x="26" y="86" width="4.6" height="26" rx="2" fill="#8a5a2b"/>
          <ellipse cx="28.5" cy="118" rx="11" ry="13" fill="#c98a3d" stroke="#8a5a2b" stroke-width="2"/>
          <circle cx="28.5" cy="116" r="4" fill="#7a4a1e"/>
          <rect x="24.5" y="84" width="8" height="5" rx="1.5" fill="#5c3a17"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        ${guitar}
        ${dinoBase({ skin: '#a99bc4', dark: '#7d6fa0', belly: '#e9e3f4', spikes: false,
          eyes: eyesSleepy(), mouth: mouthSleep('#7d6fa0'),
          extra: cap + (sleeping !== false ? zzz : '') })}
      </svg>`;
    },

    /* DOKIDOKI：隠しキャラ。ピンク＋ハートのツノ＋ときめき */
    dokidoki() {
      const heartHorn = `
        <path d="M60 22 c3 -5 10.5 -2 10.5 3.4 0 4.6 -6.4 8.6 -10.5 11 -4.1 -2.4 -10.5 -6.4 -10.5 -11 0 -5.4 7.5 -8.4 10.5 -3.4 Z"
              fill="#ff5f8f" stroke="#d13a6c" stroke-width="2"/>`;
      const sparkles = `
        <g fill="#ffd23f">
          <path d="M24 34 l2 -4.5 2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 Z"/>
          <path d="M94 30 l1.6 -3.6 1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 Z"/>
          <circle cx="30" cy="70" r="2"/>
          <circle cx="92" cy="66" r="2"/>
        </g>`;
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        ${dinoBase({ skin: '#ff86b0', dark: '#d15687', belly: '#ffe0ec', spikes: false,
          eyes: eyesHeart(), mouth: mouthGrin('#d15687'),
          extra: heartHorn + sparkles })}
      </svg>`;
    },

    /* チャーミー：最後までシルエットのみ。エレガントな影 */
    charmy() {
      return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">
        <g fill="#221a3d">
          <path d="M60 132 Q30 132 30 104 Q30 84 44 76 Q38 66 42 48 Q45 30 60 26 Q66 24 70 28
                   Q86 22 92 34 Q96 44 88 50 Q94 60 90 74 Q102 84 100 104 Q98 130 60 132 Z"/>
          <path d="M70 24 Q76 10 90 12 Q86 22 78 26 Z"/>
          <ellipse cx="46" cy="140" rx="10" ry="5"/>
          <ellipse cx="76" cy="140" rx="10" ry="5"/>
        </g>
        <g fill="#ffd23f" opacity=".9">
          <path d="M96 24 l2 -4.5 2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 Z"/>
          <circle cx="26" cy="44" r="2"/>
          <circle cx="102" cy="70" r="1.6"/>
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
