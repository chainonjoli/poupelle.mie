/* ぼぅ投稿システム 保存層
 *
 * localStorage（接頭辞 bou.）に投稿候補・キャラクター設定・APIキーを保存する。
 * localStorage が使えない環境（Nodeテスト等）ではメモリ上のMapに退避する。
 *
 * ステータス遷移: draft → selected → generated → posted ／ 不採用は rejected */
(function () {
    'use strict';

    var KEY_POSTS = 'bou.posts';
    var KEY_CHARACTER = 'bou.character';
    var KEY_SETTINGS = 'bou.settings';
    var KEY_RESEARCH = 'bou.research';
    var KEY_STRATEGY = 'bou.strategy';
    var KEY_RESEARCH_LOG = 'bou.researchLog';

    var memory = {};
    function rawGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return memory[key] || null; }
    }
    function rawSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { memory[key] = value; }
    }

    function readJson(key, fallback) {
        var raw = rawGet(key);
        if (!raw) return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    }
    function writeJson(key, value) { rawSet(key, JSON.stringify(value)); }

    var STATUSES = ['draft', 'selected', 'generated', 'posted', 'rejected'];

    function nowIso() { return new Date().toISOString(); }

    function makeId(prefix) {
        var d = new Date();
        var ymd = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
        return prefix + ymd + '-' + Math.random().toString(36).slice(2, 8);
    }

    var BouStore = {
        STATUSES: STATUSES,

        /* ---- 投稿候補 ---- */
        getPosts: function () { return readJson(KEY_POSTS, []); },

        savePosts: function (posts) { writeJson(KEY_POSTS, posts); },

        getPost: function (id) {
            var posts = this.getPosts();
            for (var i = 0; i < posts.length; i++) { if (posts[i].id === id) return posts[i]; }
            return null;
        },

        /* 生成された案を保存する（statusはdraft） */
        addPosts: function (drafts) {
            var posts = this.getPosts();
            for (var i = 0; i < drafts.length; i++) { posts.unshift(drafts[i]); }
            this.savePosts(posts);
            return drafts;
        },

        /* フィールドを部分更新する */
        updatePost: function (id, patch) {
            var posts = this.getPosts();
            var updated = null;
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].id !== id) continue;
                for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) posts[i][k] = patch[k]; }
                posts[i].updated_at = nowIso();
                updated = posts[i];
                break;
            }
            this.savePosts(posts);
            return updated;
        },

        setStatus: function (id, status) {
            if (STATUSES.indexOf(status) === -1) throw new Error('不明なステータス: ' + status);
            return this.updatePost(id, { status: status });
        },

        /* 1案を採用し、同じバッチの残りのdraftをrejectedにする */
        selectPost: function (id) {
            var post = this.getPost(id);
            if (!post) return null;
            var posts = this.getPosts();
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].id === id) { posts[i].status = 'selected'; posts[i].updated_at = nowIso(); }
                else if (post.batch_id && posts[i].batch_id === post.batch_id && posts[i].status === 'draft') {
                    posts[i].status = 'rejected'; posts[i].updated_at = nowIso();
                }
            }
            this.savePosts(posts);
            return this.getPost(id);
        },

        addFeedback: function (id, text) {
            var post = this.getPost(id);
            if (!post || !text) return null;
            var fb = post.user_feedback || [];
            fb.push({ at: nowIso(), text: text });
            return this.updatePost(id, { user_feedback: fb });
        },

        /* 最新バッチ（今日の3案）を返す */
        getLatestBatch: function () {
            var posts = this.getPosts();
            if (!posts.length) return [];
            var latestBatch = null;
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].batch_id) { latestBatch = posts[i].batch_id; break; }
            }
            if (!latestBatch) return [];
            var batch = [];
            for (var j = 0; j < posts.length; j++) { if (posts[j].batch_id === latestBatch) batch.push(posts[j]); }
            batch.sort(function (a, b) { return (a.variant || '').localeCompare(b.variant || ''); });
            return batch;
        },

        /* ---- 学習用の参照データ ---- */
        getLearningContext: function () {
            var posts = this.getPosts();
            var good = [], bad = [], comments = [];
            for (var i = 0; i < posts.length; i++) {
                var p = posts[i];
                var st = p.status;
                if ((st === 'selected' || st === 'generated' || st === 'posted') && good.length < 5) good.push(p);
                if (st === 'rejected' && p.user_feedback && p.user_feedback.length && bad.length < 5) bad.push(p);
                if (p.user_feedback) {
                    for (var f = 0; f < p.user_feedback.length; f++) {
                        comments.push({ text: p.user_feedback[f].text, at: p.user_feedback[f].at, main_text: p.main_text });
                    }
                }
            }
            comments.sort(function (a, b) { return (b.at || '').localeCompare(a.at || ''); });
            return { goodExamples: good, badExamples: bad, recentComments: comments.slice(0, 10) };
        },

        /* ---- キャラクター設定 ---- */
        getCharacter: function () {
            var defaults = (typeof window !== 'undefined' && window.BouCharacter)
                ? window.BouCharacter.DEFAULT_CHARACTER
                : require('./character.js').DEFAULT_CHARACTER;
            var saved = readJson(KEY_CHARACTER, null);
            if (!saved) return JSON.parse(JSON.stringify(defaults));
            /* 既定値に新しいフィールドが増えても壊れないよう浅くマージ */
            var merged = JSON.parse(JSON.stringify(defaults));
            for (var k in saved) { if (Object.prototype.hasOwnProperty.call(saved, k)) merged[k] = saved[k]; }
            return merged;
        },

        saveCharacter: function (character) { writeJson(KEY_CHARACTER, character); },

        resetCharacter: function () {
            try { localStorage.removeItem(KEY_CHARACTER); } catch (e) { delete memory[KEY_CHARACTER]; }
        },

        /* ---- 設定（生成モード・APIキー） ---- */
        getSettings: function () { return readJson(KEY_SETTINGS, { mode: 'builtin', apiKey: '' }); },
        saveSettings: function (settings) { writeJson(KEY_SETTINGS, settings); },

        /* ---- リサーチ（参考アカウント調査・分析） ---- */
        getResearchSeed: function () {
            var seed = (typeof window !== 'undefined' && window.BouResearchSeed)
                ? window.BouResearchSeed.SEED
                : require('./research-data.js').SEED;
            return JSON.parse(JSON.stringify(seed));
        },

        /* 保存済みがなければシードを返す。accountsはユーザー編集分を優先 */
        getResearch: function () {
            var seed = this.getResearchSeed();
            var saved = readJson(KEY_RESEARCH, null);
            if (!saved) return seed;
            for (var k in saved) { if (Object.prototype.hasOwnProperty.call(saved, k)) seed[k] = saved[k]; }
            return seed;
        },
        saveResearch: function (research) { writeJson(KEY_RESEARCH, research); },
        resetResearch: function () {
            try { localStorage.removeItem(KEY_RESEARCH); } catch (e) { delete memory[KEY_RESEARCH]; }
        },

        /* 定期リサーチのログ（月1回などの手動再調査を追記型で記録） */
        getResearchLog: function () { return readJson(KEY_RESEARCH_LOG, []); },
        addResearchLog: function (entry) {
            var log = this.getResearchLog();
            log.unshift({ at: nowIso(), note: entry.note || '', diff: entry.diff || '' });
            writeJson(KEY_RESEARCH_LOG, log);
            return log;
        },

        /* ---- 投稿戦略（Phase・方針） ---- */
        getStrategy: function () {
            var seed = this.getResearchSeed();
            var defaults = { phase: 1 };
            for (var k in seed.strategyDefaults) {
                if (Object.prototype.hasOwnProperty.call(seed.strategyDefaults, k)) defaults[k] = seed.strategyDefaults[k];
            }
            var saved = readJson(KEY_STRATEGY, null);
            if (!saved) return defaults;
            for (var s in saved) { if (Object.prototype.hasOwnProperty.call(saved, s)) defaults[s] = saved[s]; }
            return defaults;
        },
        saveStrategy: function (strategy) { writeJson(KEY_STRATEGY, strategy); },

        /* ---- 使いすぎ検出（直近30件のテーマ・シーン・語尾） ---- */
        getUsageStats: function () {
            var posts = this.getPosts().slice(0, 30);
            var themes = {}, scenes = {}, endings = {};
            function bump(map, key) { if (key) map[key] = (map[key] || 0) + 1; }
            function endingOf(text) {
                var t = (text || '').trim().replace(/[。．…]+$/, '');
                return t ? t.slice(-2) : '';
            }
            posts.forEach(function (p) {
                bump(themes, p.theme);
                var pages = p.pages && p.pages.length ? p.pages : [{ text: p.main_text, scene: p.scene }];
                pages.forEach(function (pg) {
                    bump(endings, endingOf(pg.text));
                    /* シーンは代表語（布団・ソファ・スマホ等）で数える */
                    var m = (pg.scene || '').match(/布団|ソファ|スマホ|お風呂|デスク|窓|海|水面|電車|マグ|枕|カレンダー|鏡|台所/);
                    bump(scenes, m ? m[0] : null);
                });
            });
            function top(map, min) {
                return Object.keys(map)
                    .filter(function (k) { return map[k] >= (min || 3); })
                    .sort(function (a, b) { return map[b] - map[a]; })
                    .map(function (k) { return { key: k, count: map[k] }; });
            }
            return {
                sampleSize: posts.length,
                overusedThemes: top(themes, 3), overusedScenes: top(scenes, 4), overusedEndings: top(endings, 5),
                recentThemes: posts.slice(0, 6).map(function (p) { return p.theme; }),
                allThemes: themes
            };
        },

        /* ---- 採用/不採用の傾向（戦略ページ用） ---- */
        getAdoptionStats: function () {
            var posts = this.getPosts();
            var byTheme = {}, byType = {};
            posts.forEach(function (p) {
                var adopted = (p.status === 'selected' || p.status === 'generated' || p.status === 'posted');
                var rejected = (p.status === 'rejected');
                if (!adopted && !rejected) return;
                var t = p.theme || '（不明）';
                byTheme[t] = byTheme[t] || { adopted: 0, rejected: 0 };
                if (adopted) byTheme[t].adopted++; else byTheme[t].rejected++;
                var ty = p.proposal_type || '（型なし）';
                byType[ty] = byType[ty] || { adopted: 0, rejected: 0 };
                if (adopted) byType[ty].adopted++; else byType[ty].rejected++;
            });
            return { byTheme: byTheme, byType: byType };
        },

        /* ---- バックアップ ---- */
        exportAll: function () {
            return JSON.stringify({
                exported_at: nowIso(),
                posts: this.getPosts(),
                character: readJson(KEY_CHARACTER, null),
                research: readJson(KEY_RESEARCH, null),
                strategy: readJson(KEY_STRATEGY, null),
                researchLog: readJson(KEY_RESEARCH_LOG, null)
            }, null, 2);
        },

        importAll: function (json) {
            var data = JSON.parse(json);
            if (!data || !Array.isArray(data.posts)) throw new Error('投稿データが見つかりません');
            this.savePosts(data.posts);
            if (data.character) this.saveCharacter(data.character);
            if (data.research) this.saveResearch(data.research);
            if (data.strategy) this.saveStrategy(data.strategy);
            if (data.researchLog) writeJson(KEY_RESEARCH_LOG, data.researchLog);
            return data.posts.length;
        },

        makeId: makeId,
        nowIso: nowIso
    };

    if (typeof window !== 'undefined') { window.BouStore = BouStore; }
    if (typeof module !== 'undefined' && module.exports) { module.exports = BouStore; }
})();
