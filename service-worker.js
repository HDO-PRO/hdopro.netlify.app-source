const CACHE_NAME = 'hdo-pro-cache-v6';
const PRECACHE = [
  '/',
  '/index.html',
  '/h0m3',
  '/about',
  '/invite',
  '/sign-in',
  '/downloads',
  '/releases',
  '/faq',
  '/status',
  '/sitemap',
  '/guide',
  '/tutorial',
  '/dmca',
  '/privacy',
  '/rules',
  '/support',
  '/contact',
  '/discord',
  '/telegram',
  '/terminal',
  '/dev',
  '/game',
  '/donate',
  '/404.html',
  '/style.css',
  '/script.js',
  '/pixels.js',
  '/game.js',
  '/manifest.json',
  '/Images/logo.png',
  '/Images/discord.png',
  '/Images/telegram.png',
  '/Images/7257807.png',
  '/Images/150f78d18fd597611f77b4ae7d2f1f58.gif',
  '/Images/8e752cf446947d3d01c0eaaf9e1504e2.gif'
];

const CDN_HOSTS = ['cdnjs.cloudflare.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCDN = CDN_HOSTS.includes(url.hostname);

  if (!sameOrigin && !isCDN) return;

  // Page navigations: network-first so content stays fresh, cache as offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static assets + CDN: cache-first, populate cache on miss
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
