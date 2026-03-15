import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store';

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export default function NotificationBell({ color = '#374151', size = 24 }: NotificationBellProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsAPI.getUnreadCount();
      const count = res.data?.data?.count ?? res.data?.count ?? 0;
      setUnreadCount(count);
    } catch (err: any) {
      console.debug('NotificationBell fetch error:', err?.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (!isAuthenticated) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
