import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "@/store";
import { colors } from "@/theme";

const TABS = [
  { name: "Home", route: "/", icon: "home-outline", activeIcon: "home" },
  { name: "Shop", route: "/shop", icon: "grid-outline", activeIcon: "grid" },
  { name: "Cart", route: "/cart", icon: "cart-outline", activeIcon: "cart" },
  { name: "Wishlist", route: "/wishlist", icon: "heart-outline", activeIcon: "heart" },
  { name: "Account", route: "/account", icon: "person-outline", activeIcon: "person" },
] as const;

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) => s.getItemCount());

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {TABS.map((tab) => {
        const isActive =
          tab.route === "/"
            ? pathname === "/" || pathname === "/index"
            : pathname.startsWith(tab.route);
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <Pressable
            key={tab.name}
            onPress={() => router.replace(tab.route as any)}
            style={s.tab}
          >
            <View>
              <Ionicons
                name={iconName as any}
                size={22}
                color={isActive ? colors.primary : "#9ca3af"}
              />
              {tab.name === "Cart" && cartCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                s.label,
                { color: isActive ? colors.primary : "#9ca3af" },
              ]}
            >
              {tab.name}
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
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
