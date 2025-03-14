const CACHE_NAME = 'kanji-challenge-v4';
const STATIC_CACHE = 'static-cache-v4';
const DYNAMIC_CACHE = 'dynamic-cache-v4';
const RESOURCE_CACHE = 'resource-cache-v4';

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
  
  // CSVファイルの処理（キャッシュファースト戦略）
  if (
    requestUrl.pathname.includes('/Kanji/CSV/') ||
    event.request.url.match(/\.(csv)$/i)
  ) {
    event.respondWith(cacheFirst(event.request, RESOURCE_CACHE));
    return;
  }
  
  // その他のリクエストはネットワークファースト戦略
  event.respondWith(networkFirst(event.request));
});

// キャッシュファースト戦略
async function cacheFirst(request, cacheName = DYNAMIC_CACHE) {
  try {
    // まずキャッシュを確認
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] キャッシュから返却:', request.url);
      // バックグラウンドで更新チェック（オンラインの場合のみ）
      if (navigator.onLine) {
        updateResourceInBackground(request, cacheName);
      }
      return cachedResponse;
    }
    
    // キャッシュになければネットワークから取得
    if (navigator.onLine) {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(cacheName);
          console.log('[Service Worker] 新しいリソースをキャッシュ:', request.url);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (fetchError) {
        console.error('[Service Worker] フェッチに失敗:', fetchError);
        // フェッチに失敗した場合は、再度キャッシュを確認（念のため）
        const reCheckCache = await caches.match(request);
        if (reCheckCache) {
          return reCheckCache;
        }
      }
    } else {
      console.log('[Service Worker] オフラインモードでキャッシュにないリソースが要求されました:', request.url);
    }
    
    // オフラインでキャッシュにもない場合のフォールバック
    return new Response('オフラインです。このリソースはキャッシュされていません。', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  } catch (error) {
    console.error('[Service Worker] キャッシュファースト戦略でエラー:', error);
    return new Response('エラーが発生しました。', {
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
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
    
    // リソースのURLリストと合計数を受け取る
    const { imageUrls, audioUrls, csvUrls, totalResources, onlyUncached } = event.data;
    
    // 合計リソース数を計算（totalResourcesが指定されていない場合）
    const totalCount = totalResources || 
                      (imageUrls ? imageUrls.length : 0) + 
                      (audioUrls ? audioUrls.length : 0) + 
                      (csvUrls ? csvUrls.length : 0);
    
    console.log(`[Service Worker] キャッシュ対象: 合計${totalCount}個のファイル`);
    console.log(`[Service Worker] キャッシュモード: ${onlyUncached ? '未キャッシュのみ' : '全て'}`);
    
    // リソースをキャッシュする
    cacheResources(imageUrls, audioUrls, csvUrls, totalCount, onlyUncached)
      .then((processedCount) => {
        // キャッシュ完了をクライアントに通知
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_COMPLETE',
            success: true,
            processedCount,
            totalCount
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
  } else if (event.data && event.data.type === 'CHECK_CACHE') {
    // 単一リソースのキャッシュ確認リクエスト
    const url = event.data.url;
    console.log(`[Service Worker] キャッシュ確認リクエスト: ${url}`);
    
    // キャッシュを確認
    checkCache(url)
      .then(isCached => {
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_STATUS',
            url: url,
            isCached: isCached
          });
        }
        
        // キャッシュされていない場合は、バックグラウンドでキャッシュを試みる
        if (!isCached) {
          console.log(`[Service Worker] リソースがキャッシュされていないため、キャッシュを試みます: ${url}`);
          cacheResource(url);
        }
      });
  } else if (event.data && event.data.type === 'CHECK_CACHE_STATUS') {
    // 全リソースのキャッシュ状態確認リクエスト
    console.log('[Service Worker] キャッシュ状態確認リクエストを受信しました');
    
    const { imageUrls, audioUrls, csvUrls, lastCacheUpdate } = event.data;
    
    // キャッシュ状態を確認
    checkCacheStatus(imageUrls, audioUrls, csvUrls)
      .then(result => {
        const { uncachedResources, uncachedCount } = result;
        
        console.log(`[Service Worker] キャッシュ状態確認結果: 未キャッシュ=${uncachedCount}個`);
        
        if (event.source) {
          // 未キャッシュのリソースがない場合
          if (uncachedCount === 0) {
            event.source.postMessage({
              type: 'CACHE_STATUS',
              status: 'complete',
              uncachedCount: 0
            });
          } else {
            // 未キャッシュのリソースがある場合
            event.source.postMessage({
              type: 'CACHE_STATUS',
              status: 'incomplete',
              uncachedCount,
              uncachedResources
            });
            
            // 未キャッシュのリソースを自動的にキャッシュ
            console.log('[Service Worker] 未キャッシュのリソースを自動的にキャッシュします');
            
            const totalCount = uncachedCount;
            cacheResources(
              uncachedResources.imageUrls, 
              uncachedResources.audioUrls, 
              uncachedResources.csvUrls, 
              totalCount,
              true
            ).then(processedCount => {
              event.source.postMessage({
                type: 'CACHE_COMPLETE',
                success: true,
                processedCount,
                totalCount
              });
            }).catch(error => {
              console.error('[Service Worker] 未キャッシュリソースのキャッシュ中にエラー:', error);
              event.source.postMessage({
                type: 'CACHE_COMPLETE',
                success: false,
                error: error.message
              });
            });
          }
        }
      })
      .catch(error => {
        console.error('[Service Worker] キャッシュ状態確認中にエラー:', error);
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_STATUS',
            status: 'error',
            error: error.message
          });
        }
      });
  } else if (event.data && event.data.type === 'CHECK_SAMPLE_RESOURCES') {
    // サンプルリソースのキャッシュ状態確認リクエスト
    console.log('[Service Worker] サンプルリソースのキャッシュ状態確認リクエストを受信しました');
    
    const { sampleResources } = event.data;
    
    // サンプルリソースのキャッシュ状態を確認
    checkSampleResourcesStatus(sampleResources)
      .then(allCached => {
        console.log(`[Service Worker] サンプルリソース確認結果: 全てキャッシュ済み=${allCached}`);
        
        if (event.source) {
          event.source.postMessage({
            type: 'SAMPLE_RESOURCES_STATUS',
            allCached
          });
        }
      })
      .catch(error => {
        console.error('[Service Worker] サンプルリソース確認中にエラー:', error);
        if (event.source) {
          event.source.postMessage({
            type: 'SAMPLE_RESOURCES_STATUS',
            allCached: false,
            error: error.message
          });
        }
      });
  }
});

