/* 推し活レーダーOS エリア移動時間マトリクス
   地図APIキーが無い環境のため、公共交通機関ベースの目安分数を内蔵する。
   値は「駅間＋徒歩」のおおよそ。正確さより「行ける/行けない」の判定に足る粒度を優先。 */
(function (global) {
    'use strict';

    /* エリア定義。region はスコア計算のフォールバックに使う */
    var AREAS = {
        /* 大阪 */
        '難波':         { region: '大阪', pref: '大阪府' },
        '心斎橋':       { region: '大阪', pref: '大阪府' },
        '南堀江':       { region: '大阪', pref: '大阪府' },
        '四ツ橋':       { region: '大阪', pref: '大阪府' },
        '梅田':         { region: '大阪', pref: '大阪府' },
        '天王寺・あべの': { region: '大阪', pref: '大阪府' },
        '大阪城':       { region: '大阪', pref: '大阪府' },
        '京セラドーム':   { region: '大阪', pref: '大阪府' },
        /* 東京 */
        '東京駅・丸の内': { region: '東京', pref: '東京都' },
        '銀座':         { region: '東京', pref: '東京都' },
        '渋谷':         { region: '東京', pref: '東京都' },
        '新宿':         { region: '東京', pref: '東京都' },
        '原宿・表参道':   { region: '東京', pref: '東京都' },
        '池袋':         { region: '東京', pref: '東京都' },
        '秋葉原':       { region: '東京', pref: '東京都' },
        '六本木':       { region: '東京', pref: '東京都' },
        'お台場':       { region: '東京', pref: '東京都' },
        /* 三重 */
        '津':           { region: '三重', pref: '三重県' },
        '四日市':       { region: '三重', pref: '三重県' },
        '松阪':         { region: '三重', pref: '三重県' },
        '伊勢':         { region: '三重', pref: '三重県' },
        '名張':         { region: '三重', pref: '三重県' },
        '明和':         { region: '三重', pref: '三重県' }
    };

    /* エリア間の目安分数（対称）。未定義ペアはフォールバック規則で補完 */
    var PAIRS = [
        ['難波', '心斎橋', 8], ['難波', '南堀江', 10], ['難波', '四ツ橋', 8],
        ['難波', '梅田', 15], ['難波', '天王寺・あべの', 15], ['難波', '大阪城', 20], ['難波', '京セラドーム', 12],
        ['心斎橋', '南堀江', 8], ['心斎橋', '四ツ橋', 5], ['心斎橋', '梅田', 12],
        ['心斎橋', '天王寺・あべの', 20], ['心斎橋', '大阪城', 18], ['心斎橋', '京セラドーム', 15],
        ['南堀江', '四ツ橋', 5], ['南堀江', '梅田', 18], ['南堀江', '天王寺・あべの', 25], ['南堀江', '京セラドーム', 10],
        ['四ツ橋', '梅田', 12], ['四ツ橋', '天王寺・あべの', 22],
        ['梅田', '天王寺・あべの', 20], ['梅田', '大阪城', 15], ['梅田', '京セラドーム', 18],
        ['天王寺・あべの', '大阪城', 20], ['天王寺・あべの', '京セラドーム', 25],

        ['東京駅・丸の内', '銀座', 8], ['東京駅・丸の内', '渋谷', 25], ['東京駅・丸の内', '新宿', 18],
        ['東京駅・丸の内', '池袋', 20], ['東京駅・丸の内', '秋葉原', 8], ['東京駅・丸の内', '六本木', 20], ['東京駅・丸の内', 'お台場', 25],
        ['銀座', '渋谷', 20], ['銀座', '新宿', 20], ['銀座', '六本木', 15], ['銀座', 'お台場', 20],
        ['渋谷', '新宿', 10], ['渋谷', '原宿・表参道', 5], ['渋谷', '池袋', 15], ['渋谷', '六本木', 12],
        ['新宿', '原宿・表参道', 8], ['新宿', '池袋', 8], ['新宿', '秋葉原', 20],
        ['原宿・表参道', '六本木', 12], ['池袋', '秋葉原', 18],

        ['津', '四日市', 35], ['津', '松阪', 20], ['津', '伊勢', 45], ['津', '名張', 60], ['津', '明和', 35],
        ['四日市', '松阪', 50], ['松阪', '伊勢', 25], ['松阪', '明和', 15], ['伊勢', '明和', 20]
    ];

    /* 地方間の移動（新幹線・近鉄特急ベースの目安）。キーは sort() 後の並びで定義する */
    var REGION_MIN = {};
    [['大阪', '東京', 180], ['大阪', '三重', 120], ['東京', '三重', 210]].forEach(function (r) {
        REGION_MIN[[r[0], r[1]].sort().join('|')] = r[2];
    });

    var matrix = {};
    PAIRS.forEach(function (p) {
        matrix[p[0] + '|' + p[1]] = p[2];
        matrix[p[1] + '|' + p[0]] = p[2];
    });

    function areaNames() { return Object.keys(AREAS); }

    function regionOf(area) {
        return AREAS[area] ? AREAS[area].region : null;
    }

    /* エリア間の移動分数。未知エリアや地方跨ぎもそれらしい値を返す */
    function minutesBetween(a, b) {
        if (!a || !b) return null;
        if (a === b) return 5; /* 同一エリア内は徒歩圏とみなす */
        var hit = matrix[a + '|' + b];
        if (hit != null) return hit;
        var ra = regionOf(a), rb = regionOf(b);
        if (ra && rb) {
            if (ra === rb) return 30; /* 同地方の未定義ペア */
            var key = [ra, rb].sort().join('|');
            if (REGION_MIN[key] != null) return REGION_MIN[key];
        }
        return 999; /* 不明。判定側で「移動時間不明」として扱う */
    }

    /* 指定エリアから range 分以内で行けるエリア一覧（エリア拡張検索・要件8） */
    function reachableAreas(from, rangeMin) {
        return areaNames().filter(function (a) {
            var m = minutesBetween(from, a);
            return m != null && m <= rangeMin;
        });
    }

    global.OshiTravel = {
        AREAS: AREAS,
        areaNames: areaNames,
        regionOf: regionOf,
        minutesBetween: minutesBetween,
        reachableAreas: reachableAreas
    };
})(window);
