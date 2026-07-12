/* =========================================================
   BAND STACK - キャラクターアート（SVG）
   添付公式画像を基準にした4人のステージスプライト。
   ・ティラ様   : 真紅のティラノ＋白ターバン＋カラフル編み込み＋えんじ色スーツ
   ・カジカジ   : きらめく青ティラノ＋赤系花冠＋黒スーツ＋水色ソックス
   ・花子       : 金色ボディ＋赤ツノ＋赤トサカ＋花飾り＋赤い衣装（小柄）
   ・？？？     : ピンクのラプトル＋大きなピンクリボン＋まつげ＋ピンクデニム
   顔立ち・色・シルエットは基準画像から変更しないこと。
   ========================================================= */
(function (global) {
  'use strict';

  /* 共通:恐竜の頭（右向きプロファイル、開いた口） */
  function dinoHead(o) {
    // o: {skin, skinDark, jaw, eyeX, eyeY, extra, teethN}
    const teeth = [];
    const n = o.teethN || 5;
    for (let i = 0; i < n; i++) {
      const tx = 52 + i * 9;
      teeth.push(`<path d="M${tx} 46 l3.5 7 l3.5 -7 z" fill="#fdfaf2"/>`);
      teeth.push(`<path d="M${tx + 4} 62 l3 -6.5 l3 6.5 z" fill="#fdfaf2"/>`);
    }
    return `
      <g class="bs-head">
        <!-- 下あご -->
        <path class="bs-jaw" d="M40 56 Q44 70 62 71 Q84 72 96 62 Q90 56 74 56 Z"
              fill="${o.jaw}" stroke="${o.skinDark}" stroke-width="2"/>
        <!-- 舌 -->
        <path class="bs-jaw" d="M48 60 Q62 68 82 61 Q70 66 56 64 Z" fill="#e0567a"/>
        <!-- 頭部 -->
        <path d="M14 40 Q12 16 38 12 Q66 6 84 20 Q100 30 99 44 Q99 50 92 49
                 L50 47 Q40 47 36 52 Q28 56 20 52 Q13 48 14 40 Z"
              fill="${o.skin}" stroke="${o.skinDark}" stroke-width="2"/>
        <!-- 鼻孔 -->
        <circle cx="90" cy="30" r="2.2" fill="${o.skinDark}"/>
        <!-- 目 -->
        <g class="bs-eyewrap">
          <circle class="bs-eyewhite" cx="${o.eyeX}" cy="${o.eyeY}" r="7.5" fill="#fffdf5"/>
          <circle class="bs-eye" cx="${o.eyeX + 1}" cy="${o.eyeY}" r="3.6" fill="#231a14"/>
          <circle cx="${o.eyeX + 2.4}" cy="${o.eyeY - 1.6}" r="1.2" fill="#fff"/>
          <rect class="bs-lid" x="${o.eyeX - 8}" y="${o.eyeY - 9}" width="16" height="0"
                rx="3" fill="${o.skin}"/>
        </g>
        <!-- 上の歯 -->
        ${teeth.join('')}
        ${o.extra || ''}
      </g>`;
  }

  /* 共通:スーツの身体 */
  function suitBody(o) {
    // o: {suit, suitDark, shirt, hands, shoes, socks}
    return `
      <g class="bs-body">
        <path d="M38 92 Q60 84 82 92 L86 132 Q60 140 34 132 Z"
              fill="${o.suit}" stroke="${o.suitDark}" stroke-width="2"/>
        <path d="M52 92 L60 104 L68 92 L64 90 L60 96 L56 90 Z" fill="${o.shirt}"/>
        <g class="bs-arm-l"><path d="M38 96 Q26 104 28 118 Q29 124 35 122 Q40 112 44 104 Z"
              fill="${o.suit}" stroke="${o.suitDark}" stroke-width="2"/>
          <circle cx="31" cy="121" r="5" fill="${o.hands}"/></g>
        <g class="bs-arm-r"><path d="M82 96 Q94 104 92 118 Q91 124 85 122 Q80 112 76 104 Z"
              fill="${o.suit}" stroke="${o.suitDark}" stroke-width="2"/>
          <circle cx="89" cy="121" r="5" fill="${o.hands}"/></g>
        <rect x="44" y="130" width="12" height="16" rx="4" fill="${o.suit}" stroke="${o.suitDark}" stroke-width="2"/>
        <rect x="64" y="130" width="12" height="16" rx="4" fill="${o.suit}" stroke="${o.suitDark}" stroke-width="2"/>
        ${o.socks ? `<rect x="45" y="142" width="10" height="6" fill="${o.socks}"/>
                     <rect x="65" y="142" width="10" height="6" fill="${o.socks}"/>` : ''}
        <ellipse cx="50" cy="151" rx="9" ry="4.5" fill="${o.shoes}"/>
        <ellipse cx="70" cy="151" rx="9" ry="4.5" fill="${o.shoes}"/>
      </g>`;
  }

  const ART = {
    /* ティラ様：真紅＋白ターバン＋カラフル編み込み＋えんじスーツ */
    tyra() {
      const braids = `
        <g class="bs-braids">
          <path d="M18 44 q-4 16 2 30" stroke="#f2c94c" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M24 48 q-2 16 4 28" stroke="#2f9e6e" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M14 40 q-6 14 -2 26" stroke="#3d7bf5" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M29 50 q0 14 6 24" stroke="#e06fae" stroke-width="4" fill="none" stroke-linecap="round"/>
          <circle cx="20" cy="76" r="3" fill="#f2c94c"/><circle cx="28" cy="78" r="3" fill="#2f9e6e"/>
          <circle cx="12" cy="68" r="3" fill="#3d7bf5"/><circle cx="35" cy="76" r="3" fill="#e06fae"/>
        </g>`;
      const turban = `
        <g>
          <path d="M16 34 Q14 12 40 8 Q64 4 78 16 Q60 10 42 16 Q22 20 16 34 Z"
                fill="#f5efe4" stroke="#cfc4ae" stroke-width="2"/>
          <path d="M20 26 Q36 10 62 12" stroke="#e3d9c4" stroke-width="3" fill="none"/>
          <path d="M18 32 Q34 16 66 16" stroke="#e3d9c4" stroke-width="3" fill="none"/>
          <circle cx="44" cy="12" r="3.4" fill="#c9a227"/>
        </g>`;
      return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        ${suitBody({ suit: '#6e1f24', suitDark: '#471114', shirt: '#f3e6d0', hands: '#c0392b', shoes: '#2a1a14' })}
        ${dinoHead({ skin: '#c0392b', skinDark: '#8c1f19', jaw: '#a02c22', eyeX: 46, eyeY: 30,
          teethN: 5, extra: braids + turban })}
      </svg>`;
    },

    /* カジカジ：きらめく青＋花冠＋黒スーツ＋水色ソックス */
    kaji() {
      const sparkle = `
        <g opacity="0.85">
          <circle cx="30" cy="30" r="1.6" fill="#bdf0ff"/><circle cx="58" cy="20" r="1.4" fill="#bdf0ff"/>
          <circle cx="74" cy="34" r="1.6" fill="#bdf0ff"/><circle cx="44" cy="42" r="1.3" fill="#bdf0ff"/>
          <circle cx="66" cy="44" r="1.2" fill="#bdf0ff"/><circle cx="86" cy="42" r="1.4" fill="#bdf0ff"/>
        </g>`;
      const crown = `
        <g class="bs-flowers">
          ${[[24, 16, '#e84545'], [40, 10, '#ff8fb0'], [56, 8, '#e8452f'], [72, 12, '#ffb3c7'], [85, 20, '#d63c5e']]
            .map(([x, y, c]) => `
              <g transform="translate(${x} ${y})">
                <circle r="6" fill="${c}"/>
                <circle r="6" fill="none" stroke="rgba(0,0,0,.15)"/>
                <circle r="2.2" fill="#ffe08a"/>
              </g>`).join('')}
        </g>`;
      return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        ${suitBody({ suit: '#1d1b22', suitDark: '#0c0b10', shirt: '#f3f3f3', hands: '#2a9dc9',
          shoes: '#111', socks: '#8fd8f2' })}
        ${dinoHead({ skin: '#2a9dc9', skinDark: '#186f93', jaw: '#2187ae', eyeX: 46, eyeY: 30,
          teethN: 5, extra: sparkle + crown })}
      </svg>`;
    },

    /* 花子：金色＋赤ツノ＋赤トサカ＋花飾り＋赤衣装（小柄=全体を縮小） */
    hanako() {
      const horn = `<path d="M84 18 L90 2 L95 19 Q89 15 84 18 Z" fill="#d63c2f" stroke="#9c2318" stroke-width="2"/>`;
      const crest = `
        <g>
          <path d="M34 12 L40 0 L46 12 Z" fill="#d63c2f" stroke="#9c2318" stroke-width="1.5"/>
          <path d="M48 10 L54 -2 L60 10 Z" fill="#d63c2f" stroke="#9c2318" stroke-width="1.5"/>
          <path d="M62 10 L68 0 L74 12 Z" fill="#d63c2f" stroke="#9c2318" stroke-width="1.5"/>
        </g>`;
      const flowers = `
        <g class="bs-flowers">
          ${[[20, 26, '#e84545'], [14, 38, '#3d7bf5'], [24, 46, '#ff8fb0']]
            .map(([x, y, c]) => `
              <g transform="translate(${x} ${y})">
                <circle r="6.5" fill="${c}"/><circle r="2.2" fill="#ffe08a"/>
              </g>`).join('')}
          <path d="M18 30 q-4 10 4 18" stroke="#2f9e6e" stroke-width="2.5" fill="none"/>
        </g>`;
      const body = `
        <g class="bs-body">
          <path d="M40 94 Q60 86 80 94 L84 130 Q60 138 36 130 Z"
                fill="#d8392b" stroke="#9c2318" stroke-width="2"/>
          <path d="M46 98 L74 98" stroke="#b02a1e" stroke-width="3"/>
          <g class="bs-arm-l"><path d="M40 98 Q28 106 30 118 Q31 124 37 122 Q42 112 46 106 Z"
                fill="#d8392b" stroke="#9c2318" stroke-width="2"/>
            <circle cx="33" cy="121" r="5" fill="#d4a017"/></g>
          <g class="bs-arm-r"><path d="M80 98 Q92 106 90 118 Q89 124 83 122 Q78 112 74 106 Z"
                fill="#d8392b" stroke="#9c2318" stroke-width="2"/>
            <circle cx="87" cy="121" r="5" fill="#d4a017"/></g>
          <rect x="45" y="128" width="12" height="16" rx="5" fill="#d8392b" stroke="#9c2318" stroke-width="2"/>
          <rect x="63" y="128" width="12" height="16" rx="5" fill="#d8392b" stroke="#9c2318" stroke-width="2"/>
          <ellipse cx="51" cy="149" rx="9" ry="4.5" fill="#ff5a4e"/>
          <ellipse cx="69" cy="149" rx="9" ry="4.5" fill="#ff5a4e"/>
        </g>`;
      return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(7 14) scale(0.9)">
          ${body}
          ${dinoHead({ skin: '#e0a92e', skinDark: '#a87a12', jaw: '#c6921f', eyeX: 46, eyeY: 30,
            teethN: 5, extra: crest + horn + flowers })}
        </g>
      </svg>`;
    },

    /* ？？？：ピンクのラプトル＋大きなリボン＋まつげ＋ピンクデニム */
    newmember() {
      const bow = `
        <g class="bs-bow">
          <path d="M46 6 Q30 -6 22 6 Q18 16 34 18 Q42 16 46 10 Z"
                fill="#f78fb8" stroke="#d1568c" stroke-width="2"/>
          <path d="M50 6 Q66 -6 74 6 Q78 16 62 18 Q54 16 50 10 Z"
                fill="#f78fb8" stroke="#d1568c" stroke-width="2"/>
          <circle cx="48" cy="10" r="6" fill="#e05fa0" stroke="#d1568c" stroke-width="2"/>
        </g>`;
      const lashes = `
        <g stroke="#5e2242" stroke-width="1.6" stroke-linecap="round">
          <path d="M52 22 l4 -3"/><path d="M49 21 l3 -4"/><path d="M45 21 l1 -4"/>
        </g>`;
      const body = `
        <g class="bs-body">
          <path d="M38 92 Q60 84 82 92 L86 132 Q60 140 34 132 Z"
                fill="#e88bb4" stroke="#c25a89" stroke-width="2"/>
          <path d="M50 90 L60 112 L70 90 L66 88 L60 100 L54 88 Z" fill="#fdfaf2"/>
          <path d="M44 92 L46 130 M76 92 L74 130" stroke="#c25a89" stroke-width="2"/>
          <g class="bs-arm-l"><path d="M38 96 Q26 104 28 118 Q29 124 35 122 Q40 112 44 104 Z"
                fill="#e88bb4" stroke="#c25a89" stroke-width="2"/>
            <circle cx="31" cy="121" r="5" fill="#ef9ec2"/></g>
          <g class="bs-arm-r"><path d="M82 96 Q94 104 92 118 Q91 124 85 122 Q80 112 76 104 Z"
                fill="#e88bb4" stroke="#c25a89" stroke-width="2"/>
            <circle cx="89" cy="121" r="5" fill="#ef9ec2"/></g>
          <rect x="44" y="130" width="12" height="16" rx="4" fill="#d87aa6" stroke="#c25a89" stroke-width="2"/>
          <rect x="64" y="130" width="12" height="16" rx="4" fill="#d87aa6" stroke="#c25a89" stroke-width="2"/>
          <ellipse cx="50" cy="151" rx="9" ry="4.5" fill="#fff"/>
          <ellipse cx="70" cy="151" rx="9" ry="4.5" fill="#fff"/>
        </g>`;
      return `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
        ${body}
        ${dinoHead({ skin: '#ef6aa8', skinDark: '#c23f7e', jaw: '#d95695', eyeX: 46, eyeY: 30,
          teethN: 5, extra: bow + lashes })}
      </svg>`;
    },
  };

  /* キャラクターIDからSVG文字列を返す */
  function charSVG(id) {
    return (ART[id] || ART.tyra)();
  }

  global.BSChars = { charSVG };
})(typeof window !== 'undefined' ? window : globalThis);
