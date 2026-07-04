/* ============================================================
 * えんとつ町探検団 — ミニキャラ＆マーク（インラインSVG）
 * 参照イラストのタッチに合わせた、ちびキャラとマーク
 * ============================================================ */

const ADV_CHARA = (() => {

    /* ---- ミニキャラ本体（viewBox 0 0 96 96） ---- */

    /* プペル：緑のとんがり帽子・つぎはぎの顔・ラッパ */
    const pupelle = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <!-- くつ -->
        <ellipse cx="38" cy="91" rx="9" ry="4.5" fill="#6e4a32"/>
        <ellipse cx="58" cy="91" rx="9" ry="4.5" fill="#6e4a32"/>
        <!-- みどりのマント -->
        <path d="M30 58 q18 -8 36 0 l4 26 q-22 6 -44 0 z" fill="#5f9678"/>
        <path d="M30 58 l-3 10 6 2 z M66 58 l3 10 -6 2 z" fill="#4e7d63"/>
        <!-- つぎはぎ -->
        <rect x="40" y="66" width="11" height="10" rx="2" fill="#d9a53f"/>
        <path d="M42 66 v10 M46 76 v-10 M49 66 v10" stroke="#b5832c" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
        <rect x="55" y="70" width="10" height="9" rx="2" fill="#4e8f82"/>
        <path d="M55 72 h10 M55 76 h10" stroke="#3c7267" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
        <!-- えりのフリンジ -->
        <path d="M32 58 l5 6 5 -6 5 6 5 -6 5 6 5 -6 4 6 -2 -8 -30 0 z" fill="#d9a53f"/>
        <!-- ラッパ（あたまのよこ） -->
        <path d="M70 34 q10 -3 14 -9 q3 8 -4 13 q-6 3 -10 0 z" fill="#d9a53f"/>
        <ellipse cx="85" cy="27" rx="4.5" ry="6" fill="#e6b54a" transform="rotate(24 85 27)"/>
        <!-- かお（つぎはぎ） -->
        <circle cx="48" cy="40" r="22" fill="#b56a4a"/>
        <path d="M48 18 a22 22 0 0 0 -22 22 a22 22 0 0 0 8 17 q8 -20 14 -39z" fill="#4e8f82"/>
        <path d="M44 20 q-8 18 -12 36" stroke="#3c7267" stroke-width="1.6" stroke-dasharray="3 3" stroke-linecap="round" fill="none"/>
        <!-- みみのけ -->
        <path d="M26 40 q-5 2 -6 7 q5 1 8 -2 z" fill="#6e4a32"/>
        <path d="M70 40 q5 2 6 7 q-5 1 -8 -2 z" fill="#6e4a32"/>
        <!-- め -->
        <circle cx="38" cy="40" r="8.5" fill="#f7ead8"/>
        <circle cx="38" cy="40" r="8.5" fill="none" stroke="#2f4f4a" stroke-width="2"/>
        <circle cx="39" cy="41" r="3.6" fill="#332a24"/>
        <circle cx="40.4" cy="39.6" r="1.3" fill="#fff"/>
        <circle cx="60" cy="41" r="4.2" fill="#332a24"/>
        <circle cx="61.4" cy="39.8" r="1.4" fill="#fff"/>
        <!-- はな・くち -->
        <circle cx="50" cy="48" r="5" fill="#e07a3f"/>
        <path d="M42 56 q7 5 14 0" stroke="#5f3a26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <!-- とんがりぼうし -->
        <path d="M24 27 q20 -8 48 0 l-8 -1 q4 -14 12 -22 q-12 2 -18 8 q-2 -6 -7 -8 q-14 6 -27 23 z" fill="#7ba05a"/>
        <path d="M64 26 q4 -14 12 -22 l4 3 q-7 8 -9 20 z" fill="#6a8c4c"/>
        <path d="M18 29 q30 -10 60 0 l-3 5 q-27 -8 -54 0 z" fill="#8fae66"/>
        <path d="M26 25 q22 -6 44 0 l-1 5 q-21 -5 -42 0 z" fill="#8a5a3a"/>
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
        <!-- かお -->
        <circle cx="48" cy="40" r="21" fill="#f5c9a0"/>
        <!-- まきげ -->
        <path d="M28 36 q-4 4 -2 9 q4 3 7 -1 M68 36 q4 4 2 9 q-4 3 -7 -1" fill="#8a5a3a"/>
        <path d="M27 34 q2 -10 10 -13 l3 7 q-7 2 -8 8 z" fill="#8a5a3a"/>
        <path d="M69 34 q-2 -10 -10 -13 l-3 7 q7 2 8 8 z" fill="#8a5a3a"/>
        <!-- め・ほっぺ・くち -->
        <circle cx="40" cy="41" r="4" fill="#332a24"/>
        <circle cx="56" cy="41" r="4" fill="#332a24"/>
        <circle cx="41.4" cy="39.6" r="1.4" fill="#fff"/>
        <circle cx="57.4" cy="39.6" r="1.4" fill="#fff"/>
        <ellipse cx="33" cy="48" rx="4" ry="2.6" fill="#eb9a7a" opacity="0.7"/>
        <ellipse cx="63" cy="48" rx="4" ry="2.6" fill="#eb9a7a" opacity="0.7"/>
        <path d="M43 51 q5 5 10 0" stroke="#a8663d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <!-- シルクハット -->
        <path d="M32 22 q0 -18 16 -18 q16 0 16 18 z" fill="#3f3a35"/>
        <rect x="32" y="16" width="32" height="6" fill="#a8442e"/>
        <ellipse cx="48" cy="22" rx="26" ry="5.5" fill="#3f3a35"/>
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
