import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '@/services/api';
import { useAuthStore } from '@/store';
import ScreenHeader from '@/components/ScreenHeader';

const TYPE_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  promotion: { name: 'pricetag', color: '#F97316', bg: '#FFF7ED' },
  product: { name: 'cube', color: '#3B82F6', bg: '#EFF6FF' },
  order_update: { name: 'checkmark-circle', color: '#22C55E', bg: '#F0FDF4' },
  announcement: { name: 'megaphone', color: '#A855F7', bg: '#FAF5FF' },
  coupon: { name: 'ticket', color: '#EC4899', bg: '#FDF2F8' },
  reminder: { name: 'time', color: '#EAB308', bg: '#FEFCE8' },
  custom: { name: 'notifications', color: '#6B7280', bg: '#F9FAFB' },
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!token) return;
    try {
      const res = await notificationsAPI.getMy({ page: pageNum, limit: 20 });
      const data = res.data?.data;
      const items = data?.notifications || [];
      setUnreadCount(data?.unreadCount || 0);
      if (append) {
        setNotifications(prev => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setHasMore(pageNum < (data?.pages || 1));
      setPage(pageNum);
    } catch {
      // silently fail
    }
    setLoading(false);
    setRefreshing(false);
  }, [token]);

  React.useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  };

  const handlePress = async (notif: any) => {
    const n = notif.notification;
    if (!n) return;

    try {
      await notificationsAPI.recordClick(notif._id);
      setNotifications(prev =>
        prev.map(item => item._id === notif._id ? { ...item, read: true, clicked: true } : item)
      );
      setUnreadCount(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
    } catch {}

    if (n.actionUrl) {
      if (n.actionUrl.startsWith('/product/')) {
        const slug = n.actionUrl.replace('/product/', '');
        router.push(`/product/${slug}`);
      } else if (n.actionUrl.startsWith('/category/')) {
        const slug = n.actionUrl.replace('/category/', '');
        router.push(`/category/${slug}`);
      } else if (n.actionUrl.startsWith('/order/')) {
        const id = n.actionUrl.replace('/order/', '');
        router.push(`/order/${id}`);
      } else if (n.actionUrl === '/shop' || n.actionUrl.startsWith('/shop')) {
        router.push('/(tabs)/shop');
      } else {
        // Fallback: just go home
        router.push('/(tabs)/');
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDismiss = async (notifId: string) => {
    try {
      await notificationsAPI.dismiss(notifId);
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch {}
  };

  const renderItem = ({ item }: { item: any }) => {
    const n = item.notification;
    if (!n) return null;
    const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.custom;

    return (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
        style={[styles.notifItem, !item.read && styles.unreadBg]}
      >
        {n.image ? (
          <Image source={{ uri: n.image }} style={styles.notifImage} />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: typeInfo.bg }]}>
            <Ionicons name={typeInfo.name as any} size={20} color={typeInfo.color} />
          </View>
        )}

        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]} numberOfLines={1}>
            {n.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
          <View style={styles.notifMeta}>
            <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
            {n.actionLabel && (
              <View style={styles.actionChip}>
                <Text style={styles.actionText}>{n.actionLabel}</Text>
                <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightCol}>
          {!item.read && <View style={styles.unreadDot} />}
          <TouchableOpacity onPress={() => handleDismiss(item._id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Notifications" showBack />

      <View style={styles.container}>
        {/* Header Actions */}
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllRow}>
            <Ionicons name="checkmark-done" size={16} color="#3B82F6" />
            <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
          </TouchableOpacity>
        )}

        {loading && notifications.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0F604B" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>We'll notify you about orders, deals & more</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0F604B" />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  markAllRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  markAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  unreadBg: { backgroundColor: '#EFF6FF20' },
  notifImage: { width: 48, height: 48, borderRadius: 10 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 2 },
  unreadTitle: { fontWeight: '700', color: '#111827' },
  notifBody: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  notifTime: { fontSize: 11, color: '#9CA3AF' },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontSize: 11, color: '#3B82F6', fontWeight: '500' },
  rightCol: { alignItems: 'center', gap: 6, paddingTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
  separator: { height: 1, backgroundColor: '#F9FAFB', marginLeft: 68 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
});
