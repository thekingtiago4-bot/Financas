/* Finanças. · service worker: rede primeiro (sempre a versão nova), cópia guardada quando estiver sem internet.
   Troque o nome do cache a cada versão publicada. */
const CACHE = 'fin-app-v001';
const ARQUIVOS = ['./', 'index.html', 'tema.js', 'app.css', 'fontes.css', 'nucleo.js', 'janelas.js', 'graficos.js', 'app.js', 'manifest.webmanifest',
  'icons/icone.svg', 'icons/marca.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'fonts/Barlow-400.woff2', 'fonts/Barlow-500.woff2', 'fonts/Barlow-600.woff2', 'fonts/BarlowSemiCondensed-600.woff2', 'fonts/BarlowSemiCondensed-700.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || u.pathname.endsWith('version.json')) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