// リソースをキャッシュする関数
async function cacheResources(imageUrls, audioUrls, csvUrls, totalResources = 0, onlyUncached = false) {
  const cache = await caches.open(RESOURCE_CACHE);
  let processedCount = 0;
  const clients = await self.clients.matchAll();
  const client = clients[0]; // 最初のクライアントに進捗を報告
  
  // 進捗状況を報告する関数
  const reportProgress = (type, processed, total) => {
    if (client) {
      client.postMessage({
        type: 'CACHE_PROGRESS',
        processed,
        total: total || totalResources,
        type
      });
    }
  };
  
  // CSVファイルをキャッシュ（最優先）
  if (csvUrls && csvUrls.length) {
    console.log(`[Service Worker] ${csvUrls.length}個のCSVファイルをキャッシュします`);
    
    // 一度に処理するCSVの数を制限（並列処理数を制限）
    const batchSize = 5;
    const batches = Math.ceil(csvUrls.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, csvUrls.length);
      const batch = csvUrls.slice(start, end);
      
      const batchPromises = batch.map(async url => {
        try {
          // キャッシュに既に存在するか確認
          const existingResponse = await cache.match(url);
          if (existingResponse) {
            console.log(`[Service Worker] CSVは既にキャッシュ済み: ${url}`);
            processedCount++;
            reportProgress('CSV', processedCount, totalResources);
            return;
          }
          
          // キャッシュに存在しない場合はフェッチしてキャッシュ
          const response = await fetch(url, { 
            cache: 'no-cache',  // 常に新しいバージョンを取得
            credentials: 'same-origin'
          });
          
          if (response && response.status === 200) {
            await cache.put(url, response.clone());
            console.log(`[Service Worker] CSVをキャッシュしました: ${url}`);
          } else {
            console.warn(`[Service Worker] CSVの取得に失敗: ${url}, ステータス: ${response ? response.status : 'レスポンスなし'}`);
          }
        } catch (error) {
          console.error(`[Service Worker] CSVキャッシュ失敗: ${url}`, error);
        } finally {
          processedCount++;
          reportProgress('CSV', processedCount, totalResources);
        }
      });
      
      await Promise.all(batchPromises);
    }
  }
  
  // 画像をキャッシュ
  if (imageUrls && imageUrls.length) {
    console.log(`[Service Worker] ${imageUrls.length}個の画像をキャッシュします`);
    
    // 一度に処理する画像の数を制限（並列処理数を制限）
    const batchSize = 10;
    const batches = Math.ceil(imageUrls.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, imageUrls.length);
      const batch = imageUrls.slice(start, end);
      
      const batchPromises = batch.map(async url => {
        try {
          // キャッシュに既に存在するか確認
          const existingResponse = await cache.match(url);
          if (existingResponse) {
            console.log(`[Service Worker] 画像は既にキャッシュ済み: ${url}`);
            processedCount++;
            reportProgress('画像', processedCount, totalResources);
            return;
          }
          
          // onlyUncachedがtrueの場合、既にキャッシュされているリソースはスキップ
          if (onlyUncached && existingResponse) {
            processedCount++;
            reportProgress('画像', processedCount, totalResources);
            return;
          }
          
          // キャッシュに存在しない場合はフェッチしてキャッシュ
          const response = await fetch(url, { 
            mode: 'no-cors',
            cache: 'no-cache'  // 常に新しいバージョンを取得
          });
          
          if (response) {
            await cache.put(url, response.clone());
            console.log(`[Service Worker] 画像をキャッシュしました: ${url}`);
          }
        } catch (error) {
          console.error(`[Service Worker] 画像キャッシュ失敗: ${url}`, error);
        } finally {
          processedCount++;
          reportProgress('画像', processedCount, totalResources);
        }
      });
      
      await Promise.all(batchPromises);
    }
  }
  
  // 音声をキャッシュ
  if (audioUrls && audioUrls.length) {
    console.log(`[Service Worker] ${audioUrls.length}個の音声をキャッシュします`);
    
    // 一度に処理する音声の数を制限（並列処理数を制限）
    const batchSize = 5;
    const batches = Math.ceil(audioUrls.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, audioUrls.length);
      const batch = audioUrls.slice(start, end);
      
      const batchPromises = batch.map(async url => {
        try {
          // キャッシュに既に存在するか確認
          const existingResponse = await cache.match(url);
          if (existingResponse) {
            console.log(`[Service Worker] 音声は既にキャッシュ済み: ${url}`);
            processedCount++;
            reportProgress('音声', processedCount, totalResources);
            return;
          }
          
          // onlyUncachedがtrueの場合、既にキャッシュされているリソースはスキップ
          if (onlyUncached && existingResponse) {
            processedCount++;
            reportProgress('音声', processedCount, totalResources);
            return;
          }
          
          // キャッシュに存在しない場合はフェッチしてキャッシュ
          const response = await fetch(url, { 
            mode: 'no-cors',
            cache: 'no-cache'  // 常に新しいバージョンを取得
          });
          
          if (response) {
            await cache.put(url, response.clone());
            console.log(`[Service Worker] 音声をキャッシュしました: ${url}`);
          }
        } catch (error) {
          console.error(`[Service Worker] 音声キャッシュ失敗: ${url}`, error);
        } finally {
          processedCount++;
          reportProgress('音声', processedCount, totalResources);
        }
      });
      
      await Promise.all(batchPromises);
    }
  }
  
  console.log('[Service Worker] すべてのリソースのキャッシュが完了しました');
  return processedCount;
}

