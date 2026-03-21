const CACHE_NAME = 'rawan-diet-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/variables.css',
  './css/themes.css',
  './css/main.css',
  './css/responsive.css',
  './css/profile.css',
  './js/app.js',
  './js/views.js',
  './js/dataManager.js',
  './js/firebaseConfig.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
