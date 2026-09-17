import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { TourGuideZone } from "rn-tourguide";
import { useAuthStore, useCurrencyStore, useTourStore } from "@/store";
import BottomTabBar from "@/components/BottomTabBar";
import AccountTourController from "@/components/account/AccountTourController";
import { tourScrollRef, tourRowRefs } from "@/utils/accountTourTargets";
import { colors } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");

export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const startAccountTour = useTourStore((s) => s.startAccountTour);
  const currencies = useCurrencyStore((s) => s.currencies);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);

  if (!isAuthenticated) {
    return (
      <View style={[as.screenWhite, { paddingTop: insets.top }]}>
        <View style={as.guestContainer}>
          <Image source={LOGO} style={as.guestLogo} contentFit="contain" />
          <Text style={as.guestTitle}>Welcome</Text>
          <Text style={as.guestSub}>Sign in to access your orders, wishlist, and more</Text>
          <Pressable onPress={() => router.push("/auth/login" as any)} style={as.signInBtn}>
            <Text style={as.signInText}>Sign In</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/register" as any)} style={as.registerBtn}>
            <Text style={as.registerText}>Create Account</Text>
          </Pressable>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  const menuItems = [
    { icon: "grid-outline" as const,          label: "My Dashboard",          tourId: "dashboard",       onPress: () => router.push("/account/dashboard" as any) },
    { icon: "receipt-outline" as const,       label: "My Orders",             tourId: "orders",          onPress: () => router.push("/orders" as any) },
    { icon: "navigate-outline" as const,      label: "Track Order",           onPress: () => router.push("/account/track-order" as any) },
    { icon: "card-outline" as const,          label: "My Laybyes",            tourId: "laybyes",         onPress: () => router.push("/account/laybyes" as any) },
    { icon: "refresh-outline" as const,       label: "Recurring Orders",      tourId: "recurringOrders", onPress: () => router.push("/account/recurring-orders" as any) },
    { icon: "hand-right-outline" as const,    label: "Browse Services",       onPress: () => router.push("/service-providers" as any) },
    { icon: "construct-outline" as const,     label: "My Service Requests",   onPress: () => router.push("/account/service-requests" as any) },
    { icon: "business-outline" as const, label: "Service Provider Portal", onPress: () => router.push("/service-providers-portal" as any) },
    { icon: "sparkles-outline" as const,      label: "My Offers",             onPress: () => router.push("/account/my-offers" as any) },
    { icon: "cash-outline" as const,          label: "Payments",              onPress: () => router.push("/account/payments" as any) },
    { icon: "list-outline" as const,          label: "Transaction History",   onPress: () => router.push("/account/transactions" as any) },
    { icon: "heart-outline" as const,         label: "Wishlist",              onPress: () => router.push("/(tabs)/wishlist" as any) },
    { icon: "star-outline" as const,          label: "PESA Coins",            tourId: "loyaltyPoints",   onPress: () => router.push("/account/loyalty-points" as any) },
    { icon: "pricetag-outline" as const,      label: "My Coupons",            tourId: "coupons",         onPress: () => router.push("/account/coupons" as any) },
    { icon: "gift-outline" as const,          label: "Gift Cards",            tourId: "giftCards",       onPress: () => router.push("/account/gift-cards" as any) },
    { icon: "return-down-back-outline" as const, label: "Returns",             tourId: "returns",        onPress: () => router.push("/account/returns" as any) },
    { icon: "document-text-outline" as const, label: "Invoices",              tourId: "invoices",        onPress: () => router.push("/account/invoices" as any) },
    { icon: "people-outline" as const,        label: "Invite & Earn",         tourId: "referrals",       onPress: () => router.push("/account/referrals" as any) },
    { icon: "person-outline" as const,        label: "Complete My Profile",   onPress: () => router.push("/account/demographics" as any) },
    { icon: "location-outline" as const,      label: "Addresses",             tourId: "addresses",       onPress: () => router.push("/account/addresses" as any) },
    { icon: "settings-outline" as const,      label: "Settings",              tourId: "settings",        onPress: () => router.push("/account/settings" as any) },
  ];

  const TOUR_ORDER: Record<string, number> = {
    dashboard: 1,
    loyaltyPoints: 2,
    referrals: 3,
    laybyes: 4,
    orders: 5,
    coupons: 6,
    giftCards: 7,
    addresses: 8,
    recurringOrders: 9,
    returns: 10,
    invoices: 11,
    settings: 12,
  };

  const registerRowRef = (tourId: string | undefined, el: any) => {
    if (tourId) tourRowRefs[tourId] = el;
  };

  return (
    <View style={[as.screen, { paddingTop: insets.top }]}>
      <AccountTourController />
      <ScrollView
        ref={(el) => { tourScrollRef.current = el; }}
        showsVerticalScrollIndicator={false}
      >
        <View style={as.profileHeader}>
          <View style={as.profileRow}>
            <View style={as.avatar}>
              <Text style={as.avatarText}>{(user?.firstName || user?.name || "U").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={as.userName}>{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || "User"}</Text>
              <Text style={as.userEmail}>{user?.email}</Text>
            </View>
            <Pressable onPress={startAccountTour} style={as.tourBtn} hitSlop={8}>
              <Ionicons name="help-circle-outline" size={22} color={colors.gray500} />
            </Pressable>
          </View>
        </View>

        {currencies.length > 1 && (
          <View style={as.currencySection}>
            <Text style={as.currencyLabel}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {currencies.map((c: any) => {
                  const active = selectedCurrency?.code === c.code;
                  return (
                    <Pressable key={c._id} onPress={() => setSelectedCurrency(c)} style={[as.currencyChip, active ? as.currencyChipActive : as.currencyChipInactive]}>
                      <Text style={[as.currencyChipText, active ? { color: colors.white } : { color: colors.gray700 }]}>{c.symbol} {c.code}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={as.menuSection}>
          {menuItems.map((item, index) => {
            const row = (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                ref={(el) => registerRowRef(item.tourId, el)}
                style={[as.menuItem, index < menuItems.length - 1 && as.menuItemBorder]}
              >
                <View style={as.menuIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.gray700} />
                </View>
                <Text style={as.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
              </Pressable>
            );
            if (!item.tourId) return row;
            return (
              <TourGuideZone
                key={item.tourId}
                zone={TOUR_ORDER[item.tourId]}
                text={`${t(`onboarding.tour.${item.tourId}.title`)}\n${t(`onboarding.tour.${item.tourId}.body`)}`}
                shape="rectangle"
                borderRadius={8}
              >
                {row}
              </TourGuideZone>
            );
          })}
        </View>

        <Pressable onPress={async () => { await clearAuth(); router.replace("/(tabs)" as any); }} style={as.logoutBtn}>
          <Text style={as.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const as = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  screenWhite: { flex: 1, backgroundColor: colors.white },
  guestContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  guestLogo: { width: 180, height: 60, marginBottom: 24 },
  guestTitle: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  guestSub: { fontSize: 14, color: colors.gray500, textAlign: "center", marginBottom: 24 },
  signInBtn: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 0, marginBottom: 12, width: "100%", alignItems: "center" },
  signInText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  registerBtn: { borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 0, width: "100%", alignItems: "center" },
  registerText: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  profileHeader: { backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  profileRow: { flexDirection: "row", alignItems: "center" },
  tourBtn: { padding: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: "700" },
  userName: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  userEmail: { fontSize: 14, color: colors.gray500 },
  currencySection: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 12 },
  currencyLabel: { fontSize: 12, color: colors.gray500, marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  currencyChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 0, borderWidth: 1 },
  currencyChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  currencyChipInactive: { backgroundColor: colors.white, borderColor: colors.gray200 },
  currencyChipText: { fontSize: 12, fontWeight: "600" },
  menuSection: { backgroundColor: colors.white, marginTop: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  menuIcon: { width: 36, height: 36, borderRadius: 0, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: "500", color: colors.gray800 },
  logoutBtn: { backgroundColor: colors.white, marginTop: 8, marginHorizontal: 16, borderRadius: 0, paddingVertical: 16, alignItems: "center", marginBottom: 32 },
  logoutText: { color: colors.red500, fontWeight: "600" },
});
