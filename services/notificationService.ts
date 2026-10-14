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

export const showLocalNotification = (title: string, body: string, icon = '/gozi-mascot.png') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, { body, icon });
};

// Capacitor Local Notifications for Re-engagement
import { LocalNotifications } from '@capacitor/local-notifications';
import { InventoryItem } from '../types';

export const scheduleFridayEveningNudge = async () => {
    try {
        const permissionStatus = await LocalNotifications.checkPermissions();
        if (permissionStatus.display !== 'granted') {
            const requestStatus = await LocalNotifications.requestPermissions();
            if (requestStatus.display !== 'granted') return;
        }

        const pending = await LocalNotifications.getPending();
        if (pending.notifications.some(n => n.id === 101)) {
            return; // Already scheduled
        }

        // Schedule for next Friday at 6:00 PM
        const now = new Date();
        const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
        const nextFriday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 18, 0, 0);

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Ready for the weekend?',
                    body: 'Check in with Gozi to curate some perfect activities for your downtime.',
                    id: 101,
                    schedule: { at: nextFriday, repeats: true, every: 'week' },
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: '',
                    extra: null
                }
            ]
        });
        console.log("Scheduled Friday evening nudge for", nextFriday);
    } catch (error) {
        console.warn("Failed to schedule Friday nudge (might be on web without Capacitor support)", error);
    }
};

export const scheduleDailyInventoryNudges = async (inventory: InventoryItem[]) => {
    if (!inventory || inventory.length === 0) return;

    try {
        const permissionStatus = await LocalNotifications.checkPermissions();
        if (permissionStatus.display !== 'granted') {
            const requestStatus = await LocalNotifications.requestPermissions();
            if (requestStatus.display !== 'granted') return;
        }

        // Cancel previous inventory nudges (IDs 200-206) to refresh them
        const pending = await LocalNotifications.getPending();
        const existingNudges = pending.notifications.filter(n => n.id >= 200 && n.id <= 206);
        if (existingNudges.length > 0) {
            await LocalNotifications.cancel({ notifications: existingNudges });
        }

        const notifications = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i + 1); // Start tomorrow
            date.setHours(17, 0, 0, 0); // 5 PM

            // Cycle through inventory items
            const item = inventory[i % inventory.length];

            notifications.push({
                title: 'Time for yourself 🌟',
                body: `Don't forget to spend some time with your ${item.name.toLowerCase()} today!`,
                id: 200 + i,
                schedule: { at: date },
                sound: undefined,
                attachments: undefined,
                actionTypeId: '',
                extra: null
            });
        }

        await LocalNotifications.schedule({ notifications });
        console.log("Scheduled daily inventory nudges for the next 7 days.");
    } catch (error) {
        console.warn("Failed to schedule inventory nudges (might be on web)", error);
    }
};
