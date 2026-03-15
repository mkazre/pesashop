import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store';

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

export function useExpoPush() {
  const router = useRouter();
  const { token } = useAuthStore();
  const registered = useRef(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (!token || registered.current || !Notifications || Platform.OS === 'web') return;

    const registerForPush = async () => {
      try {
        // Check if running on a physical device
        if (Device && !Device.isDevice) {
          console.debug('Push notifications require a physical device');
          return;
        }

        // Check/request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        // Get Expo push token
        const projectId = Constants?.expiConfig?.extra?.eas?.projectId
          || Constants?.default?.expoConfig?.extra?.eas?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        const expoPushToken = tokenData.data;

        if (!expoPushToken) return;

        // Register with backend
        await notificationsAPI.subscribe({
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          expoPushToken,
          deviceId: `${Platform.OS}-${expoPushToken.slice(-16)}`,
          deviceName: Device?.modelName || Platform.OS,
        });

        registered.current = true;

        // Configure Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance?.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0F604B',
          });
        }
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
        // Notification received while app is in foreground
        // The bell component will pick up the new count via polling
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
