/* ============================================================
 * えんとつ町探検団 — パーソナライズエンジン
 *
 * AIは「先生」ではなく、一緒に冒険する相棒として振る舞う。
 *  - プロフィール（冒険のしおり）と学習履歴から、その子に合う
 *    クエストと難易度（tier）を選ぶ
 *  - 冒険中の様子（正誤・ヒント使用・連続正解）を見守り、
 *    難易度を静かに調整する
 *  - テストや点数は使わず、「できるようになったこと」を記録して
 *    保護者向けの「冒険日記」を生成する
 *
 * すべてローカル（localStorage）で完結する。
 * ============================================================ */

const AdvEngine = (() => {
    const STORAGE_KEY = 'pupelle_adventure_v1';

    /* ================= 保存・読み込み ================= */

    function blankState() {
        return {
            profile: null,          // 冒険のしおり
            skills: {},             // goalId -> { level: 0-100, history: [{d, delta}] }
            tierAdjust: 0,          // 適応による難易度補正（-1, 0, +1）
            perf: [],               // 直近の解答記録 [{ok, hinted, tier, skill, d}]
            light: 0,               // 町にもどった光
            completed: {},          // questId -> 完了回数
            badges: [],             // 獲得バッジid
            virtues: { courage: 0, kindness: 0, wisdom: 0, challenge: 0 },
            moneyLearnings: 0,      // お金の学びの回数
            bonusCleared: 0,
            days: {},               // 'YYYY-MM-DD' -> 冒険日記の1日分
            album: [],              // 思い出 [{questId, date, memo}]
            freeAnswers: [],        // 自由記述のこたえ [{q, a, d}]
            streak: 0,
            lastPlayed: null
        };
    }

    let state = load();

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                return Object.assign(blankState(), s);
            }
        } catch (e) { /* 壊れていたら初期化 */ }
        return blankState();
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* 容量超過などは無視 */ }
    }

    function reset() {
        state = blankState();
        save();
    }

    function today() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /* ================= プロフィール（冒険のしおり） ================= */

    function setProfile(profile) {
        state.profile = profile;
        // 選ばれた「育ってほしい力」はスキルを少し手前から見守る
        ADV_DATA.goals.forEach(g => {
            if (!state.skills[g.id]) state.skills[g.id] = { level: 50, history: [] };
        });
        save();
    }

    function getProfile() { return state.profile; }

    /* 年齢・学年から基本tierを決める */
    function baseTier() {
        const p = state.profile;
        if (!p) return 2;
        if (p.grade) {
            if (p.grade === 'pre') return 1;
            const g = parseInt(p.grade, 10);
            if (g <= 2) return 2;
            if (g <= 4) return 3;
            return 4;
        }
        const age = parseInt(p.age, 10) || 7;
        if (age <= 6) return 1;
        if (age <= 8) return 2;
        if (age <= 10) return 3;
        return 4;
    }

    /* 適応込みの実効tier */
    function effectiveTier() {
        return Math.max(1, Math.min(4, baseTier() + state.tierAdjust));
    }

    /* ================= クエスト選択（パーソナライズ） ================= */

    function unlockedAreas() {
        return ADV_DATA.areas.filter(a => state.light >= a.light);
    }

    function questById(id) { return ADV_DATA.quests.find(q => q.id === id); }

    /* その子に合わせてクエストに点数をつける */
    function scoreQuest(q) {
        const p = state.profile || { interests: [], goals: [] };
        let score = 0;
        // 好きなものに合っている
        (q.interests || []).forEach(i => { if ((p.interests || []).includes(i)) score += 3; });
        // 保護者が願う力に合っている
        (q.skills || []).forEach(s => { if ((p.goals || []).includes(s)) score += 2; });
        // 育ちはじめている力（最近伸びているスキル）をさらに伸ばす
        (q.skills || []).forEach(s => {
            const sk = state.skills[s];
            if (sk && recentDelta(s) > 0) score += 1;
        });
        // 未クリアを優先。クリア済みは回数分だけ下げる（くり返しは可能）
        score -= (state.completed[q.id] || 0) * 4;
        // はじまりのクエストは最初に
        if (q.id === 'hajimari' && !state.completed['hajimari']) score += 100;
        return score;
    }

    /* 今日のおすすめクエスト（エリア開放済みの中から） */
    function recommendQuests(n) {
        const areas = unlockedAreas().map(a => a.id);
        const list = ADV_DATA.quests
            .filter(q => areas.includes(q.area))
            .map(q => ({ q, s: scoreQuest(q) }))
            .sort((a, b) => b.s - a.s);
        return list.slice(0, n || 3).map(x => x.q);
    }

    function questsInArea(areaId) {
        return ADV_DATA.quests.filter(q => q.area === areaId);
    }

    /* ================= 冒険セッション（適応学習） ================= */

    let session = null;

    function startQuest(questId) {
        const quest = questById(questId);
        if (!quest) return null;
        const tier = pickTierForQuest(quest);
        session = {
            quest, tier,
            stepIndex: 0,
            wrongCount: 0,       // いまのステップでの誤答数
            hinted: false,
            results: [],         // {ok, hinted, revealed}
            fastCorrect: 0,      // ノーヒント一発正解の連続数
            bonusOffered: false,
            startedAt: Date.now()
        };
        return session;
    }

    /* クエストごとのtier（実効tierにそのクエストのtierがなければ近いものへ） */
    function pickTierForQuest(quest) {
        let t = effectiveTier();
        while (t > 1 && !quest.tiers[t]) t--;
        while (t < 4 && !quest.tiers[t]) t++;
        return t;
    }

    function currentStep() {
        if (!session) return null;
        return session.quest.tiers[session.tier].steps[session.stepIndex];
    }

    /* 解答の判定。number型は誤差・許容値も見る */
    function checkAnswer(step, value) {
        if (step.type === 'choice') return parseInt(value, 10) === step.answer;
        if (step.type === 'number') {
            const v = parseFloat(String(value).replace(/[，,]/g, ''));
            if (isNaN(v)) return false;
            if (step.accept) return step.accept.some(a => Math.abs(v - a) < 0.001);
            return Math.abs(v - step.answer) < 0.001;
        }
        return true; // heart / free に不正解はない
    }

    /*
     * 解答を記録して、つぎの見守りアクションを返す。
     *   'correct'  … 正解。次へ
     *   'retry'    … もう一度（1回目の誤答）
     *   'hint'     … プペルのヒントを出す（2回目の誤答）
     *   'reveal'   … 一緒に答えを見る（3回目。責めない）
     */
    function submitAnswer(value) {
        const step = currentStep();
        if (!step) return { action: 'end' };

        if (step.type === 'heart' || step.type === 'free') {
            recordResult(true, false, false, step);
            if (step.type === 'free' && String(value || '').trim()) {
                state.freeAnswers.push({ q: step.q, a: String(value).slice(0, 200), d: today() });
            }
            if (step.type === 'heart') addDiary('heart', step, value);
            save();
            return { action: 'correct', step };
        }

        const ok = checkAnswer(step, value);
        if (ok) {
            const first = session.wrongCount === 0 && !session.hinted;
            recordResult(true, session.hinted, false, step);
            if (first) session.fastCorrect++;
            else session.fastCorrect = 0;
            save();
            return { action: 'correct', step, firstTry: first };
        }

        session.wrongCount++;
        session.fastCorrect = 0;
        if (session.wrongCount === 1) return { action: 'retry', step };
        if (session.wrongCount === 2) { session.hinted = true; return { action: 'hint', step }; }
        recordResult(false, true, true, step);
        save();
        return { action: 'reveal', step };
    }

    /* 好調ならルビッチのボーナスを出すか判定 */
    function shouldOfferBonus() {
        if (!session || session.bonusOffered) return false;
        return session.fastCorrect >= 2 && session.tier < 4 + 1;
    }

    function getBonusStep() {
        session.bonusOffered = true;
        const pool = ADV_DATA.bonus.byTier[Math.min(4, session.tier + 1)] || ADV_DATA.bonus.byTier[session.tier];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function submitBonus(step, value) {
        const ok = checkAnswer(step, value);
        if (ok) {
            state.bonusCleared++;
            bumpSkills(['challenge'], 4);
            addLight(1);
            save();
        }
        return ok;
    }

    /* つぎのステップへ。なければクエスト完了 */
    function nextStep() {
        session.stepIndex++;
        session.wrongCount = 0;
        session.hinted = false;
        if (session.stepIndex >= session.quest.tiers[session.tier].steps.length) return null;
        return currentStep();
    }

    /* ---- 解答結果の記録とスキル更新 ---- */

    function recordResult(ok, hinted, revealed, step) {
        session.results.push({ ok, hinted, revealed });
        state.perf.push({ ok, hinted, tier: session.tier, d: today() });
        if (state.perf.length > 40) state.perf = state.perf.slice(-40);

        // スキル更新：正解で上がり、ヒントありでも少し上がる（挑戦したこと自体が学び）
        const skills = session.quest.skills || [];
        if (step.type === 'choice' || step.type === 'number') {
            if (ok && !hinted) bumpSkills(skills, 3);
            else if (ok) bumpSkills(skills, 1.5);
            else bumpSkills(skills, 0.5);
        } else if (step.type === 'heart') {
            bumpSkills(['kindness', 'communication'], 2);
        } else if (step.type === 'free') {
            bumpSkills(['expression'], 3);
        }

        // 心のかけら
        if (step.virtue && (ok || step.type === 'heart' || step.type === 'free')) {
            state.virtues[step.virtue] = (state.virtues[step.virtue] || 0) + 1;
        }

        // お金の学び
        if (step.learning) {
            state.moneyLearnings++;
            addDiary('learning', step);
        }

        adaptDifficulty();
    }

    function bumpSkills(skillIds, delta) {
        skillIds.forEach(id => {
            if (!state.skills[id]) state.skills[id] = { level: 50, history: [] };
            const sk = state.skills[id];
            sk.level = Math.max(0, Math.min(100, sk.level + delta));
            sk.history.push({ d: today(), delta });
            if (sk.history.length > 60) sk.history = sk.history.slice(-60);
        });
    }

    function recentDelta(skillId) {
        const sk = state.skills[skillId];
        if (!sk) return 0;
        const cutoff = new Date(Date.now() - 7 * 86400000);
        return sk.history
            .filter(h => new Date(h.d) >= cutoff)
            .reduce((sum, h) => sum + h.delta, 0);
    }

    /*
     * 適応難易度：直近10問を静かに見守る。
     *   よくできている（8割以上ノーヒント正解）→ 一段上へ
     *   苦しそう（半分以上つまずく）→ 一段やさしく
     * 物語は変えず、問いだけが変わる。
     */
    function adaptDifficulty() {
        const recent = state.perf.slice(-10);
        if (recent.length < 6) return;
        const strong = recent.filter(r => r.ok && !r.hinted).length / recent.length;
        const struggling = recent.filter(r => !r.ok || r.hinted).length / recent.length;
        if (strong >= 0.8 && state.tierAdjust < 1 && baseTier() + state.tierAdjust < 4) {
            state.tierAdjust++;
            state.perf = [];
        } else if (struggling >= 0.5 && state.tierAdjust > -1 && baseTier() + state.tierAdjust > 1) {
            state.tierAdjust--;
            state.perf = [];
        }
    }

    /* ---- クエスト完了 ---- */

    function completeQuest() {
        const q = session.quest;
        state.completed[q.id] = (state.completed[q.id] || 0) + 1;
        addLight(q.light || 3);
        updateStreak();

        if (state.completed[q.id] === 1) {
            state.album.push({ questId: q.id, date: today(), tier: session.tier });
        }
        addDiary('quest', null, null, q);

        const newBadges = checkBadges();
        const endPhrase = pickSessionEndPhrase();
        const result = {
            quest: q,
            light: q.light || 3,
            newBadges,
            endPhrase,
            newAreas: newlyUnlockedAreas(q.light || 3)
        };
        session = null;
        save();
        return result;
    }

    function addLight(n) { state.light += n; }

    function newlyUnlockedAreas(justAdded) {
        const before = state.light - justAdded;
        return ADV_DATA.areas.filter(a => a.light > before && a.light <= state.light);
    }

    function updateStreak() {
        const t = today();
        if (state.lastPlayed === t) return;
        const yesterday = new Date(Date.now() - 86400000);
        const y = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
        state.streak = (state.lastPlayed === y) ? state.streak + 1 : 1;
        state.lastPlayed = t;
    }

    /* ---- バッジ ---- */

    function checkBadges() {
        const earned = [];
        const has = id => state.badges.includes(id);
        const totalQuests = Object.keys(state.completed).length;
        const openAreas = unlockedAreas().length;
        const rules = {
            first: totalQuests >= 1,
            streak3: state.streak >= 3,
            streak7: state.streak >= 7,
            money1: state.moneyLearnings >= 3,
            money2: state.moneyLearnings >= 10,
            kind5: state.virtues.kindness >= 5,
            brave5: state.virtues.courage >= 5,
            wise10: state.virtues.wisdom >= 10,
            challenge5: state.virtues.challenge >= 5,
            bonus1: state.bonusCleared >= 1,
            area3: openAreas >= 3,
            allquest: totalQuests >= ADV_DATA.quests.length
        };
        ADV_DATA.badges.forEach(b => {
            if (rules[b.id] && !has(b.id)) {
                state.badges.push(b.id);
                earned.push(b);
            }
        });
        return earned;
    }

    /* ---- 子どもへの言葉（点数は使わない） ---- */

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function pickSessionEndPhrase() { return pick(ADV_DATA.phrases.sessionEnd); }
    function pickCorrectPhrase() { return pick(ADV_DATA.phrases.correct); }
    function pickRetryPhrase() { return pick(ADV_DATA.phrases.retry); }
    function pickRevealPhrase() { return pick(ADV_DATA.phrases.revealed); }

    /* ================= 冒険日記（保護者向け） ================= */

    function dayEntry() {
        const t = today();
        if (!state.days[t]) {
            state.days[t] = { quests: [], learnings: [], hearts: [], talks: [] };
        }
        return state.days[t];
    }

    function addDiary(kind, step, value, quest) {
        const day = dayEntry();
        if (kind === 'quest' && quest) {
            day.quests.push({ id: quest.id, title: quest.title, icon: quest.icon });
            if (quest.parentTalk && !day.talks.includes(quest.parentTalk)) day.talks.push(quest.parentTalk);
        } else if (kind === 'learning' && step && step.learning) {
            if (!day.learnings.includes(step.learning)) day.learnings.push(step.learning);
        } else if (kind === 'heart' && step) {
            const idx = parseInt(value, 10);
            const chosen = (step.options && step.options[idx]) ? step.options[idx] : '';
            day.hearts.push({ q: step.q, a: chosen });
        }
    }

    /* 最近伸びている力（7日間の変化量トップ） */
    function growingSkills(n) {
        return ADV_DATA.goals
            .map(g => ({ goal: g, delta: recentDelta(g.id), level: (state.skills[g.id] || { level: 50 }).level }))
            .filter(x => x.delta > 0)
            .sort((a, b) => b.delta - a.delta)
            .slice(0, n || 3);
    }

    /* AIから保護者へのメッセージ（今日の様子から選ぶ） */
    function parentMessage() {
        const p = state.profile || { nickname: 'お子さま' };
        const name = p.nickname || 'お子さま';
        const msgs = ADV_DATA.parentMessages;
        const day = state.days[today()];
        const recent = state.perf.slice(-10);
        const fill = s => s.replace('{name}', name).replace('{streak}', state.streak);

        if (!day || Object.keys(state.completed).length === 0) return fill(msgs.firstDay);
        if (state.streak >= 3) return fill(msgs.streak);
        if (recent.length >= 4) {
            const acc = recent.filter(r => r.ok && !r.hinted).length / recent.length;
            const hintRate = recent.filter(r => r.hinted).length / recent.length;
            const wrongButDone = recent.filter(r => !r.ok).length;
            if (acc >= 0.8) return fill(msgs.highAccuracy);
            if (wrongButDone >= 2) return fill(msgs.highEffort);
            if (hintRate >= 0.4) return fill(msgs.usedHints);
        }
        if (day.hearts && day.hearts.length > 0) return fill(msgs.heartChoices);
        return fill(msgs.default);
    }

    /* 今日のおすすめ親子会話 */
    function todaysTalk() {
        const day = state.days[today()];
        if (day && day.talks.length) return day.talks[day.talks.length - 1];
        return pick(ADV_DATA.genericTalks);
    }

    /* 保護者ダッシュボード用のまとめ */
    function dashboard() {
        const t = today();
        const day = state.days[t] || { quests: [], learnings: [], hearts: [], talks: [] };
        return {
            date: t,
            profile: state.profile,
            day,
            virtues: state.virtues,
            growing: growingSkills(3),
            message: parentMessage(),
            talk: todaysTalk(),
            streak: state.streak,
            light: state.light,
            badges: state.badges.map(id => ADV_DATA.badges.find(b => b.id === id)).filter(Boolean),
            freeAnswers: state.freeAnswers.slice(-5),
            tier: effectiveTier(),
            totalQuests: Object.keys(state.completed).length,
            recentDays: Object.keys(state.days).sort().slice(-7).reverse()
                .map(d => ({ date: d, entry: state.days[d] }))
        };
    }

    /* ================= 公開API ================= */

    return {
        // 状態
        get state() { return state; },
        save, reset, load: () => { state = load(); },
        // プロフィール
        setProfile, getProfile, baseTier, effectiveTier,
        // 町
        unlockedAreas, questsInArea, recommendQuests, questById,
        // 冒険
        startQuest, currentStep, submitAnswer, nextStep, completeQuest,
        shouldOfferBonus, getBonusStep, submitBonus, checkAnswer,
        get session() { return session; },
        // 言葉
        pickCorrectPhrase, pickRetryPhrase, pickRevealPhrase,
        // 保護者
        dashboard
    };
})();
