/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications when the app is not in focus.

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// These are public config values — safe to include in client-side code.
firebase.initializeApp({
  apiKey: 'AIzaSyC0SQIPODjsxlfHn8u6b2pqYsLGmg415D4',
  authDomain: 'movilnova.es',
  projectId: 'galaxia-phone',
  storageBucket: 'galaxia-phone.firebasestorage.app',
  messagingSenderId: '273278511592',
  appId: '1:273278511592:web:e1eace70871f6f90e71c5d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'MovilNova';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  };
  self.registration.showNotification(title, options);
});
