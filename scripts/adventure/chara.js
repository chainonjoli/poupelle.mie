/* ============================================================
 * えんとつ町探検団 — ミニキャラ＆マーク（インラインSVG）
 * 参照イラストのタッチに合わせた、ちびキャラとマーク
 * ============================================================ */

const ADV_CHARA = (() => {

    /* ---- ミニキャラ本体（viewBox 0 0 96 96） ---- */

    /* プペル：ねじれた緑のとんがり帽子・青いゴーグル・
     * オレンジのとがり鼻・むねの緑の看板・つぎはぎのからだ */
    const pupelle = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <!-- あし（かたほうはパイプ） -->
        <rect x="36" y="80" width="5" height="9" rx="2" fill="#8b8f99"/>
        <path d="M36 83 h5 M36 86 h5" stroke="#6e727c" stroke-width="1" opacity="0.8"/>
        <ellipse cx="38" cy="91" rx="8" ry="4" fill="#4e7d8f"/>
        <ellipse cx="58" cy="91" rx="8.5" ry="4.5" fill="#5a8fa3"/>
        <!-- スカート（つぎはぎ） -->
        <path d="M32 70 q16 -4 32 0 l4 16 q-20 5 -40 0 z" fill="#e6a54a"/>
        <rect x="52" y="76" width="10" height="8" rx="2" fill="#d98f3e"/>
        <path d="M54 76 v8 M58 84 v-8" stroke="#b5722c" stroke-width="1.1" stroke-linecap="round" opacity="0.8"/>
        <rect x="37" y="75" width="9" height="8" rx="2" fill="#f2c14e"/>
        <!-- うで -->
        <path d="M30 58 q-7 3 -8 11 q5 3 9 0 z" fill="#7fb7e8"/>
        <path d="M66 58 q7 3 8 11 q-5 3 -9 0 z" fill="#7fb7e8"/>
        <circle cx="27" cy="72" r="4.5" fill="#fffdf7" stroke="#d8cbb5" stroke-width="1.2"/>
        <circle cx="70" cy="72" r="4" fill="#8b8f99"/>
        <!-- むねの みどりの看板 -->
        <path d="M33 55 h30 q2 0 2 2 v14 q-17 4 -34 0 v-14 q0 -2 2 -2 z" fill="#5f9678"/>
        <rect x="37" y="58" width="22" height="10" rx="2" fill="#6da886"/>
        <path d="M42 60 v6 M47 60 v6 M52 60 v6" stroke="#fdf7ea" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>
        <!-- かお（つぎはぎ 上下二色） -->
        <circle cx="48" cy="38" r="21" fill="#c9a284"/>
        <path d="M27 40 a21 21 0 0 0 42 0 z" fill="#93a8b0"/>
        <path d="M28 42 h40 M36 40 l-1.5 4 M48 41 v4 M60 40 l1.5 4" stroke="#6e7f87" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3 3"/>
        <!-- ゴーグル -->
        <path d="M27 32 h42" stroke="#8a5a3a" stroke-width="2.6"/>
        <circle cx="38" cy="32" r="8" fill="#7fb7e8" stroke="#c9a86a" stroke-width="2.6"/>
        <circle cx="58" cy="32" r="8" fill="#7fb7e8" stroke="#c9a86a" stroke-width="2.6"/>
        <circle cx="39.5" cy="33.5" r="3.4" fill="#3f5d7a"/>
        <circle cx="59.5" cy="33.5" r="3.4" fill="#3f5d7a"/>
        <circle cx="36" cy="29.5" r="2" fill="#d9ecfb"/>
        <circle cx="56" cy="29.5" r="2" fill="#d9ecfb"/>
        <!-- とがった オレンジのはな -->
        <path d="M46 38 l12 5 -11 4 q-3 -4 -1 -9 z" fill="#e07a3f"/>
        <!-- ぬいめの わらった くち -->
        <path d="M38 49 q10 7 20 0" stroke="#4e5d63" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M42 51.5 l-1 3.5 M48 53 v3.5 M54 51.5 l1 3.5" stroke="#4e5d63" stroke-width="1.6" stroke-linecap="round"/>
        <!-- くろい かみのけ -->
        <path d="M28 26 q-4 4 -3 9 l5 -2 z M68 26 q4 4 3 9 l-5 -2 z" fill="#4a4453"/>
        <!-- ねじれた みどりのぼうし -->
        <path d="M27 25 q21 -7 42 0 q-2 -7 -10 -8 q6 -4 4 -10 q-7 3 -12 1 q4 -4 2 -8 q-8 2 -10 8 q-6 -2 -9 2 q5 2 5 6 q-8 1 -12 9 z" fill="#7ba05a"/>
        <path d="M43 8 q-2 5 1 8 M38 16 q8 -2 15 0 M33 22 q14 -4 28 1" stroke="#5f7d43" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M26 26 q22 -7 44 0 l-1 4 q-21 -6 -42 0 z" fill="#8a5a3a"/>
        <path d="M30 29 l-2 6 M66 29 l2 6" stroke="#8a5a3a" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`;

    /* ルビッチ：シルクハット・まきげ・あかい蝶ネクタイ */
    const lubicchi = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <!-- くつ -->
        <ellipse cx="40" cy="91" rx="8" ry="4" fill="#4a3a2e"/>
        <ellipse cx="56" cy="91" rx="8" ry="4" fill="#4a3a2e"/>
        <!-- からだ（シャツ＋サスペンダー） -->
        <path d="M30 62 q18 -6 36 0 l2 24 q-20 5 -40 0 z" fill="#f7ead8"/>
        <path d="M36 62 l4 24 M60 62 l-4 24" stroke="#3f3a35" stroke-width="5" stroke-linecap="round"/>
        <circle cx="48" cy="74" r="1.8" fill="#3f3a35"/>
        <circle cx="48" cy="81" r="1.8" fill="#3f3a35"/>
        <!-- ちょうネクタイ -->
        <path d="M48 60 l-10 -5 v10 z M48 60 l10 -5 v10 z" fill="#d9542e"/>
        <circle cx="48" cy="60" r="2.6" fill="#b5432e"/>
        <!-- みみ -->
        <circle cx="26" cy="42" r="4.5" fill="#f5c9a0"/>
        <circle cx="70" cy="42" r="4.5" fill="#f5c9a0"/>
        <!-- かお -->
        <circle cx="48" cy="40" r="21" fill="#f5c9a0"/>
        <!-- すないろの くせっけ（はねた毛） -->
        <path d="M29 34 q-6 0 -8 6 l6 1 q-3 3 -2 7 l6 -3 q0 4 3 6 l3 -6 z" fill="#cf8f4a"/>
        <path d="M67 34 q6 0 8 6 l-6 1 q3 3 2 7 l-6 -3 q0 4 -3 6 l-3 -6 z" fill="#cf8f4a"/>
        <path d="M27 35 q3 -12 21 -12 q18 0 21 12 q-6 -4 -10 -2 q-3 -4 -11 -4 q-8 0 -11 4 q-4 -2 -10 2 z" fill="#cf8f4a"/>
        <!-- め・そばかす・くち -->
        <circle cx="40" cy="41" r="4" fill="#332a24"/>
        <circle cx="56" cy="41" r="4" fill="#332a24"/>
        <circle cx="41.4" cy="39.6" r="1.4" fill="#fff"/>
        <circle cx="57.4" cy="39.6" r="1.4" fill="#fff"/>
        <circle cx="33" cy="47.5" r="1.1" fill="#d9924a"/>
        <circle cx="36.5" cy="49" r="1.1" fill="#d9924a"/>
        <circle cx="63" cy="47.5" r="1.1" fill="#d9924a"/>
        <circle cx="59.5" cy="49" r="1.1" fill="#d9924a"/>
        <path d="M43 51 q5 5 10 0" stroke="#a8663d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <!-- あかい帯の シルクハット（たかいトップハット） -->
        <path d="M34 21 L32.5 5 q0 -3 3 -3 h25 q3 0 3 3 L62 21 z" fill="#3f3a35"/>
        <path d="M33.6 17 h28.8 l-0.5 -5.5 h-27.8 z" fill="#c9402e"/>
        <ellipse cx="48" cy="21" rx="23" ry="5" fill="#3f3a35"/>
    </svg>`;

    /* 町の人：ハンチング帽と赤いスカーフのおじさん */
    const npc = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <ellipse cx="40" cy="91" rx="8" ry="4" fill="#3a332c"/>
        <ellipse cx="56" cy="91" rx="8" ry="4" fill="#3a332c"/>
        <path d="M30 62 q18 -6 36 0 l2 24 q-20 5 -40 0 z" fill="#5a544a"/>
        <!-- スカーフ -->
        <path d="M36 58 q12 8 24 0 l-3 8 q-9 5 -18 0 z" fill="#b5432e"/>
        <path d="M46 64 l-4 10 q5 3 8 0 z" fill="#a03a28"/>
        <!-- かお -->
        <circle cx="48" cy="40" r="21" fill="#f0bd94"/>
        <!-- はな・め・ほっぺ・くち -->
        <ellipse cx="48" cy="45" rx="5" ry="4" fill="#e8a878"/>
        <path d="M38 40 q2 -2.5 5 0 M53 40 q2 -2.5 5 0" stroke="#332a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <ellipse cx="33" cy="49" rx="4" ry="2.6" fill="#e59a74" opacity="0.7"/>
        <ellipse cx="63" cy="49" rx="4" ry="2.6" fill="#e59a74" opacity="0.7"/>
        <path d="M43 53 q5 4.5 10 0" stroke="#8a5a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <!-- ハンチング帽 -->
        <path d="M26 32 q4 -16 22 -16 q18 0 22 16 l-4 2 q-18 -8 -36 0 z" fill="#6b6352"/>
        <path d="M24 33 q24 -9 48 0 l-2 4 q-22 -8 -44 0 z" fill="#5a5344"/>
    </svg>`;

    /* ナレーター：ひらいた本 */
    const narrator = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <path d="M14 32 q17 -8 34 0 v40 q-17 -8 -34 0 z" fill="#fdf7ea" stroke="#d9a53f" stroke-width="3"/>
        <path d="M82 32 q-17 -8 -34 0 v40 q17 -8 34 0 z" fill="#fdf7ea" stroke="#d9a53f" stroke-width="3"/>
        <path d="M22 42 h18 M22 50 h18 M22 58 h14 M56 42 h18 M56 50 h18 M56 58 h14" stroke="#e3ceac" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M76 14 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 z" fill="#e0552e"/>
    </svg>`;

    /* ---- 小さなマーク（viewBox 0 0 24 24） ---- */

    const marks = {
        flame:   `<path d="M12 2 q5 5 5 11 a5 5 0 0 1 -10 0 q0 -3 2.4 -5.4 q-0.2 2.4 1.6 3.4 q-1 -4.5 1 -9z" fill="#e0552e"/>`,
        heart:   `<path d="M12 20 q-7 -5 -8.6 -9.3 a4.6 4.6 0 0 1 8.6 -3 a4.6 4.6 0 0 1 8.6 3 q-1.6 4.3 -8.6 9.3z" fill="#e8899e"/>`,
        sparkle: `<path d="M12 2 l2.3 7.7 7.7 2.3 -7.7 2.3 -2.3 7.7 -2.3 -7.7 -7.7 -2.3 7.7 -2.3z" fill="#4e8f82"/>`,
        star:    `<path d="M12 2.5 l2.9 6 6.6 0.9 -4.8 4.6 1.2 6.5 -5.9 -3.1 -5.9 3.1 1.2 -6.5 -4.8 -4.6 6.6 -0.9z" fill="#f2c14e"/>`,
        lantern: `<rect x="9" y="2" width="6" height="2.6" rx="1.3" fill="#a8834f"/>
                  <path d="M12 4.5 q6 0 6 8 q0 7 -6 7 q-6 0 -6 -7 q0 -8 6 -8z" fill="#f2c14e"/>
                  <path d="M12 4.5 q6 0 6 8 q0 7 -6 7z" fill="#e6ad3a"/>
                  <circle cx="12" cy="12" r="3" fill="#fdf0c9"/>
                  <rect x="10" y="19.5" width="4" height="2.4" rx="1.2" fill="#a8834f"/>`,
        lock:    `<rect x="6" y="10" width="12" height="10" rx="3" fill="#cbbfa8"/>
                  <path d="M8.5 10 v-2.5 a3.5 3.5 0 0 1 7 0 v2.5" stroke="#a8977a" stroke-width="2.4" fill="none"/>
                  <circle cx="12" cy="15" r="1.8" fill="#7a6a52"/>`
    };

    const mark = (name, cls = '') =>
        `<span class="adv-mark ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${marks[name] || marks.star}</svg></span>`;

    const faces = { pupelle, lubicchi, npc, narrator };

    const face = (key, cls = '') =>
        `<span class="mini-chara ${cls}" aria-hidden="true">${faces[key] || faces.npc}</span>`;

    /* 心のかけら（virtue）用マーク */
    const virtueMark = { courage: 'flame', kindness: 'heart', wisdom: 'sparkle', challenge: 'star' };
    const virtue = (key, cls = '') => mark(virtueMark[key] || 'star', cls);

    return { face, mark, virtue };
})();
