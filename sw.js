/* 인생수업 키즈 사운드북 — 오프라인 저장(일반판 웹앱). build.py --edition generic 이 만든다: 직접 고치지 말 것 */
const VERSION = '3342f99856';
const CACHE = 'soundbook-' + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512-maskable.png", "./icon-512.png"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('soundbook-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {            // 어떤 주소로 열어도 저장된 앱(인터넷 없어도)
    e.respondWith(caches.open(CACHE).then(c => c.match('./index.html')).then(r => r || fetch(req))
      .catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.indexOf('/audio/') >= 0) { // 녹음 슬롯 — 없으면 바로 404(인터넷을 기다리지 않는다)
    e.respondWith(caches.match(req).then(r => r || new Response('', { status: 404 })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
