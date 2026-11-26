/* Service worker: lets Math Board open fast and work offline (without sync). */
var CACHE = 'math-board-v10';
var FILES = ['/', '/index.html', '/css/style.css', '/js/app.js', '/js/sync.js', '/js/mathexpr.js', '/vendor/mqtt.min.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png', '/icons/dev-logo.svg', '/favicon.svg', '/favicon.ico', '/lessons.html', '/css/lessons.css', '/js/lessons.js', '/js/gen.js', '/data/dsl.js', '/data/catalog.js', '/data/content-g9b.js', '/data/content-g9.js', '/data/content-g10.js', '/data/content-g11.js', '/data/content-g12.js', '/icons/logo.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); return res; })
    .catch(function () { return caches.match(r).then(function (m) { return m || caches.match('/index.html'); }); }));
});
