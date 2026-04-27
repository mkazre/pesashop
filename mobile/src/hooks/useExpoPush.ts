import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import { notificationBus } from '@/lib/notificationBus';

let Notifications: any = null;
let Device: any = null;
let Constants: any = null;

// Dynamically import expo-notifications (only available on native)
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');
} catch {
  // expo-notifications not installed yet or running on web
}

// ─── IMPORTANT: Set notification handler at module level (outside component) ───
// This tells the OS to show push notifications even when the app is in the foreground
// with sound, alert popup, and badge update — like WhatsApp does.
if (Notifications && Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowAlert: true,
    }),
  });
}

export function useExpoPush() {
  const router = useRouter();
  const { token } = useAuthStore();
  const registered = useRef(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (!Notifications || Platform.OS === 'web') return;

    // Request permissions immediately on app launch (mandatory)
    const requestPermissionsEarly = async () => {
      try {
        if (Device && !Device.isDevice) return;
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'PESA Shop',
            description: 'Order updates, promotions and important alerts',
            importance: Notifications.AndroidImportance?.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0F604B',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
          });
        }
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
              provideAppNotificationSettings: true,
            },
          });
        }
      } catch {}
    };

    requestPermissionsEarly();
  }, []);

  useEffect(() => {
    if (registered.current || !Notifications || Platform.OS === 'web') return;

    const isLoggedIn = !!token;

    const registerForPush = async () => {
      try {
        // Check if running on a physical device
        if (Device && !Device.isDevice) {
          console.debug('Push notifications require a physical device');
          return;
        }

        // Configure Android notification channel FIRST (before requesting token)
        // This ensures the channel exists so push notifications play sound & vibrate
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'PESA Shop',
            description: 'Order updates, promotions and important alerts',
            importance: Notifications.AndroidImportance?.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0F604B',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
          });
        }

        // Check/request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
              provideAppNotificationSettings: true,
            },
          });
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        // Get Expo push token
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId
          || Constants?.default?.expoConfig?.extra?.eas?.projectId
          || 'a547ffd4-858c-45bb-b527-495e2264a8da';

        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        const expoPushToken = tokenData.data;

        if (!expoPushToken) return;

        // Register with backend (authenticated or anonymous)
        const payload = {
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          expoPushToken,
          deviceId: `${Platform.OS}-${expoPushToken.slice(-16)}`,
          deviceName: Device?.modelName || Platform.OS,
        };

        if (isLoggedIn) {
          await notificationsAPI.subscribe(payload);
        } else {
          await notificationsAPI.subscribeAnonymous(payload);
        }

        registered.current = true;
        console.log('Push notifications registered:', expoPushToken.slice(0, 20) + '...');
      } catch (err: any) {
        console.debug('Push registration skipped:', err.message);
      }
    };

    registerForPush();
  }, [token]);

  // Handle incoming notifications (foreground)
  useEffect(() => {
    if (!Notifications) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        const req = notification?.request;
        if (!req) return;
        const content = req.content || {};
        const data = content.data || {};
        notificationBus.emit({
          id: data.notificationId || req.identifier || `${Date.now()}`,
          title: content.title || 'PesaShop',
          body: content.body || '',
          image: data.image,
          icon: data.icon,
          type: data.type || 'custom',
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
        });
      }
    );

    // Handle notification taps (deep linking)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification?.request?.content?.data;
        if (!data?.actionUrl) return;

        const url = data.actionUrl;
        if (url.startsWith('/product/')) {
          router.push(`/product/${url.replace('/product/', '')}` as any);
        } else if (url.startsWith('/category/')) {
          router.push(`/category/${url.replace('/category/', '')}` as any);
        } else if (url.startsWith('/order/')) {
          router.push(`/order/${url.replace('/order/', '')}` as any);
        } else if (url === '/shop' || url.startsWith('/shop')) {
          router.push('/(tabs)/shop' as any);
        } else if (url === '/notifications') {
          router.push('/notifications' as any);
        } else {
          router.push('/(tabs)/' as any);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
