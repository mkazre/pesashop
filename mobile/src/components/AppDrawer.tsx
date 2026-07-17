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
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store";
import { menusAPI } from "@/services/api";
import { colors } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");

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

  const [menuItems, setMenuItems] = useState<any[]>([]);
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
    if (!visible) return;
    // Mirror the website's Header.jsx exactly — it reads the 'header' location
    // (Admin → Menu Builder). Fall back to a mobile-specific menu only if the
    // site has never configured a header menu at all.
    Promise.all([
      menusAPI.getByLocation("header").catch(() => null),
      menusAPI.getByLocation("mobile-menu").catch(() => null),
      menusAPI.getByLocation("mobile").catch(() => null),
    ]).then(([headerRes, mobileMenuRes, mobileRes]) => {
      const menu = headerRes?.data?.data || mobileMenuRes?.data?.data || mobileRes?.data?.data;
      if (menu?.items?.length) {
        setMenuItems(menu.items);
      }
    }).catch(() => {});
  }, [visible]);

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

  // Resolve a menu item's link into a route this app actually has. The
  // website's own menu items use its URL scheme (e.g. /shop/:slug for
  // categories), which doesn't match any mobile route directly — map the
  // known web patterns onto their mobile equivalents instead of navigating
  // to the raw path verbatim (which previously produced "Unmatched Route").
  const resolveMenuLink = (entry: any): string | null => {
    const link = entry.link || entry.url || '#';
    if (entry.linkType === 'page') {
      const slug = link.replace(/^\//, '') || entry.linkId;
      return `/page/${slug}`;
    }
    if (entry.linkType === 'category' && entry.linkId) {
      return `/(tabs)/shop?category=${entry.linkId}`;
    }
    if (!link || link === '#' || link === 'none') return null;
    if (link.startsWith('/category/')) {
      return `/(tabs)/shop?category=${link.replace('/category/', '')}`;
    }
    if (link.startsWith('/shop/')) {
      // Website category pages live at /shop/:slug; mobile's equivalent is
      // the dedicated category/[slug] screen, not the generic Shop tab.
      return `/category/${link.replace('/shop/', '')}`;
    }
    if (link.startsWith('/product/')) {
      return `/product/${link.replace('/product/', '')}`;
    }
    if (link.startsWith('/')) {
      return link;
    }
    return null;
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
                        onPress={() => {
                          const dest = resolveMenuLink(item);
                          if (dest) navigate(dest);
                        }}
                        style={s.menuItem}
                      >
                        <Ionicons name={hasChildren ? "chevron-down-outline" : "link-outline"} size={18} color={colors.gray700} />
                        <Text style={s.menuLabel}>{item.label || item.title}</Text>
                      </Pressable>
                      {hasChildren && item.children.map((child: any, j: number) => (
                        <Pressable
                          key={child._id || j}
                          onPress={() => {
                            const dest = resolveMenuLink(child);
                            if (dest) navigate(dest);
                          }}
                          style={[s.menuItem, { paddingLeft: 44 }]}
                        >
                          <Ionicons name="chevron-forward-outline" size={14} color={colors.gray500} />
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
