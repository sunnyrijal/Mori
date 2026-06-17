importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        const config = event.data.config;
        if (!config || !config.apiKey) return;
        firebase.initializeApp(config);
        const messaging = firebase.messaging();
        messaging.onBackgroundMessage(payload => {
            const { title, body, icon } = payload.notification || {};
            self.registration.showNotification(title || 'Gozi', {
                body: body || 'You have a new activity suggestion waiting.',
                icon: icon || '/logo.svg',
                badge: '/logo.svg',
            });
        });
    }
});
