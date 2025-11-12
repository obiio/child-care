// Minimal service worker for FCM (placeholder)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  clients.claim();
});

// When using FCM, importScripts for Firebase and initialize here.
// importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');
// firebase.initializeApp({ ...config });
// const messaging = firebase.messaging();