// リソースをキャッシュする関数
async function cacheResource(url) {
  try {
    const response = await fetch(url, {
      mode: 'no-cors',
      cache: 'no-cache'
    });
    if (response && response.status === 200) {
      const cache = await caches.open(RESOURCE_CACHE);
      await cache.put(url, response.clone());
    }
  } catch (error) {
    console.error(`[Service Worker] リソースキャッシュ失敗: ${url}`, error);
  }
}

// キャッシュを確認する関数
async function checkCache(url) {
  const cache = await caches.open(RESOURCE_CACHE);
  const cachedResponse = await cache.match(url);
  return cachedResponse !== undefined;
}

// キャッシュ状態を確認する関数
async function checkCacheStatus(imageUrls, audioUrls, csvUrls) {
  const uncachedResources = { imageUrls: [], audioUrls: [], csvUrls: [] };
  let uncachedCount = 0;

  if (imageUrls && imageUrls.length) {
    for (const url of imageUrls) {
      if (!(await checkCache(url))) {
        uncachedResources.imageUrls.push(url);
        uncachedCount++;
      }
    }
  }

  if (audioUrls && audioUrls.length) {
    for (const url of audioUrls) {
      if (!(await checkCache(url))) {
        uncachedResources.audioUrls.push(url);
        uncachedCount++;
      }
    }
  }

  if (csvUrls && csvUrls.length) {
    for (const url of csvUrls) {
      if (!(await checkCache(url))) {
        uncachedResources.csvUrls.push(url);
        uncachedCount++;
      }
    }
  }

  return { uncachedResources, uncachedCount };
}

// サンプルリソースのキャッシュ状態を確認する関数
async function checkSampleResourcesStatus(sampleResources) {
  const { imageUrls, audioUrls, csvUrls } = sampleResources;
  let allCached = true;
  
  // 画像のキャッシュ状態を確認
  if (imageUrls && imageUrls.length) {
    for (const url of imageUrls) {
      if (!(await checkCache(url))) {
        console.log(`[Service Worker] サンプル画像がキャッシュされていません: ${url}`);
        allCached = false;
        break;
      }
    }
  }
  
  // 音声のキャッシュ状態を確認
  if (allCached && audioUrls && audioUrls.length) {
    for (const url of audioUrls) {
      if (!(await checkCache(url))) {
        console.log(`[Service Worker] サンプル音声がキャッシュされていません: ${url}`);
        allCached = false;
        break;
      }
    }
  }
  
  // CSVのキャッシュ状態を確認
  if (allCached && csvUrls && csvUrls.length) {
    for (const url of csvUrls) {
      if (!(await checkCache(url))) {
        console.log(`[Service Worker] サンプルCSVがキャッシュされていません: ${url}`);
        allCached = false;
        break;
      }
    }
  }
  
  return allCached;
}