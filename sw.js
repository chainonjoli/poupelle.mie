/* 十色神社 Service Worker
   方針: ネットワーク優先＋キャッシュフォールバック。
   更新はすぐ届き、オフライン時は前回の参拝内容で表示できる。 */
var CACHE_NAME = 'toiro-shrine-v15';
var CORE_ASSETS = [
    './shrine.html',
    './styles/shrine.css?v=20260712a',
    './scripts/shrine.js?v=20260712a',
    './manifest.webmanifest',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(CORE_ASSETS);
        }).then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return; /* フォント等の外部リソースはブラウザに任せる */

    event.respondWith(
        /* HTTPキャッシュを介さず毎回サーバーに再検証する（更新の取りこぼしで
           HTMLとJSのバージョンが混ざる事故を防ぐ。未変更なら304で軽い） */
        fetch(event.request, { cache: 'no-cache' }).then(function (response) {
            /* 取得できたらキャッシュを最新に保つ */
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
            return response;
        }).catch(function () {
            /* オフライン時はキャッシュから */
            return caches.match(event.request).then(function (cached) {
                return cached || caches.match('./shrine.html');
            });
        })
    );
});
