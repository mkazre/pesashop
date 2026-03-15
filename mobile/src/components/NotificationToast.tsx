import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, Animated,
  StyleSheet, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_DURATION = 6000;

const TYPE_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  promotion: { name: 'pricetag', color: '#F97316', bg: '#FFF7ED' },
  product: { name: 'cube', color: '#3B82F6', bg: '#EFF6FF' },
  order_update: { name: 'checkmark-circle', color: '#22C55E', bg: '#F0FDF4' },
  announcement: { name: 'megaphone', color: '#A855F7', bg: '#FAF5FF' },
  coupon: { name: 'ticket', color: '#EC4899', bg: '#FDF2F8' },
  reminder: { name: 'time', color: '#EAB308', bg: '#FEFCE8' },
  custom: { name: 'notifications', color: '#6B7280', bg: '#F9FAFB' },
};

interface ToastData {
  id: string;
  title: string;
  body: string;
  image?: string;
  icon?: string;
  type: string;
  actionUrl?: string;
  actionLabel?: string;
  slideAnim: Animated.Value;
  opacityAnim: Animated.Value;
}

export default function NotificationToast() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const seenIdsRef = useRef(new Set<string>());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForNew = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsAPI.getMy({ limit: 5 });
      const items = res.data?.data?.notifications || [];

      items.forEach((item: any) => {
        const n = item.notification;
        if (!n) return;
        if (!item.read && !seenIdsRef.current.has(item._id)) {
          seenIdsRef.current.add(item._id);
          const createdAt = new Date(n.createdAt).getTime();
          const twoMinsAgo = Date.now() - 120000;
          if (createdAt > twoMinsAgo) {
            addToast({
              id: item._id,
              title: n.title,
              body: n.body,
              image: n.image,
              icon: n.icon,
              type: n.type,
              actionUrl: n.actionUrl,
              actionLabel: n.actionLabel,
            });
          }
        }
      });
    } catch {}
  }, [isAuthenticated]);

  const addToast = (data: Omit<ToastData, 'slideAnim' | 'opacityAnim'>) => {
    const slideAnim = new Animated.Value(-120);
    const opacityAnim = new Animated.Value(0);

    const toast: ToastData = { ...data, slideAnim, opacityAnim };

    setToasts((prev) => [toast, ...prev].slice(0, 3));

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    setTimeout(() => removeToast(data.id), TOAST_DURATION);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        Animated.parallel([
          Animated.timing(toast.slideAnim, { toValue: -120, duration: 200, useNativeDriver: true }),
          Animated.timing(toast.opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
      // Remove after animation
      setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
      }, 220);
      return prev;
    });
  };

  const handlePress = async (toast: ToastData) => {
    removeToast(toast.id);
    try {
      await notificationsAPI.recordClick(toast.id);
    } catch {}

    if (toast.actionUrl) {
      const url = toast.actionUrl;
      if (url.startsWith('/product/')) {
        router.push(`/product/${url.replace('/product/', '')}` as any);
      } else if (url.startsWith('/category/')) {
        router.push(`/category/${url.replace('/category/', '')}` as any);
      } else if (url.startsWith('/order/')) {
        router.push(`/order/${url.replace('/order/', '')}` as any);
      } else if (url === '/shop' || url.startsWith('/shop')) {
        router.push('/(tabs)/shop' as any);
      } else {
        router.push('/notifications' as any);
      }
    }
  };

  useEffect(() => {
    const initialTimeout = setTimeout(checkForNew, 3000);
    pollRef.current = setInterval(checkForNew, 15000);
    return () => {
      clearTimeout(initialTimeout);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkForNew]);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        const typeInfo = TYPE_ICONS[toast.type] || TYPE_ICONS.custom;
        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toast,
              {
                transform: [{ translateY: toast.slideAnim }],
                opacity: toast.opacityAnim,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handlePress(toast)}
              style={styles.toastInner}
            >
              {/* Icon / Image */}
              {toast.image ? (
                <Image source={{ uri: toast.image }} style={styles.toastImage} />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: typeInfo.bg }]}>
                  <Ionicons name={typeInfo.name as any} size={20} color={typeInfo.color} />
                </View>
              )}

              {/* Content */}
              <View style={styles.toastContent}>
                <Text style={styles.appName}>PesaShop</Text>
                <Text style={styles.toastTitle} numberOfLines={1}>{toast.title}</Text>
                <Text style={styles.toastBody} numberOfLines={2}>{toast.body}</Text>
                {toast.actionLabel && (
                  <View style={styles.actionRow}>
                    <Text style={styles.actionText}>{toast.actionLabel}</Text>
                    <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
                  </View>
                )}
              </View>

              {/* Close */}
              <TouchableOpacity
                onPress={() => removeToast(toast.id)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 12,
    right: 12,
    zIndex: 99999,
    gap: 8,
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  toastImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContent: {
    flex: 1,
  },
  appName: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  toastBody: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
});
