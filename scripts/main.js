document.addEventListener('DOMContentLoaded', () => {
    const form       = document.getElementById('booking-form');
    const submitBtn  = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-message');

    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzXp-D7-ZSp_riRNJmQdF1ApYIJ57JvB1rdcjWuJcDlZmD7QkEpdHUNxXJJhT7Fthk6/exec';

    // ─── 残り枠の状態（ページ読み込み時に取得） ───
    let remainingChildren    = 200; // GAS取得まで最大値で初期化
    let remainingFreeAdults  = 60;

    // ─── DOM要素 ────────────────────────────────
    const childCountInput    = document.getElementById('child-count');
    const adultCountInput    = document.getElementById('adult-count');
    const childFreeDisplay   = document.getElementById('child-free-display');
    const childFreeNote      = document.getElementById('child-free-note');
    const adultFreeDisplay   = document.getElementById('adult-free-display');
    const adultFreeNote      = document.getElementById('adult-free-note');
    const totalChildrenEl    = document.getElementById('total-children');
    const totalAdultsEl      = document.getElementById('total-adults');
    const totalAllEl         = document.getElementById('total-all');

    // ─── JSONP で残り枠を取得 ─────────────────────
    function fetchStatus() {
        const callbackName = 'gasStatus_' + Date.now();
        window[callbackName] = (data) => {
            delete window[callbackName];
            const s = document.getElementById('_gas_jsonp');
            if (s) s.remove();
            remainingChildren   = data.remaining_children   ?? 200;
            remainingFreeAdults = data.remaining_free_adults ?? 60;
            updateDisplays();
        };
        const script = document.createElement('script');
        script.id  = '_gas_jsonp';
        script.src = `${GAS_URL}?callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            script.remove();
        };
        document.body.appendChild(script);
    }

    // ─── 表示を更新する関数 ───────────────────────
    function updateDisplays() {
        const children = parseInt(childCountInput.value) || 0;
        const adults   = parseInt(adultCountInput.value) || 0;

        // 【こどもの うち無料】
        // 先着200枚まで入力数と同じ
        const childFree = Math.min(children, remainingChildren);
        childFreeDisplay.textContent = `${childFree} 名`;
        if (children === 0) {
            childFreeNote.textContent = '';
        } else if (children > remainingChildren) {
            childFreeNote.textContent = `（残り${remainingChildren}名のみ無料）`;
            childFreeNote.style.color = '#fca5a5';
        } else {
            childFreeNote.textContent = `（先着${200}名まで入力数と同じ）`;
            childFreeNote.style.color = '';
        }

        // 【大人の うち無料】
        // ①子ども1人以上 ②残り枠あり → 1名（予定）、それ以外 → 0名
        let adultFree = 0;
        let adultNote = '';

        if (children === 0) {
            adultNote = '※こどもが1人以上の場合に自動付与';
            adultNote && (adultFreeNote.style.color = '#fca5a5');
        } else if (remainingFreeAdults <= 0) {
            adultNote = '（無料枠は満席です）';
            adultFreeNote.style.color = '#fca5a5';
        } else {
            adultFree = 1;
            adultNote = '（子育て応援枠・送信時に確定）';
            adultFreeNote.style.color = 'rgba(255,255,255,0.5)';
        }
        adultFreeDisplay.textContent = `${adultFree} 名`;
        adultFreeNote.textContent    = adultNote;

        // 【合計サマリー】
        totalChildrenEl.textContent = `${children} 名`;
        totalAdultsEl.textContent   = `${adults} 名`;
        totalAllEl.textContent      = `${children + adults} 名`;
    }

    // ─── イベント設定 ────────────────────────────
    childCountInput.addEventListener('input', updateDisplays);
    adultCountInput.addEventListener('input', updateDisplays);

    // ─── フォーム送信 ────────────────────────────
    form.addEventListener('submit', (e) => {
        // タイムスタンプをhiddenフィールドにセット
        document.getElementById('timestamp-field').value =
            new Date().toLocaleString('ja-JP');

        // ボタンをローディング状態に
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = '送信中...';
        submitBtn.querySelector('.loader').classList.remove('hidden');

        // フォームはiframeにそのまま送信される（e.preventDefault()しない）
        // 1秒後に成功画面を表示
        setTimeout(() => {
            form.classList.add('hidden');
            successMsg.classList.remove('hidden');
            window.scrollTo({ top: successMsg.offsetTop - 100, behavior: 'smooth' });
        }, 1000);
    });

    // ─── スムーススクロール ───────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // ─── 初期化 ──────────────────────────────────
    fetchStatus();   // GASから残り枠を取得
    updateDisplays(); // 初期表示
});
