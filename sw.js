/* 재잘일기 — 오프라인 저장(일반판 웹앱). build.py --edition generic 이 만든다: 직접 고치지 말 것 */
const VERSION = 'c4a5a0a15a';
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
  if (req.mode === 'navigate') {            // 인터넷이 되면 새 앱을 먼저(3초 안에), 안 되면 저장된 앱 — 어떤 주소로 열어도
    // 11-22 실측: 저장된 앱을 먼저 주던 때, 옛 버전이 저장된 기기가 새 형식 링크(#get/<id>)를 못 알아보고 이름 화면으로 갔다
    const saved = () => caches.open(CACHE).then(c => c.match('./index.html'));
    const fresh = fetch('./index.html', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('http'); return r; });
    const late = new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3000));
    e.respondWith(Promise.race([fresh, late]).catch(() => saved().then(r => r || fresh)).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.pathname.indexOf('/audio/') >= 0) { // 녹음 슬롯 — 없으면 바로 404(인터넷을 기다리지 않는다)
    e.respondWith(caches.match(req).then(r => r || new Response('', { status: 404 })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
