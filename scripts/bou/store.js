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

        /* ---- バックアップ ---- */
        exportAll: function () {
            return JSON.stringify({
                exported_at: nowIso(),
                posts: this.getPosts(),
                character: readJson(KEY_CHARACTER, null)
            }, null, 2);
        },

        importAll: function (json) {
            var data = JSON.parse(json);
            if (!data || !Array.isArray(data.posts)) throw new Error('投稿データが見つかりません');
            this.savePosts(data.posts);
            if (data.character) this.saveCharacter(data.character);
            return data.posts.length;
        },

        makeId: makeId,
        nowIso: nowIso
    };

    if (typeof window !== 'undefined') { window.BouStore = BouStore; }
    if (typeof module !== 'undefined' && module.exports) { module.exports = BouStore; }
})();
