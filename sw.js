/* 养鹅怡情 · 持仓管理 PWA Service Worker
   策略：network-first（在线永远走网络，绝不回退旧缓存 → 不干扰版本号识别）
        离线时回退到最近一次成功加载的首页/资源。
   仅缓存同源 GET；行情(qt.gtimg.cn 等)与云同步(Supabase)均跨域，一律直连不缓存。
*/
const CACHE = 'yange-shell-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./'])).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   /* 跨域请求直连，不拦截 */
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(m => m || caches.match('./'))
      )
  );
});
