import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { notificationsAPI } from "@/services/api";
import { colors } from "@/theme";
import ScreenHeader from "@/components/ScreenHeader";

const TYPE_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  promotion:    { name: "pricetag",        color: "#F97316", bg: "#FFF7ED" },
  product:      { name: "cube",            color: "#3B82F6", bg: "#EFF6FF" },
  order_update: { name: "checkmark-circle",color: "#22C55E", bg: "#F0FDF4" },
  announcement: { name: "megaphone",       color: "#A855F7", bg: "#FAF5FF" },
  coupon:       { name: "ticket",          color: "#EC4899", bg: "#FDF2F8" },
  reminder:     { name: "time",            color: "#EAB308", bg: "#FEFCE8" },
  custom:       { name: "notifications",   color: "#6B7280", bg: "#F9FAFB" },
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationsAPI.getMy({ limit: 100 });
        const items: any[] = res.data?.data?.notifications || [];
        const found = items.find((n: any) => n._id === id);
        setNotif(found || null);
        if (found && !found.read) {
          notificationsAPI.markAsRead(found._id).catch(() => {});
        }
      } catch {}
      finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const handleAction = () => {
    if (!notif?.notification?.actionUrl) return;
    const url = notif.notification.actionUrl;
    if (url.startsWith("/product/")) router.push(`/product/${url.replace("/product/", "")}` as any);
    else if (url.startsWith("/category/")) router.push(`/category/${url.replace("/category/", "")}` as any);
    else if (url.startsWith("/order/")) router.push(`/order/${url.replace("/order/", "")}` as any);
    else if (url === "/shop" || url.startsWith("/shop")) router.push("/(tabs)/shop" as any);
    else router.push("/(tabs)" as any);
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Notification" showBack />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (!notif) {
    return (
      <View style={s.screen}>
        <ScreenHeader title="Notification" showBack />
        <View style={s.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.gray300} />
          <Text style={s.emptyTitle}>Notification not found</Text>
        </View>
      </View>
    );
  }

  const n = notif.notification;
  const typeInfo = TYPE_ICONS[n?.type] || TYPE_ICONS.custom;

  return (
    <View style={s.screen}>
      <ScreenHeader title="Notification" showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Icon or image */}
        <View style={s.iconRow}>
          {n?.image ? (
            <Image source={{ uri: n.image }} style={s.bannerImage} contentFit="cover" />
          ) : (
            <View style={[s.iconCircle, { backgroundColor: typeInfo.bg }]}>
              <Ionicons name={typeInfo.name as any} size={36} color={typeInfo.color} />
            </View>
          )}
        </View>

        {/* Type badge */}
        <View style={[s.typeBadge, { backgroundColor: typeInfo.bg }]}>
          <Text style={[s.typeText, { color: typeInfo.color }]}>
            {(n?.type || "notification").replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Title */}
        <Text style={s.title}>{n?.title || "Notification"}</Text>

        {/* Time */}
        <Text style={s.time}>{n?.createdAt ? timeAgo(n.createdAt) : ""}</Text>

        {/* Body */}
        <View style={s.bodyCard}>
          <Text style={s.body}>{n?.body || ""}</Text>
        </View>

        {/* Action button */}
        {n?.actionUrl && (
          <Pressable onPress={handleAction} style={s.actionBtn}>
            <Text style={s.actionBtnText}>{n.actionLabel || "View"}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },
  iconRow: { alignItems: "center", marginBottom: 16 },
  bannerImage: { width: "100%", height: 200, borderRadius: 8 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  typeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900, marginBottom: 6, lineHeight: 28 },
  time: { fontSize: 12, color: colors.gray400, marginBottom: 16 },
  bodyCard: { backgroundColor: colors.white, padding: 16, marginBottom: 20 },
  body: { fontSize: 15, color: colors.gray700, lineHeight: 24 },
  actionBtn: { backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
