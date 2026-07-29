// Service Worker بسيط لصفحة فعاليات الطلبة — الحد الأدنى المطلوب من Chrome لتفعيل خاصية "تثبيت التطبيق"
const CACHE_NAME = 'events-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// شبكة أولاً، مع رجوع للنسخة المخزَّنة محلياً إن تعذّر الاتصال بالإنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
