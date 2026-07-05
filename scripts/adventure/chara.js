/* ============================================================
 * えんとつ町探検団 — ミニキャラ＆マーク（インラインSVG）
 * 参照イラストのタッチに合わせた、ちびキャラとマーク
 * ============================================================ */

const ADV_CHARA = (() => {

    /* ---- ミニキャラ本体（viewBox 0 0 96 96） ---- */

    /* プペル：緑のフード帽にロープ帯・赤い顔・ゴーグルと六角ナットの目・
     * オレンジの垂れた鼻・バケツ状の口・金のラッパ */
    const pupelle = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <!-- パイプのあし -->
        <rect x="38" y="84" width="4.5" height="8" rx="2" fill="#8b8f99"/>
        <rect x="53" y="84" width="4.5" height="8" rx="2" fill="#8b8f99"/>
        <ellipse cx="40" cy="93" rx="7" ry="3.4" fill="#5a8fa3"/>
        <ellipse cx="55" cy="93" rx="7" ry="3.4" fill="#5a8fa3"/>
        <!-- からだ -->
        <path d="M34 78 q14 -4 28 0 l2 9 q-16 4 -32 0 z" fill="#4e8f82"/>
        <path d="M32 66 q16 -5 32 0 l2 13 q-18 5 -36 0 z" fill="#5f9678"/>
        <path d="M52 68 q6 -2 8 2 q1 5 -4 6 q-5 0 -6 -4 q0 -3 2 -4 z" fill="#c9573f"/>
        <!-- かごのえり -->
        <path d="M30 56 q18 -6 36 0 l2 11 q-20 5 -40 0 z" fill="#a8834f"/>
        <circle cx="36" cy="61" r="1" fill="#8a6a3e"/><circle cx="42" cy="63" r="1" fill="#8a6a3e"/>
        <circle cx="48" cy="61" r="1" fill="#8a6a3e"/><circle cx="54" cy="63" r="1" fill="#8a6a3e"/>
        <circle cx="60" cy="61" r="1" fill="#8a6a3e"/><circle cx="39" cy="58" r="1" fill="#8a6a3e"/>
        <circle cx="51" cy="58" r="1" fill="#8a6a3e"/><circle cx="57" cy="58" r="1" fill="#8a6a3e"/>
        <!-- 白いてぶくろ -->
        <circle cx="27" cy="72" r="5" fill="#fffdf7" stroke="#d8cbb5" stroke-width="1.2"/>
        <!-- みどりのフードぼうし（とんがり） -->
        <path d="M20 52 q-6 -18 8 -32 q8 -14 24 -17 q-3 6 -2 9 q10 -2 16 8 q9 12 10 32 q-7 6 -14 7 h-32 q-7 -1 -10 -7 z" fill="#6faf5f"/>
        <path d="M50 3 q7 -5 12 -1 q-3 5 -8 7 q-3 -3 -4 -6 z" fill="#5f9450"/>
        <path d="M30 14 q10 -5 22 -3" stroke="#8a5a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M23 26 q18 -8 44 -2" stroke="#8a5a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M20 47 q-3 9 1 15" stroke="#4a4453" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="21.5" cy="63" r="1.6" fill="#4a4453"/>
        <!-- ラッパ -->
        <path d="M64 29 q9 -1 15 -5 l4 9 q-7 5 -17 3 z" fill="#e6b54a"/>
        <ellipse cx="84" cy="28" rx="4" ry="6.5" fill="#f2c96a" transform="rotate(18 84 28)"/>
        <!-- あかい かおのプレート -->
        <path d="M28 28 q20 -6 40 0 l-1 13 h-38 z" fill="#c94f42"/>
        <!-- め（六角ナットとゴーグル） -->
        <path d="M37 27.5 l5.2 3 v6 l-5.2 3 -5.2 -3 v-6 z" fill="#9aa0ad"/>
        <path d="M37 29.9 l3.2 1.9 v3.7 l-3.2 1.9 -3.2 -1.9 v-3.7 z" fill="#4f8fd9"/>
        <rect x="42" y="32" width="9" height="3" fill="#9aa0ad"/>
        <circle cx="57" cy="33.5" r="7" fill="#c9a86a"/>
        <circle cx="57" cy="33.5" r="4.8" fill="#4fb3a8"/>
        <circle cx="55.2" cy="31.7" r="1.6" fill="#d9f2ec"/>
        <!-- バケツ状のくち -->
        <path d="M29 41 h38 l-3.2 14 q-15.5 4.5 -31.6 0 z" fill="#f2e8d4"/>
        <path d="M29 41 h9.5 l-1.6 15 q-4.2 -0.8 -6.3 -1.8 z" fill="#d9738f"/>
        <path d="M57.5 41 h9.5 l-1.6 13 q-3.1 1.6 -6.3 2 z" fill="#5f9678"/>
        <path d="M42 41.5 l-1 14.5 M54 41.5 l1 14.5" stroke="#c9b896" stroke-width="1.3"/>
        <path d="M29 41 h38" stroke="#b09a72" stroke-width="1.8"/>
        <!-- オレンジの垂れたはな -->
        <path d="M44 37.5 q4 -3 8 0 q2.5 7 -1 12 q-5 2 -7 -0.5 q-2.5 -6 0 -11.5 z" fill="#e8823e"/>
    </svg>`;

    /* ルビッチ：紺のシルクハット（茶帯）・すないろの髪と前髪カール・
     * 赤い蝶リボン・アイボリーのシャツ */
    const lubicchi = `
    <svg viewBox="0 0 96 96" aria-hidden="true">
        <!-- くつ -->
        <ellipse cx="41" cy="92" rx="7.5" ry="3.6" fill="#332e2a"/>
        <ellipse cx="55" cy="92" rx="7.5" ry="3.6" fill="#332e2a"/>
        <!-- ズボン -->
        <path d="M36 74 h24 l1.5 12 h-9 l-0.8 5 h-7.4 l-0.8 -5 h-9 z" fill="#2f3547"/>
        <!-- シャツ -->
        <path d="M34 58 q14 -5 28 0 l1.8 17 q-16 4 -31.6 0 z" fill="#f2e8d4"/>
        <path d="M39 60 l1.5 15 M57 60 l-1.5 15" stroke="#2f3547" stroke-width="2.4" stroke-linecap="round"/>
        <!-- そで・カフス -->
        <path d="M34 60 q-6 3 -7 10 l7 2 z" fill="#f2e8d4"/>
        <path d="M62 60 q6 3 7 10 l-7 2 z" fill="#f2e8d4"/>
        <rect x="25" y="70" width="8" height="5" rx="2" fill="#fffdf7"/>
        <rect x="63" y="70" width="8" height="5" rx="2" fill="#fffdf7"/>
        <!-- あかい蝶リボン -->
        <path d="M48 58.5 l-9.5 -4.5 v9 z M48 58.5 l9.5 -4.5 v9 z" fill="#d9403a"/>
        <rect x="45.8" y="55.8" width="4.4" height="5.4" rx="1.6" fill="#b52f2c"/>
        <!-- かお -->
        <circle cx="48" cy="41" r="19" fill="#f7d9b8"/>
        <!-- すないろのかみ -->
        <path d="M28 46 q-3 -24 20 -24 q23 0 20 24 q-1 -12 -7 -15 q3 5 1 9 q-6 -8 -14 -8 q-8 0 -14 8 q-2 -4 1 -9 q-6 3 -7 15 z" fill="#d9a869"/>
        <path d="M45 23 q2.5 -3 5.5 -0.5 q-1 3 -4.5 2.8" stroke="#b5854a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- まゆ・め・ほっぺ・くち -->
        <path d="M38 34.5 q2 -1.6 4 0 M54 34.5 q2 -1.6 4 0" stroke="#8a6a48" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="40.5" cy="40" r="2.3" fill="#332a24"/>
        <circle cx="55.5" cy="40" r="2.3" fill="#332a24"/>
        <circle cx="34.5" cy="46" r="3.6" fill="#f5a8bc"/>
        <circle cx="61.5" cy="46" r="3.6" fill="#f5a8bc"/>
        <path d="M44.5 49 q3.5 3.4 7 0" stroke="#a8663d" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <!-- 紺のシルクハット（茶帯） -->
        <path d="M32 21 L31 5 q0 -2.6 3 -2.6 h28 q3 0 3 2.6 L64 21 z" fill="#2f3547"/>
        <path d="M31.5 17.5 h33 l-0.4 -6.5 h-32.2 z" fill="#b5763a"/>
        <ellipse cx="48" cy="21" rx="24" ry="5" fill="#2f3547"/>
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
