import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isFirebaseConfigured = () =>
    !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

const getFirebaseMessaging = async () => {
    if (!isFirebaseConfigured()) return null;
    if (!(await isSupported())) return null;
    if (!messagingInstance) {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        messagingInstance = getMessaging(app);
    }
    return messagingInstance;
};

export const requestNotificationPermission = async (): Promise<string | null> => {
    if (!isFirebaseConfigured()) {
        console.warn('[Notifications] Firebase not configured — set VITE_FIREBASE_* env vars.');
        return null;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[Notifications] Permission denied.');
            return null;
        }
        const messaging = await getFirebaseMessaging();
        if (!messaging) return null;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log('[Notifications] FCM token:', token);
        return token;
    } catch (err) {
        console.error('[Notifications] Error requesting permission:', err);
        return null;
    }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;
    onMessage(messaging, callback);
};

export const showLocalNotification = (title: string, body: string, icon = '/logo.svg') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, { body, icon });
};
