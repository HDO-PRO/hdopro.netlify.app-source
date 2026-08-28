const CACHE_NAME = 'my-pwa-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/H0M3',
  '/dev.html',
  '/downloads.html',
  '/about.html',
  '/dmca.html',
  '/guide.html',
  '/privacy.html',
  '/script.js',
  '/Images/logo.png',
  '/Images/android1-upscale.png',
  '/style.css',
  '/releases.html',
  '/faq.html',
  '/status.html',
  '/sitemap.html',
  '/pixels.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

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
