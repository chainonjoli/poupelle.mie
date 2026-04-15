document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const successMsg = document.getElementById('success-message');
    
    // Replace this URL with your actual GAS Web App URL after deployment
    const GAS_URL = 'YOUR_GAS_WEB_APP_URL_HERE';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Feedback
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = '送信中...';
        submitBtn.querySelector('.loader').classList.remove('hidden');

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            adult_count: formData.get('adult_count'),
            child_count: formData.get('child_count'),
            message: formData.get('message'),
            timestamp: new Date().toLocaleString('ja-JP')
        };

        try {
            // In a real scenario, you'd use fetch(GAS_URL, { method: 'POST', body: JSON.stringify(data) })
            // For this demo, we'll simulate a successful submission since the URL isn't set yet.
            console.log('Form submission data:', data);
            
            if (GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
                alert('GASのURLが設定されていません。バックエンドの設定が必要です。');
                // Simulate success for visual check
                setTimeout(() => {
                    form.classList.add('hidden');
                    successMsg.classList.remove('hidden');
                    window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
                }, 1000);
            } else {
                const response = await fetch(GAS_URL, {
                    method: 'POST',
                    mode: 'no-cors', // GAS often requires no-cors for simple POST
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                form.classList.add('hidden');
                successMsg.classList.remove('hidden');
                window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('送信中にエラーが発生しました。時間をおいて再度お試しください。');
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'この内容でお申し込み';
            submitBtn.querySelector('.loader').classList.add('hidden');
        }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
