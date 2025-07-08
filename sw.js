// sw.js - Service Worker for offline functionality
const CACHE_NAME = 'price-scanner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/share.html',
  // 如果有其他靜態資源，也可以加入這裡
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截 fetch 請求
self.addEventListener('fetch', event => {
  // 只快取 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到，返回快取的版本
        if (response) {
          return response;
        }

        // 否則，進行網路請求
        return fetch(event.request).then(response => {
          // 檢查是否是有效的回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 複製回應以供快取
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // 只快取同源的請求
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(() => {
        // 如果離線且請求失敗，返回離線頁面
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// 清理舊快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 背景同步（可選）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-analysis') {
    event.waitUntil(syncPendingAnalysis());
  }
});

// 同步待分析的圖片（離線時儲存，上線後自動分析）
async function syncPendingAnalysis() {
  // 這裡可以實現離線時儲存圖片，上線後自動分析的功能
  console.log('Syncing pending analysis...');
}
