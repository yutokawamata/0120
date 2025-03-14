const CACHE_NAME = 'kanji-challenge-v2';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

// 静的リソースのキャッシュリスト
const staticFilesToCache = [
  '/',
  '/index.html',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// インストール時の処理
self.addEventListener('install', event => {
  console.log('[Service Worker] インストール中...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] 静的リソースをキャッシュ中...');
        return cache.addAll(staticFilesToCache);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティベート中...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// フェッチ時の処理
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // 画像ファイルの処理（キャッシュファースト戦略）
  if (
    requestUrl.pathname.includes('/Kanji/Illust/') || 
    requestUrl.pathname.includes('/Images/') ||
    event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // 音声ファイルの処理（キャッシュファースト戦略）
  if (
    requestUrl.pathname.includes('/Kanji/Sound/') ||
    event.request.url.match(/\.(mp3|wav|ogg)$/i)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // その他のリクエストはネットワークファースト戦略
  event.respondWith(networkFirst(event.request));
});

// キャッシュファースト戦略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[Service Worker] キャッシュから返却:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      console.log('[Service Worker] 新しいリソースをキャッシュ:', request.url);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] フェッチに失敗:', error);
    // オフライン時のフォールバック処理をここに追加できます
    return new Response('オフラインです。このリソースはキャッシュされていません。');
  }
}

// ネットワークファースト戦略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      console.log('[Service Worker] 新しいリソースをキャッシュ:', request.url);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] ネットワークリクエスト失敗、キャッシュを確認:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 静的ファイルの場合はindex.htmlを返す
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    return new Response('オフラインです。このリソースはキャッシュされていません。');
  }
} 