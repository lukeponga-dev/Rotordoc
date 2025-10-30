// A basic service worker to make the app installable.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting to activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Take control of all open pages.
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For this app, we'll use a network-first strategy.
  // This ensures users always get the latest version of the app.
  event.respondWith(fetch(event.request));
});