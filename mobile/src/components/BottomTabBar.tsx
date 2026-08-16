import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore, useWishlistStore, useCompareStore } from "@/store";
import { colors } from "@/theme";

const TABS = [
  { name: "Home",     labelKey: "nav.home",     route: "/",           icon: "home-outline",        activeIcon: "home"          },
  { name: "Shop",     labelKey: "nav.shop",     route: "/shop",        icon: "grid-outline",        activeIcon: "grid"          },
  { name: "Cart",     labelKey: "nav.cart",     route: "/cart",        icon: "cart-outline",        activeIcon: "cart"          },
  { name: "Wishlist", labelKey: "nav.wishlist", route: "/(tabs)/wishlist", icon: "heart-outline",   activeIcon: "heart"         },
  { name: "Compare",  labelKey: null,           route: "/compare",     icon: "git-compare-outline", activeIcon: "git-compare"   },
  { name: "Account",  labelKey: "nav.account",  route: "/account",     icon: "person-outline",      activeIcon: "person"        },
] as const;

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const compareCount = useCompareStore((s) => s.products.length);

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive =
          tab.route === "/"
            ? pathname === "/" || pathname === "/index"
            : pathname === tab.route || pathname.startsWith(tab.route.replace("(tabs)/", ""));
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.replace(tab.route as any)}
            style={s.tab}
          >
            <View>
              <Ionicons name={iconName as any} size={20} color={isActive ? colors.primary : "#9ca3af"} />
              {tab.name === "Cart" && cartCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                </View>
              )}
              {tab.name === "Wishlist" && wishlistCount > 0 && (
                <View style={[s.badge, { backgroundColor: "#ef4444" }]}>
                  <Text style={s.badgeText}>{wishlistCount > 99 ? "99+" : wishlistCount}</Text>
                </View>
              )}
              {tab.name === "Compare" && compareCount > 0 && (
                <View style={[s.badge, { backgroundColor: colors.primary }]}>
                  <Text style={s.badgeText}>{compareCount}</Text>
                </View>
              )}
            </View>
            <Text style={[s.label, { color: isActive ? colors.primary : "#9ca3af" }]}>
              {tab.labelKey ? t(tab.labelKey) : tab.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
});
