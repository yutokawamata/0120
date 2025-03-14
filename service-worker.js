const CACHE_NAME = 'kanji-challenge-v3';
const STATIC_CACHE = 'static-cache-v3';
const DYNAMIC_CACHE = 'dynamic-cache-v3';
const RESOURCE_CACHE = 'resource-cache-v3';

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
  // 新しいService Workerをすぐにアクティベート
  self.skipWaiting();
});

// アクティベート時の処理
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティベート中...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, RESOURCE_CACHE];
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
    event.respondWith(cacheFirst(event.request, RESOURCE_CACHE));
    return;
  }
  
  // 音声ファイルの処理（キャッシュファースト戦略）
  if (
    requestUrl.pathname.includes('/Kanji/Sound/') ||
    event.request.url.match(/\.(mp3|wav|ogg)$/i)
  ) {
    event.respondWith(cacheFirst(event.request, RESOURCE_CACHE));
    return;
  }
  
  // その他のリクエストはネットワークファースト戦略
  event.respondWith(networkFirst(event.request));
});

// キャッシュファースト戦略
async function cacheFirst(request, cacheName = DYNAMIC_CACHE) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[Service Worker] キャッシュから返却:', request.url);
    // バックグラウンドで更新チェック
    updateResourceInBackground(request, cacheName);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
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

// バックグラウンドでリソースの更新をチェック
async function updateResourceInBackground(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // レスポンスのヘッダーを取得
      const cachedResponse = await cache.match(request);
      const cachedLastModified = cachedResponse.headers.get('last-modified');
      const newLastModified = networkResponse.headers.get('last-modified');
      
      // Last-Modifiedヘッダーがあり、値が異なる場合は更新
      if (newLastModified && cachedLastModified !== newLastModified) {
        console.log('[Service Worker] リソースが更新されたためキャッシュを更新:', request.url);
        await cache.put(request, networkResponse);
      }
    }
  } catch (error) {
    console.log('[Service Worker] バックグラウンド更新チェック失敗:', error);
    // エラーは無視して続行
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

// メッセージイベントのリスナー（アプリからのメッセージを受け取る）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_RESOURCES') {
    console.log('[Service Worker] リソースの事前キャッシュを開始します');
    
    // 画像と音声ファイルのURLリストを受け取る
    const { imageUrls, audioUrls } = event.data;
    
    // リソースをキャッシュする
    cacheResources(imageUrls, audioUrls)
      .then(() => {
        // キャッシュ完了をクライアントに通知
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_COMPLETE',
            success: true
          });
        }
      })
      .catch(error => {
        console.error('[Service Worker] リソースキャッシュ中にエラー:', error);
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_COMPLETE',
            success: false,
            error: error.message
          });
        }
      });
  }
});

// リソースをキャッシュする関数
async function cacheResources(imageUrls, audioUrls) {
  const cache = await caches.open(RESOURCE_CACHE);
  
  // 画像をキャッシュ
  if (imageUrls && imageUrls.length) {
    console.log(`[Service Worker] ${imageUrls.length}個の画像をキャッシュします`);
    const imagePromises = imageUrls.map(async url => {
      try {
        // キャッシュに既に存在するか確認
        const existingResponse = await cache.match(url);
        if (existingResponse) {
          console.log(`[Service Worker] 画像は既にキャッシュ済み: ${url}`);
          return;
        }
        
        // キャッシュに存在しない場合はフェッチしてキャッシュ
        const response = await fetch(url, { mode: 'no-cors' });
        if (response) {
          await cache.put(url, response);
          console.log(`[Service Worker] 画像をキャッシュしました: ${url}`);
        }
      } catch (error) {
        console.error(`[Service Worker] 画像キャッシュ失敗: ${url}`, error);
        // エラーは無視して続行
      }
    });
    
    await Promise.all(imagePromises);
  }
  
  // 音声をキャッシュ
  if (audioUrls && audioUrls.length) {
    console.log(`[Service Worker] ${audioUrls.length}個の音声をキャッシュします`);
    const audioPromises = audioUrls.map(async url => {
      try {
        // キャッシュに既に存在するか確認
        const existingResponse = await cache.match(url);
        if (existingResponse) {
          console.log(`[Service Worker] 音声は既にキャッシュ済み: ${url}`);
          return;
        }
        
        // キャッシュに存在しない場合はフェッチしてキャッシュ
        const response = await fetch(url, { mode: 'no-cors' });
        if (response) {
          await cache.put(url, response);
          console.log(`[Service Worker] 音声をキャッシュしました: ${url}`);
        }
      } catch (error) {
        console.error(`[Service Worker] 音声キャッシュ失敗: ${url}`, error);
        // エラーは無視して続行
      }
    });
    
    await Promise.all(audioPromises);
  }
  
  console.log('[Service Worker] すべてのリソースのキャッシュが完了しました');
} 