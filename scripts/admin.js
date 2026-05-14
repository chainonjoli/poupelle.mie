document.addEventListener('DOMContentLoaded', () => {
    // === 管理者はここでGASのURLを設定します ===
    // main.js と同じURLを設定してください
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzNRdUPsWnd73iCYGX6mtKASsNDmUzwkN9zJU9WQYuJf_1iG_I3B8ZEfscY8wGvYbEo/exec';
    
    const countDisplay = document.getElementById('current-count');
    const refreshBtn = document.getElementById('refresh-btn');
    const form = document.getElementById('cancel-form');
    const submitBtn = document.getElementById('submit-btn');
    const adminMessage = document.getElementById('admin-message');

    // 人数を取得する関数
    async function fetchCurrentCount() {
        if (GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
            countDisplay.textContent = 'デモ';
            return;
        }

        countDisplay.textContent = '...';
        try {
            // GETリクエストで現在の人数を取得
            const response = await fetch(GAS_URL);
            const data = await response.json();
            countDisplay.textContent = data.total_children;
        } catch (error) {
            console.error('Error fetching count:', error);
            countDisplay.textContent = 'エラー';
            showMessage('人数の取得に失敗しました。URLを確認してください。', true);
        }
    }

    // メッセージ表示用
    function showMessage(msg, isError = false) {
        adminMessage.textContent = msg;
        adminMessage.classList.remove('hidden');
        if (isError) {
            adminMessage.style.backgroundColor = 'rgba(127, 29, 29, 0.2)';
            adminMessage.style.color = '#fca5a5';
        } else {
            adminMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            adminMessage.style.color = '#6ee7b7';
        }
    }

    // 初回読み込み時に人数を取得
    fetchCurrentCount();

    // 更新ボタンのクリック
    refreshBtn.addEventListener('click', fetchCurrentCount);

    // キャンセルフォームの送信
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cancelCount = document.getElementById('cancel-count').value;
        
        if (!confirm(`本当に「${cancelCount}名」の子どもの予約を取り消しますか？`)) {
            return;
        }

        // UI Feedback
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = '処理中...';
        
        const data = {
            action: 'cancel',
            cancel_count: cancelCount
        };

        try {
            if (GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
                // デモモード
                setTimeout(() => {
                    showMessage(`デモ：${cancelCount}名のキャンセルを処理しました。`);
                    submitBtn.disabled = false;
                    submitBtn.querySelector('.btn-text').textContent = 'この人数を取り消す';
                    document.getElementById('cancel-count').value = 1;
                }, 1000);
            } else {
                const response = await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                // no-cors のためレスポンスボディは読めませんが、成功として扱います
                showMessage(`${cancelCount}名のキャンセル処理を送信しました。`);
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').textContent = 'この人数を取り消す';
                document.getElementById('cancel-count').value = 1;
                
                // 少し待ってから最新人数を再取得
                setTimeout(fetchCurrentCount, 2000);
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('処理中にエラーが発生しました。', true);
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'この人数を取り消す';
        }
    });
});
