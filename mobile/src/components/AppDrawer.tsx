import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store";
import { menusAPI } from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";
import { onContentRefresh } from "@/utils/contentVersion";
import IconValue from "@/components/apppageblocks/IconValue";

const LOGO = require("@/../assets/pesashop-logo.png");

// Module-level cache: the drawer menu rarely changes between app opens, so
// once fetched it's kept in memory for the life of the app. This lets any
// AppDrawer instance (even a fresh mount, e.g. after a hot reload) paint
// the admin-configured items instantly instead of showing them a beat
// after the hardcoded ones while a fresh request is in flight.
let cachedMenuItems: any[] | null = null;

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppDrawer({ visible, onClose }: AppDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(screenWidth * 0.82, 340);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [menuItems, setMenuItems] = useState<any[]>(cachedMenuItems || []);
  const [slideAnim] = useState(new Animated.Value(-drawerWidth));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-drawerWidth);
    }
  }, [visible]);

  useEffect(() => {
    // Fetch on mount rather than gating on `visible`: the drawer is mounted
    // once (see app/(tabs)/index.tsx) well before the user ever taps the
    // hamburger icon, so kicking the request off immediately — instead of
    // at the moment the drawer opens — means the admin-configured items are
    // already in state by the time the drawer actually appears, matching
    // the hardcoded items' instant render instead of trailing them.
    //
    // Prefer the dedicated Mobile App > Drawer Menu location (Admin →
    // Mobile App → Drawer Menu) — that's what the new mobile-only Menu
    // Builder writes to. Fall back to the website's 'header' menu, then the
    // legacy 'mobile' location, only for stores that haven't configured a
    // mobile-specific menu yet.
    const fetchMenu = () => {
      Promise.all([
        menusAPI.getByLocation("mobile-menu").catch(() => null),
        menusAPI.getByLocation("header").catch(() => null),
        menusAPI.getByLocation("mobile").catch(() => null),
      ]).then(([mobileMenuRes, headerRes, mobileRes]) => {
        const menu = mobileMenuRes?.data?.data || headerRes?.data?.data || mobileRes?.data?.data;
        if (menu?.items?.length) {
          cachedMenuItems = menu.items;
          setMenuItems(menu.items);
        }
      }).catch(() => {});
    };

    fetchMenu();
    // If the admin bumps mobileContentVersion (Settings → Refresh Mobile App
    // Content) while this drawer is still mounted from an earlier session,
    // drop the cache and refetch so a resumed-not-relaunched app also picks
    // up the change.
    return onContentRefresh(() => {
      cachedMenuItems = null;
      fetchMenu();
    });
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -drawerWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const navigate = (path: string) => {
    handleClose();
    setTimeout(() => {
      router.push(path as any);
    }, 250);
  };

  // Downloadable-file links open externally rather than navigating to a
  // route — handled separately from resolveMenuLink's route-string contract.
  const openMenuEntry = (entry: any) => {
    if (entry.linkType === "file" && entry.fileUrl) {
      Linking.openURL(resolveImageUrl(entry.fileUrl) || entry.fileUrl);
      return;
    }
    const dest = resolveMenuLink(entry);
    if (dest) navigate(dest);
  };

  const staticLinks: { icon: keyof typeof Ionicons.glyphMap; label: string; path: string }[] = [
    { icon: "home-outline",         label: "Home",        path: "/(tabs)" },
    { icon: "grid-outline",         label: "Shop",        path: "/(tabs)/shop" },
    { icon: "apps-outline",         label: "Categories",  path: "/categories" },
    { icon: "navigate-outline",     label: "Track Order", path: "/account/track-order" },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={handleClose} />
        <Animated.View
          style={[
            s.drawer,
            { width: drawerWidth, paddingTop: insets.top, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={s.drawerHeader}>
            <Image source={LOGO} style={s.logo} contentFit="contain" />
            <Pressable onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>

          {/* User greeting */}
          {isAuthenticated && user && (
            <View style={s.userRow}>
              <View style={s.userAvatar}>
                <Text style={s.userAvatarText}>
                  {(user.firstName || user.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userNameText}>
                  {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name || "User"}
                </Text>
                <Text style={s.userEmailText}>{user.email}</Text>
              </View>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Static navigation */}
            <View style={s.section}>
              {staticLinks.map((link) => (
                <Pressable key={link.path} onPress={() => navigate(link.path)} style={s.menuItem}>
                  <Ionicons name={link.icon} size={18} color={colors.gray700} />
                  <Text style={s.menuLabel}>{link.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Admin menu items (from menu module) */}
            {menuItems.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Menu</Text>
                {menuItems.map((item: any, i: number) => {
                  const hasChildren = item.children?.length > 0;
                  return (
                    <View key={item._id || i}>
                      <Pressable
                        onPress={() => openMenuEntry(item)}
                        style={s.menuItem}
                      >
                        <IconValue icon={item.icon} fallback={hasChildren ? "chevron-down-outline" : "link-outline"} color={colors.gray700} size={18} />
                        <Text style={s.menuLabel}>{item.label || item.title}</Text>
                      </Pressable>
                      {hasChildren && item.children.map((child: any, j: number) => (
                        <Pressable
                          key={child._id || j}
                          onPress={() => openMenuEntry(child)}
                          style={[s.menuItem, { paddingLeft: 44 }]}
                        >
                          <IconValue icon={child.icon} fallback="chevron-forward-outline" color={colors.gray500} size={14} />
                          <Text style={[s.menuLabel, { fontSize: 13, color: colors.gray600 }]}>{child.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Pages are surfaced only via admin Menu Builder — no separate section */}

            {/* Auth links */}
            <View style={s.section}>
              {isAuthenticated ? (
                <Pressable onPress={() => navigate("/(tabs)/account")} style={s.menuItem}>
                  <Ionicons name="person-outline" size={18} color={colors.gray700} />
                  <Text style={s.menuLabel}>My Account</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable onPress={() => navigate("/auth/login")} style={s.menuItem}>
                    <Ionicons name="log-in-outline" size={18} color={colors.gray700} />
                    <Text style={s.menuLabel}>Sign In</Text>
                  </Pressable>
                  <Pressable onPress={() => navigate("/auth/register")} style={s.menuItem}>
                    <Ionicons name="person-add-outline" size={18} color={colors.gray700} />
                    <Text style={s.menuLabel}>Create Account</Text>
                  </Pressable>
                </>
              )}
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  drawer: { position: "absolute", top: 0, left: 0, bottom: 0, backgroundColor: colors.white, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 4, height: 0 }, elevation: 20 },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  logo: { width: 120, height: 32 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  userRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100, gap: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  userAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  userNameText: { fontSize: 14, fontWeight: "600", color: colors.gray900 },
  userEmailText: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  section: { borderBottomWidth: 1, borderBottomColor: colors.gray100, paddingVertical: 8 },
  sectionTitle: { fontSize: 10, fontWeight: "700", color: colors.gray400, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuLabel: { fontSize: 14, fontWeight: "500", color: colors.gray800 },
});
