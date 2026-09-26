const CACHE_NAME = 'qlpn-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './template.docx',
  'https://cdn.jsdelivr.net/npm/pizzip@3.1.6/dist/pizzip.min.js',
  'https://cdn.jsdelivr.net/npm/docxtemplater@3.42.0/build/docxtemplater.js',
  'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Xóa sạch bộ nhớ đệm cũ
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
