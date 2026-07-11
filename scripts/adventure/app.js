/* ============================================================
 * えんとつ町探検団 — 画面制御
 * ビュー: onboarding / town / quest / album / parent
 * ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const $ = sel => document.querySelector(sel);
    const app = $('#app');

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    /* ---- ふりがな（子ども向け画面のみ） ----
     * 学年が辞書のレベルより下の漢字語に <ruby> を付ける */
    let kanaRe = null, kanaMap = null;

    function kanaGrade() {
        const p = AdvEngine.getProfile();
        if (!p) return 6;
        if (p.grade === 'adult') return 6;   // おとなはふりがな無し
        if (p.grade === 'pre') return 0;
        const g = parseInt(p.grade, 10);
        if (g >= 1 && g <= 6) return g;
        const age = parseInt(p.age, 10);
        return age ? Math.min(6, Math.max(0, age - 6)) : 6;
    }

    function rk(s) {
        const text = esc(s);
        if (!kanaRe) {
            const list = ADV_DATA.kana.slice().sort((a, b) => b[0].length - a[0].length);
            kanaMap = {};
            list.forEach(e => { kanaMap[e[0]] = e; });
            kanaRe = new RegExp(list.map(e => e[0]).join('|'), 'g');
        }
        const grade = kanaGrade();
        return text.replace(kanaRe, w =>
            grade < kanaMap[w][2] ? `<ruby>${w}<rt>${kanaMap[w][1]}</rt></ruby>` : w);
    }

    function charOf(sp, npcName) {
        if (sp === 'npc') return { name: npcName || '町の人', art: 'npc' };
        return ADV_DATA.characters[sp] || ADV_DATA.characters.narrator;
    }

    /* ================= ルーティング ================= */

    function go(view, arg) {
        window.scrollTo(0, 0);
        if (view === 'onboarding') renderOnboarding();
        else if (view === 'town') renderTown();
        else if (view === 'quest') renderQuest(arg);
        else if (view === 'album') renderAlbum();
        else if (view === 'parentGate') renderParentGate();
        else if (view === 'parent') renderParent();
    }

    /* ================= 初回設定（冒険のしおり） ================= */

    const wizard = { step: 0, data: { nickname: '', age: '', grade: '', birthday: '', interests: [], goals: [] } };

    function renderOnboarding() {
        const steps = [renderObWelcome, renderObChild, renderObInterests, renderObGoals, renderObDone];
        steps[wizard.step]();
    }

    function obShell(inner, progress) {
        app.innerHTML = `
        <div class="ob-wrap">
            <div class="ob-progress"><div class="ob-progress-bar" style="width:${progress}%"></div></div>
            <div class="glass-card ob-card">${inner}</div>
        </div>`;
    }

    function renderObWelcome() {
        obShell(`
            <div class="ob-buddy">${ADV_CHARA.face('pupelle', 'mini-chara-lg')}${ADV_CHARA.face('lubicchi', 'mini-chara-lg')}</div>
            <h2>ようこそ、えんとつ町へ</h2>
            <p class="ob-lead">『えんとつ町のプペル』の世界で、お子さまが物語の主人公になる学びの冒険です。プペルとルビッチが相棒として、その子だけの冒険をつくります。</p>
            <p class="ob-note">はじめに、保護者の方が「冒険のしおり」を作成してください（約1分）。入力した情報はこの端末の中にだけ保存されます。</p>
            <button class="btn btn-primary btn-wide" id="ob-next">冒険のしおりを作る</button>
        `, 5);
        $('#ob-next').onclick = () => { wizard.step = 1; renderOnboarding(); };
    }

    function renderObChild() {
        const d = wizard.data;
        obShell(`
            <h2>お子さまについて</h2>
            <div class="form-group">
                <label>ニックネーム（町での呼び名）</label>
                <input type="text" id="ob-nickname" maxlength="12" placeholder="例：ゆうた" value="${esc(d.nickname)}">
            </div>
            <div class="ob-row">
                <div class="form-group">
                    <label>年齢</label>
                    <select id="ob-age">
                        <option value="">えらぶ</option>
                        ${[5,6,7,8,9,10,11,12].map(a => `<option value="${a}" ${String(a)===d.age?'selected':''}>${a}歳</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>学年</label>
                    <select id="ob-grade">
                        <option value="">えらぶ</option>
                        <option value="pre" ${d.grade==='pre'?'selected':''}>未就学（年中・年長）</option>
                        ${[1,2,3,4,5,6].map(g => `<option value="${g}" ${String(g)===d.grade?'selected':''}>小学${g}年生</option>`).join('')}
                        <option value="adult" ${d.grade==='adult'?'selected':''}>おとな（大人）｜おまけコース</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>生年月日（任意）</label>
                <input type="date" id="ob-birthday" value="${esc(d.birthday)}">
            </div>
            <p class="ob-error hidden" id="ob-error">ニックネームと、年齢または学年を入力してください。</p>
            <button class="btn btn-primary btn-wide" id="ob-next">つぎへ</button>
        `, 25);
        $('#ob-next').onclick = () => {
            d.nickname = $('#ob-nickname').value.trim();
            d.age = $('#ob-age').value;
            d.grade = $('#ob-grade').value;
            d.birthday = $('#ob-birthday').value;
            if (!d.nickname || (!d.age && !d.grade)) { $('#ob-error').classList.remove('hidden'); return; }
            wizard.step = 2; renderOnboarding();
        };
    }

    function renderObInterests() {
        const d = wizard.data;
        obShell(`
            <h2>${esc(d.nickname)}さんの「好きなもの」</h2>
            <p class="ob-lead">好きなものに近いクエストが、冒険に多く登場するようになります。（いくつでも）</p>
            <div class="chip-grid" id="ob-chips">
                ${ADV_DATA.interests.map(i => `
                    <button class="chip ${d.interests.includes(i.id)?'chip-on':''}" data-id="${i.id}">${i.label}</button>`).join('')}
            </div>
            <button class="btn btn-primary btn-wide" id="ob-next">つぎへ</button>
        `, 50);
        $('#ob-chips').addEventListener('click', e => {
            const b = e.target.closest('.chip'); if (!b) return;
            const id = b.dataset.id;
            if (d.interests.includes(id)) d.interests = d.interests.filter(x => x !== id);
            else d.interests.push(id);
            b.classList.toggle('chip-on');
        });
        $('#ob-next').onclick = () => { wizard.step = 3; renderOnboarding(); };
    }

    function renderObGoals() {
        const d = wizard.data;
        obShell(`
            <h2>この冒険で育ってほしい力</h2>
            <p class="ob-lead">選んだ力が育つように、AIが物語の中へ自然に学びを織り込みます。（いくつでも）</p>
            <div class="chip-grid" id="ob-chips">
                ${ADV_DATA.goals.map(g => `
                    <button class="chip ${d.goals.includes(g.id)?'chip-on':''}" data-id="${g.id}">${g.label}</button>`).join('')}
            </div>
            <button class="btn btn-primary btn-wide" id="ob-next">しおりを完成させる</button>
        `, 75);
        $('#ob-chips').addEventListener('click', e => {
            const b = e.target.closest('.chip'); if (!b) return;
            const id = b.dataset.id;
            if (d.goals.includes(id)) d.goals = d.goals.filter(x => x !== id);
            else d.goals.push(id);
            b.classList.toggle('chip-on');
        });
        $('#ob-next').onclick = () => {
            AdvEngine.setProfile({ ...wizard.data, createdAt: new Date().toISOString() });
            wizard.step = 4; renderOnboarding();
        };
    }

    function renderObDone() {
        const d = wizard.data;
        obShell(`
            <div class="ob-buddy">${ADV_CHARA.mark('lantern', 'adv-mark-lg')}</div>
            <h2>冒険のしおりが できました</h2>
            <p class="ob-lead">ここからは <strong>${esc(d.nickname)}</strong> さんの番です。プペルとルビッチが広場で待っています。端末をお子さまに渡してあげてください。</p>
            <button class="btn btn-primary btn-wide" id="ob-start">ぼうけんを はじめる</button>
        `, 100);
        $('#ob-start').onclick = () => go('town');
    }

    /* ================= 町（ホーム） ================= */

    function renderTown() {
        const st = AdvEngine.state;
        const p = st.profile;
        const areas = ADV_DATA.areas;
        const unlocked = AdvEngine.unlockedAreas().map(a => a.id);
        const recs = AdvEngine.recommendQuests(1);
        const rec = recs[0];
        const nextArea = areas.find(a => !unlocked.includes(a.id));
        const lightPct = nextArea ? Math.min(100, Math.round(st.light / nextArea.light * 100)) : 100;
        const greeting = townGreeting(p, st);

        app.innerHTML = `
        <div class="town-wrap">
            <header class="town-header">
                <div>
                    <h1 class="town-title">えんとつ町探検団</h1>
                    <p class="town-sub">たんけんか：<strong>${esc(p.nickname)}</strong>さん ${st.streak >= 2 ? `｜${ADV_CHARA.mark('flame')} ${st.streak}日れんぞく` : ''}</p>
                </div>
                <button class="btn-mini" id="btn-parent">おうちのかたへ</button>
            </header>

            <div class="buddy-bubble glass-card">
                ${ADV_CHARA.face('pupelle')}
                <p>${rk(greeting)}</p>
            </div>

            <div class="light-meter glass-card">
                <div class="light-meter-head">
                    <span>${ADV_CHARA.mark('lantern')} 町にもどった光：<strong>${st.light}</strong></span>
                    <span class="light-next">${nextArea ? `つぎのエリアまで あと${nextArea.light - st.light}` : '町じゅうが 光でいっぱい！'}</span>
                </div>
                <div class="light-bar"><div class="light-bar-fill" style="width:${lightPct}%"></div></div>
                <div class="virtue-row">
                    ${Object.entries(ADV_DATA.virtues).map(([k, v]) =>
                        `<span class="virtue-pill" title="${v.label}">${ADV_CHARA.virtue(k)} ${st.virtues[k] || 0}</span>`).join('')}
                </div>
            </div>

            ${rec ? `
            <div class="today-quest glass-card">
                <p class="today-label">きょうの ミッション</p>
                <div class="today-quest-body">
                    <span class="icon-chip">${rec.icon}</span>
                    <div>
                        <h3>${rk(rec.title)}</h3>
                        <p class="today-area">${rk(areas.find(a => a.id === rec.area).label)} から スタート</p>
                    </div>
                </div>
                <p class="today-area" style="margin-top:8px;">ぼうけんを つづけて、ぜんぶで <strong>${MISSION_TARGET}もん</strong> に ちょうせんしよう！</p>
                <button class="btn btn-primary btn-wide" id="btn-start-rec">きょうの ミッションを はじめる</button>
            </div>` : ''}

            <h2 class="town-section-title">えんとつ町のちず</h2>
            <div class="area-grid">
                ${areas.map(a => {
                    const open = unlocked.includes(a.id);
                    const quests = AdvEngine.questsInArea(a.id);
                    const done = quests.filter(q => AdvEngine.state.completed[q.id]).length;
                    return `
                    <div class="area-card glass-card ${open ? '' : 'area-locked'}" data-area="${a.id}">
                        <div class="area-icon">${open ? a.icon : ADV_CHARA.mark('lock')}</div>
                        <h3>${rk(a.label)}</h3>
                        ${open
                            ? `<p class="area-desc">${rk(a.desc)}</p><p class="area-progress">クエスト ${done}/${quests.length}</p>`
                            : `<p class="area-desc">光が <strong>${a.light}</strong> あつまると ひらくよ</p>`}
                    </div>`;
                }).join('')}
            </div>

            <div class="town-footer">
                <button class="btn btn-outline" id="btn-album">ぼうけんアルバム</button>
                <a class="btn btn-outline" href="https://poupelle.com/" target="_blank" rel="noopener">『えんとつ町のプペル』公式サイト</a>
            </div>
        </div>`;

        $('#btn-parent').onclick = () => go('parentGate');
        $('#btn-album').onclick = () => go('album');
        if (rec) $('#btn-start-rec').onclick = () => { startMission(); go('quest', rec.id); };
        document.querySelectorAll('.area-card:not(.area-locked)').forEach(el => {
            el.onclick = () => renderAreaSheet(el.dataset.area);
        });
    }

    function townGreeting(p, st) {
        const name = p.nickname;
        const hour = new Date().getHours();
        const pool = [];
        if (Object.keys(st.completed).length === 0) {
            pool.push(`やあ、${name}！ぼくプペル。きみが来るのをずっと待ってたんだ！さっそく広場においでよ！`);
        } else {
            if (hour < 10) pool.push(`おはよう、${name}！朝の町は、パンのにおいがするんだよ。`);
            else if (hour >= 18) pool.push(`こんばんは、${name}！夜のえんとつ町も、なかなかいいでしょ。`);
            else pool.push(`やあ、${name}！今日はどこを冒険しようか？`);
            if (st.streak >= 3) pool.push(`${name}、${st.streak}日もつづけて来てくれてるんだね。ぼく、うれしいよ！`);
            const growing = AdvEngine.dashboard().growing;
            if (growing.length) pool.push(`ルビッチが言ってたよ。「${name}の${growing[0].goal.label}、すごく伸びてる」って！`);
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function renderAreaSheet(areaId) {
        const area = ADV_DATA.areas.find(a => a.id === areaId);
        const quests = AdvEngine.questsInArea(areaId);
        const st = AdvEngine.state;
        const sheet = document.createElement('div');
        sheet.className = 'sheet-overlay';
        sheet.innerHTML = `
        <div class="sheet glass-card">
            <div class="sheet-head">
                <h3><span class="icon-chip icon-chip-sm">${area.icon}</span> ${rk(area.label)}</h3>
                <button class="btn-mini" id="sheet-close">とじる</button>
            </div>
            <p class="area-desc">${rk(area.desc)}</p>
            <div class="sheet-quests">
                ${quests.map(q => `
                    <button class="quest-row" data-q="${q.id}">
                        <span class="icon-chip icon-chip-sm">${q.icon}</span>
                        <span class="quest-row-title">${rk(q.title)}</span>
                        <span class="quest-row-state">${st.completed[q.id] ? ADV_CHARA.mark('star') + ' クリア' : 'あたらしい！'}</span>
                    </button>`).join('')}
            </div>
        </div>`;
        document.body.appendChild(sheet);
        sheet.querySelector('#sheet-close').onclick = () => sheet.remove();
        sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
        sheet.querySelectorAll('.quest-row').forEach(b => {
            b.onclick = () => { sheet.remove(); mission = null; go('quest', b.dataset.q); };
        });
    }

    /* ================= きょうのミッション（クエスト連戦） ================= */

    const MISSION_TARGET = 10;   // 1日のミッションの目標もんだい数
    let mission = null;          // { doneSteps, quests, played: [questId] }

    function startMission() {
        mission = { doneSteps: 0, quests: 0, played: [] };
    }

    /* ミッションのつぎのクエスト（まだ遊んでいないおすすめから） */
    function nextMissionQuest() {
        if (!mission || mission.doneSteps >= MISSION_TARGET) return null;
        const cand = AdvEngine.recommendQuests(ADV_DATA.quests.length)
            .filter(q => !mission.played.includes(q.id));
        return cand[0] || null;
    }

    /* ================= クエスト（物語＋学び） ================= */

    let questCtx = null;

    function renderQuest(questId) {
        const session = AdvEngine.startQuest(questId);
        if (!session) { go('town'); return; }
        if (mission) mission.played.push(questId);
        questCtx = { phase: 'intro', lineIndex: 0, bonus: null };
        app.innerHTML = `
        <div class="quest-wrap">
            <header class="quest-header">
                <button class="btn-mini" id="quest-quit">← 町にもどる</button>
                <span class="quest-title-mini">${rk(session.quest.title)}</span>
            </header>
            <div id="quest-stage"></div>
        </div>`;
        $('#quest-quit').onclick = () => { mission = null; go('town'); };
        renderQuestPhase();
    }

    function stage() { return $('#quest-stage'); }

    function renderQuestPhase() {
        const s = AdvEngine.session;
        if (questCtx.phase === 'intro') renderStoryLines(s.quest.intro, () => { questCtx.phase = 'step'; renderQuestPhase(); });
        else if (questCtx.phase === 'step') renderStep();
        else if (questCtx.phase === 'outro') renderStoryLines(s.quest.outro, () => finishQuest());
    }

    /* 物語のセリフを1つずつ表示 */
    function renderStoryLines(lines, done) {
        questCtx.lineIndex = 0;
        const show = () => {
            if (questCtx.lineIndex >= lines.length) { done(); return; }
            const line = lines[questCtx.lineIndex];
            const ch = charOf(line.sp, line.npc);
            stage().innerHTML = `
            <div class="story-scene">
                ${line.sp === 'narrator'
                    ? `<p class="narrator-text">${rk(line.t)}</p>`
                    : `<div class="dialog glass-card">
                         ${ADV_CHARA.face(ch.art)}
                         <div class="dialog-body">
                           <p class="dialog-name">${esc(ch.name)}</p>
                           <p class="dialog-text">${rk(line.t)}</p>
                         </div>
                       </div>`}
                <button class="btn btn-primary btn-wide" id="story-next">つぎへ</button>
            </div>`;
            $('#story-next').onclick = () => { questCtx.lineIndex++; show(); };
        };
        show();
    }

    function renderStep() {
        const step = AdvEngine.currentStep();
        if (!step) { questCtx.phase = 'outro'; renderQuestPhase(); return; }
        const ch = charOf(step.sp, step.npc);
        const s = AdvEngine.session;
        const total = s.quest.tiers[s.tier].steps.length;

        const countLabel = mission
            ? `もんだい ${Math.min(MISSION_TARGET, mission.doneSteps + s.stepIndex + 1)} / ${MISSION_TARGET}`
            : `もんだい ${s.stepIndex + 1} / ${total}`;
        stage().innerHTML = `
        <div class="step-scene">
            <p class="step-count">${countLabel}</p>
            <div class="dialog glass-card">
                ${ADV_CHARA.face(ch.art)}
                <div class="dialog-body">
                    <p class="dialog-name">${esc(ch.name)}</p>
                    <p class="dialog-text">${rk(step.story)}</p>
                </div>
            </div>
            <div class="question-card glass-card">
                <p class="question-text">${rk(step.q)}</p>
                <div id="answer-area">${answerAreaHtml(step)}</div>
                <p class="feedback hidden" id="feedback"></p>
                <div id="step-actions">
                    <button class="btn btn-primary btn-wide" id="btn-answer">こたえる</button>
                </div>
            </div>
        </div>`;

        bindAnswerArea(step);
    }

    function answerAreaHtml(step) {
        if (step.type === 'choice' || step.type === 'heart') {
            return `<div class="option-list">
                ${step.options.map((o, i) => `<button class="option-btn" data-i="${i}">${rk(o)}</button>`).join('')}
            </div>`;
        }
        if (step.type === 'number') {
            return `<div class="number-answer">
                <input type="number" inputmode="decimal" step="any" id="num-input" placeholder="すうじ">
                <span class="number-unit">${esc(step.unit || '')}</span>
            </div>`;
        }
        return `<textarea id="free-input" rows="3" maxlength="200" placeholder="${esc(step.placeholder || 'じゆうに かいてね')}"></textarea>`;
    }

    function bindAnswerArea(step) {
        let selected = null;
        document.querySelectorAll('.option-btn').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('.option-btn').forEach(x => x.classList.remove('option-on'));
                b.classList.add('option-on');
                selected = b.dataset.i;
            };
        });
        $('#btn-answer').onclick = () => {
            let value = selected;
            if (step.type === 'number') value = $('#num-input').value;
            if (step.type === 'free') value = $('#free-input').value;
            if (value === null || String(value).trim() === '') {
                showFeedback('えらんでから「こたえる」を おしてね。', 'soft');
                return;
            }
            handleAnswer(step, value);
        };
    }

    function showFeedback(text, kind) {
        const f = $('#feedback');
        f.innerHTML = rk(text);
        f.className = `feedback fb-${kind}`;
    }

    function handleAnswer(step, value) {
        const res = AdvEngine.submitAnswer(value);

        if (res.action === 'correct') {
            let msg;
            if (step.type === 'heart') {
                const idx = parseInt(value, 10);
                msg = (step.heartReplies && step.heartReplies[idx]) || 'すてきな こたえだね！';
            } else if (step.type === 'free') {
                msg = step.freeReply || 'きみの ことば、しっかり うけとったよ！';
            } else {
                msg = (step.explain || '') + ' ' + AdvEngine.pickCorrectPhrase();
            }
            stepDone(msg, step.virtue, true);
        } else if (res.action === 'retry') {
            showFeedback('プペル「' + AdvEngine.pickRetryPhrase() + '」', 'retry');
        } else if (res.action === 'hint') {
            showFeedback('プペル「大丈夫。ゆっくり考えてみよう。ヒント：' + (step.hint || 'もういちど もんだいを よんでみよう。') + '」', 'hint');
        } else if (res.action === 'reveal') {
            const ans = step.type === 'choice' ? `こたえは「${step.options[step.answer]}」。` : `こたえは ${step.answer}${step.unit || ''}。`;
            stepDone('プペル「' + AdvEngine.pickRevealPhrase() + '」 ' + ans + ' ' + (step.explain || ''), null, false);
        }
    }

    /* ステップ完了 → かけら演出 → ボーナス判定 → 次へ */
    function stepDone(message, virtue, earned) {
        const vd = virtue && earned ? ADV_DATA.virtues[virtue] : null;
        showFeedback(message, earned ? 'good' : 'reveal');
        const actions = $('#step-actions');
        actions.innerHTML = `
            ${vd ? `<p class="virtue-earned">${ADV_CHARA.virtue(virtue)} 「${vd.label}」のかけらを みつけた！</p>` : ''}
            <button class="btn btn-primary btn-wide" id="btn-next">つぎへ</button>`;
        $('#btn-next').onclick = () => {
            if (AdvEngine.shouldOfferBonus()) { renderBonusOffer(); return; }
            advanceStep();
        };
    }

    function advanceStep() {
        const next = AdvEngine.nextStep();
        if (next) renderStep();
        else { questCtx.phase = 'outro'; renderQuestPhase(); }
    }

    /* ルビッチのボーナスチャレンジ */
    function renderBonusOffer() {
        stage().innerHTML = `
        <div class="step-scene">
            <div class="dialog glass-card dialog-bonus">
                ${ADV_CHARA.face('lubicchi')}
                <div class="dialog-body">
                    <p class="dialog-name">ルビッチ</p>
                    <p class="dialog-text">${rk(ADV_DATA.bonus.intro)}</p>
                </div>
            </div>
            <div class="bonus-actions">
                <button class="btn btn-primary btn-wide" id="btn-bonus-yes">やってみる！</button>
                <button class="btn btn-outline btn-wide" id="btn-bonus-no">つぎに すすむ</button>
            </div>
        </div>`;
        $('#btn-bonus-yes').onclick = () => renderBonusStep(AdvEngine.getBonusStep());
        $('#btn-bonus-no').onclick = () => { AdvEngine.getBonusStep(); advanceStep(); };
    }

    function renderBonusStep(bstep) {
        stage().innerHTML = `
        <div class="step-scene">
            <p class="step-count">${ADV_CHARA.mark('star')} ボーナスチャレンジ</p>
            <div class="question-card glass-card question-bonus">
                <p class="question-text">${rk(bstep.q)}</p>
                <div id="answer-area">${answerAreaHtml(bstep)}</div>
                <p class="feedback hidden" id="feedback"></p>
                <div id="step-actions">
                    <button class="btn btn-primary btn-wide" id="btn-answer">こたえる</button>
                </div>
            </div>
        </div>`;
        let selected = null;
        document.querySelectorAll('.option-btn').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('.option-btn').forEach(x => x.classList.remove('option-on'));
                b.classList.add('option-on');
                selected = b.dataset.i;
            };
        });
        $('#btn-answer').onclick = () => {
            let value = selected;
            if (bstep.type === 'number') value = $('#num-input').value;
            if (value === null || String(value).trim() === '') return;
            const ok = AdvEngine.submitBonus(bstep, value);
            const f = ok
                ? 'ルビッチ「' + (bstep.explain || 'せいかい！') + ' きみ、ほんとにすごいよ！」 町の光がひとつふえた！'
                : 'ルビッチ「おしい！でもボーナスに挑戦したこと自体がすごいんだ。こたえは ' + (bstep.type === 'choice' ? '「' + bstep.options[bstep.answer] + '」' : bstep.answer + (bstep.unit || '')) + ' だよ」';
            showFeedback(f, ok ? 'good' : 'reveal');
            $('#step-actions').innerHTML = `<button class="btn btn-primary btn-wide" id="btn-next">つぎへ</button>`;
            $('#btn-next').onclick = () => advanceStep();
        };
    }

    /* クエスト完了画面（ミッション中は つぎのぼうけんへ 続けられる） */
    function finishQuest() {
        const s = AdvEngine.session;
        const questSteps = s.quest.tiers[s.tier].steps.length;
        const result = AdvEngine.completeQuest();

        let next = null;
        if (mission) {
            mission.doneSteps += questSteps;
            mission.quests++;
            next = nextMissionQuest();
        }
        const missionDone = mission && !next;
        const progress = mission ? Math.min(MISSION_TARGET, mission.doneSteps) : 0;

        stage().innerHTML = `
        <div class="finish-scene glass-card">
            <div class="finish-lantern">${ADV_CHARA.mark('lantern', 'adv-mark-lg')}</div>
            <h2>ぼうけん たっせい！</h2>
            <p class="finish-quest">${rk(result.quest.title)}</p>
            <p class="finish-light">町に 光が <strong>＋${result.light}</strong> もどったよ！</p>
            <p class="finish-phrase">プペル「${rk(result.endPhrase)}」</p>
            ${result.newAreas.map(a => `<p class="finish-unlock">あたらしいエリア「${rk(a.label)}」が ひらいた！</p>`).join('')}
            ${result.newBadges.map(b => `<p class="finish-badge">${ADV_CHARA.mark('star')} バッジ「${rk(b.label)}」を てにいれた！</p>`).join('')}
            ${mission ? `
                <p class="mission-progress">きょうのミッション：もんだい <strong>${progress} / ${MISSION_TARGET}</strong></p>
                <div class="light-bar"><div class="light-bar-fill" style="width:${Math.round(progress / MISSION_TARGET * 100)}%"></div></div>` : ''}
            ${missionDone ? `<p class="finish-unlock">きょうの ミッション コンプリート！よく がんばったね！</p>` : ''}
            ${next ? `<button class="btn btn-primary btn-wide" id="btn-next-quest">つぎの ぼうけんへ（${rk(next.title)}）</button>` : ''}
            <button class="btn ${next ? 'btn-outline' : 'btn-primary'} btn-wide" id="btn-back-town">${next ? 'きょうは ここまで' : '町に もどる'}</button>
        </div>`;
        if (next) $('#btn-next-quest').onclick = () => go('quest', next.id);
        $('#btn-back-town').onclick = () => { mission = null; go('town'); };
    }

    /* ================= アルバム ================= */

    function renderAlbum() {
        const st = AdvEngine.state;
        app.innerHTML = `
        <div class="town-wrap">
            <header class="quest-header">
                <button class="btn-mini" id="btn-back">← 町にもどる</button>
                <span class="quest-title-mini">ぼうけんアルバム</span>
            </header>

            <h2 class="town-section-title">あつめたバッジ</h2>
            <div class="badge-grid">
                ${ADV_DATA.badges.map(b => {
                    const got = st.badges.includes(b.id);
                    return `<div class="badge-card glass-card ${got ? '' : 'badge-locked'}">
                        <div class="badge-icon">${got ? b.icon : '？'}</div>
                        <p class="badge-label">${got ? rk(b.label) : '？？？'}</p>
                        <p class="badge-desc">${rk(b.desc)}</p>
                    </div>`;
                }).join('')}
            </div>

            <h2 class="town-section-title">おもいで</h2>
            ${st.album.length === 0 ? '<p class="album-empty">クエストをクリアすると、ここに おもいでが たまっていくよ。</p>' : ''}
            <div class="memory-list">
                ${st.album.slice().reverse().map(m => {
                    const q = AdvEngine.questById(m.questId);
                    return q ? `<div class="memory-card glass-card">
                        <span class="icon-chip icon-chip-sm">${q.icon}</span>
                        <div><p class="memory-title">${rk(q.title)}</p><p class="memory-date">${esc(m.date)}</p></div>
                    </div>` : '';
                }).join('')}
            </div>
        </div>`;
        $('#btn-back').onclick = () => go('town');
    }

    /* ================= 保護者ゲート ================= */

    function renderParentGate() {
        const a = 3 + Math.floor(Math.random() * 6);
        const b = 4 + Math.floor(Math.random() * 6);
        app.innerHTML = `
        <div class="ob-wrap"><div class="glass-card ob-card">
            <h2>おうちのかた 確認</h2>
            <p class="ob-lead">保護者の方向けの画面です。つぎの計算に答えてください。</p>
            <p class="gate-q">${a} × ${b} ＝ ？</p>
            <div class="form-group"><input type="number" id="gate-input" placeholder="こたえ"></div>
            <p class="ob-error hidden" id="gate-error">こたえが ちがうようです。</p>
            <button class="btn btn-primary btn-wide" id="gate-ok">ひらく</button>
            <button class="btn btn-outline btn-wide" id="gate-back">町に もどる</button>
        </div></div>`;
        $('#gate-ok').onclick = () => {
            if (parseInt($('#gate-input').value, 10) === a * b) go('parent');
            else $('#gate-error').classList.remove('hidden');
        };
        $('#gate-back').onclick = () => go('town');
    }

    /* ================= 保護者ダッシュボード（冒険日記） ================= */

    function renderParent() {
        const d = AdvEngine.dashboard();
        const p = d.profile;
        const goalLabel = id => (ADV_DATA.goals.find(g => g.id === id) || {}).label || id;
        const interestLabel = id => { const i = ADV_DATA.interests.find(x => x.id === id); return i ? i.label : id; };
        const tierNames = { 1: '5〜6歳向け', 2: '小1〜2向け', 3: '小3〜4向け', 4: '小5〜6向け', 5: 'おとな向け' };

        app.innerHTML = `
        <div class="town-wrap parent-wrap">
            <header class="quest-header">
                <button class="btn-mini" id="btn-back">← 町にもどる</button>
                <span class="quest-title-mini">今日の冒険日記</span>
            </header>

            <div class="glass-card parent-card">
                <h2>${esc(p.nickname)}さんの冒険日記 <span class="parent-date">${esc(d.date)}</span></h2>
                <p class="parent-meta">
                    連続冒険：${d.streak}日 ｜ 町にもどした光：${d.light} ｜ クリアした冒険：${d.totalQuests}
                    ｜ いまの学びの段階：${tierNames[d.tier]}（AIが自動調整）
                </p>
            </div>

            <div class="glass-card parent-card">
                <h3>AIからのメッセージ</h3>
                <p class="parent-message">${esc(d.message)}</p>
            </div>

            <div class="glass-card parent-card">
                <h3>今日おすすめの親子会話</h3>
                <p>${esc(d.talk)}</p>
            </div>

            <div class="parent-grid">
                <div class="glass-card parent-card">
                    <h3>今日の冒険</h3>
                    ${d.day.quests.length
                        ? `<ul class="parent-list">${d.day.quests.map(q => `<li>${esc(q.title)}</li>`).join('')}</ul>`
                        : '<p class="parent-empty">今日はまだ冒険に出ていません。</p>'}
                </div>
                <div class="glass-card parent-card">
                    <h3>今日のお金の学び</h3>
                    ${d.day.learnings.length
                        ? `<ul class="parent-list">${d.day.learnings.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
                        : '<p class="parent-empty">今日はお金の学びはありませんでした。</p>'}
                </div>
                <div class="glass-card parent-card">
                    <h3>今日の心の選択</h3>
                    ${d.day.hearts.length
                        ? `<ul class="parent-list">${d.day.hearts.map(h => `<li>「${esc(h.q)}」→ <strong>${esc(h.a)}</strong></li>`).join('')}</ul>`
                        : '<p class="parent-empty">今日は心の選択の場面はありませんでした。</p>'}
                </div>
                <div class="glass-card parent-card">
                    <h3>最近伸びている力</h3>
                    ${d.growing.length
                        ? d.growing.map(g => `
                            <div class="skill-row">
                                <span class="skill-name">${esc(g.goal.label)}</span>
                                <div class="skill-bar"><div class="skill-bar-fill" style="width:${g.level}%"></div></div>
                            </div>`).join('')
                        : '<p class="parent-empty">冒険を重ねると、ここに育っている力が表示されます。</p>'}
                    <p class="parent-note">※ 点数やテストではなく、日々の冒険の様子から見守った記録です。</p>
                </div>
            </div>

            <div class="glass-card parent-card">
                <h3>集めた心のかけら</h3>
                <div class="virtue-row">
                    ${Object.entries(ADV_DATA.virtues).map(([k, v]) =>
                        `<span class="virtue-pill">${ADV_CHARA.virtue(k)} ${v.label} × ${d.virtues[k] || 0}</span>`).join('')}
                </div>
            </div>

            ${d.freeAnswers.length ? `
            <div class="glass-card parent-card">
                <h3>最近の「自分の言葉」</h3>
                <ul class="parent-list">
                    ${d.freeAnswers.map(f => `<li><span class="parent-note">${esc(f.q)}</span><br>「${esc(f.a)}」</li>`).join('')}
                </ul>
            </div>` : ''}

            <div class="glass-card parent-card">
                <h3>これまでの日記</h3>
                ${d.recentDays.length
                    ? d.recentDays.map(rd => `
                        <div class="diary-day">
                            <p class="diary-date">${esc(rd.date)}</p>
                            <p>${rd.entry.quests.map(q => esc(q.title)).join('、') || '記録なし'}</p>
                        </div>`).join('')
                    : '<p class="parent-empty">まだ日記はありません。</p>'}
            </div>

            <div class="glass-card parent-card">
                <h3>冒険のしおり</h3>
                <p class="parent-meta">
                    ニックネーム：${esc(p.nickname)} ｜ ${p.age ? p.age + '歳' : ''} ${p.grade ? (p.grade === 'pre' ? '未就学' : '小学' + p.grade + '年生') : ''}<br>
                    好きなもの：${(p.interests || []).map(interestLabel).join('、') || '未設定'}<br>
                    育ってほしい力：${(p.goals || []).map(goalLabel).join('、') || '未設定'}
                </p>
                <button class="btn btn-outline" id="btn-edit-profile">しおりを編集する</button>
                <button class="btn btn-outline btn-danger" id="btn-reset">はじめから やりなおす</button>
                <p class="parent-note">※ データはこの端末のブラウザ内にのみ保存されています。</p>
            </div>
        </div>`;

        $('#btn-back').onclick = () => go('town');
        $('#btn-edit-profile').onclick = () => {
            Object.assign(wizard.data, {
                nickname: p.nickname, age: p.age || '', grade: p.grade || '',
                birthday: p.birthday || '', interests: [...(p.interests || [])], goals: [...(p.goals || [])]
            });
            wizard.step = 1;
            go('onboarding');
        };
        $('#btn-reset').onclick = () => {
            if (confirm('すべての冒険の記録が消えます。本当にはじめからやりなおしますか？')) {
                AdvEngine.reset();
                wizard.step = 0;
                wizard.data = { nickname: '', age: '', grade: '', birthday: '', interests: [], goals: [] };
                go('onboarding');
            }
        };
    }

    /* ================= 起動 ================= */

    if (AdvEngine.getProfile()) go('town');
    else go('onboarding');
});
