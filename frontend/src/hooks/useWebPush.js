import { useEffect, useRef } from 'react';
import { notificationsAPI } from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const register = async () => {
      try {
        // Get VAPID public key
        const keyRes = await notificationsAPI.getVapidPublicKey();
        const vapidKey = keyRes.data?.data?.publicKey;
        if (!vapidKey) return;

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;

        // Check existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          // Subscribe
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }

        // Send subscription to backend
        const subJson = subscription.toJSON();
        await notificationsAPI.subscribe({
          platform: 'web',
          webPush: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
          deviceId: `web-${subJson.endpoint.slice(-32)}`,
          userAgent: navigator.userAgent,
        });

        registered.current = true;
      } catch (err) {
        // Silently fail - web push is optional
        if (err.name !== 'AbortError') {
          console.debug('Web push registration skipped:', err.message);
        }
      }
    };

    // Delay registration to avoid blocking initial page load
    const timeout = setTimeout(register, 5000);
    return () => clearTimeout(timeout);
  }, []);
}
