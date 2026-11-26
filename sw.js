// Offline-Cache für den Lern-Hub.
// Jede Seite wird unter IHRER EIGENEN Adresse zwischengespeichert (kein Umleiten aller Seiten auf index.html),
// damit sich die einzelnen Lern-Apps nicht gegenseitig überschreiben.
// Strategie: erst Netz (aktuelle Version), bei fehlendem Netz der gespeicherte Stand.
const CACHE = 'lernhub-v20';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icon-180.png', './icon-192.png', './icon-512.png', './shared/profil.js', './eltern.html',
  './chemie-ka1/', './chemie-ka1/index.html', './bio-immun-evo/', './bio-immun-evo/index.html', './geo-plattentektonik/', './geo-plattentektonik/index.html', './nwt-waermelehre/', './nwt-waermelehre/index.html'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const cached = await cache.match(req, { ignoreSearch: true });
      return cached || new Response('Offline – bitte einmal mit Internet öffnen.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
