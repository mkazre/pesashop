import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import HomePageRenderer from "@/components/homeblocks/HomePageRenderer";
import AppDrawer from "@/components/AppDrawer";
import CurrencyPicker from "@/components/CurrencyPicker";
import NotificationBell from "@/components/NotificationBell";
import BottomTabBar from "@/components/BottomTabBar";
import { colors, resolveImageUrl } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");
import {
  productsAPI,
  categoriesAPI,
  statsAPI,
} from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasBlockConfig, setHasBlockConfig] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchFallbackData = useCallback(async () => {
    try {
      const [featuredRes, newRes, catRes, trendingRes] = await Promise.all([
        productsAPI.getFeatured().catch(() => ({ data: { data: [] } })),
        productsAPI.getNew().catch(() => ({ data: { data: [] } })),
        categoriesAPI.getAll({ limit: 10 }).catch(() => ({ data: { data: [] } })),
        statsAPI.getTrendingProducts({ limit: 8 }).catch(() => ({ data: { data: [] } })),
      ]);
      setFeaturedProducts(featuredRes.data?.data || []);
      setNewProducts(newRes.data?.data || []);
      setCategories(catRes.data?.data || []);
      setTrendingProducts(trendingRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching home data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleConfigLoaded = useCallback(
    (hasConfig: boolean) => {
      setHasBlockConfig(hasConfig);
      if (!hasConfig) {
        fetchFallbackData();
      } else {
        setLoading(false);
      }
    },
    [fetchFallbackData]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (hasBlockConfig) {
      setHasBlockConfig(null);
      setRefreshing(false);
    } else {
      fetchFallbackData();
    }
  }, [hasBlockConfig, fetchFallbackData]);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable onPress={() => setDrawerVisible(true)} style={s.notifBtn}>
              <Ionicons name="menu-outline" size={22} color={colors.gray700} />
            </Pressable>
            <Image source={LOGO} style={s.headerLogo} contentFit="contain" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CurrencyPicker />
            <NotificationBell color={colors.gray700} size={22} />
          </View>
        </View>
        <SearchBar editable={false} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Priority 1: Home page builder blocks (same as web) */}
        {hasBlockConfig !== false && (
          <HomePageRenderer onConfigLoaded={handleConfigLoaded} />
        )}

        {/* Priority 2: Fallback — featured/trending/new */}
        {hasBlockConfig === false && !loading && (
          <>
            {categories.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Categories</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  data={categories}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => router.push(`/category/${item.slug || item._id}` as any)}
                      style={s.catItem}
                    >
                      <View style={s.catIcon}>
                        {item.iconImage?.url ? (
                          <Image source={{ uri: resolveImageUrl(item.iconImage) }} style={s.catImg} contentFit="cover" />
                        ) : (
                          <Ionicons name="grid-outline" size={24} color={colors.primary} />
                        )}
                      </View>
                      <Text style={s.catName} numberOfLines={2}>{item.name}</Text>
                    </Pressable>
                  )}
                />
              </View>
            )}

            {featuredProducts.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Featured</Text>
                  <Pressable onPress={() => router.push("/shop" as any)}>
                    <Text style={s.seeAll}>See All</Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  data={featuredProducts}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: SCREEN_WIDTH * 0.42 }}>
                      <ProductCard product={item} compact />
                    </View>
                  )}
                />
              </View>
            )}

            {trendingProducts.length > 0 && (
              <View style={s.sectionLg}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Trending Now</Text>
                  <Pressable onPress={() => router.push("/shop" as any)}>
                    <Text style={s.seeAll}>See All</Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  data={trendingProducts}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: SCREEN_WIDTH * 0.42 }}>
                      <ProductCard product={item} compact />
                    </View>
                  )}
                />
              </View>
            )}

            {newProducts.length > 0 && (
              <View style={[s.sectionLg, { paddingHorizontal: 16 }]}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>New Arrivals</Text>
                  <Pressable onPress={() => router.push("/shop" as any)}>
                    <Text style={s.seeAll}>See All</Text>
                  </Pressable>
                </View>
                <View style={s.grid}>
                  {newProducts.slice(0, 4).map((product) => (
                    <View key={product._id} style={{ width: (SCREEN_WIDTH - 44) / 2 }}>
                      <ProductCard product={product} />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {hasBlockConfig === false && loading && <LoadingSpinner fullScreen />}

        <View style={{ height: 32 }} />
      </ScrollView>
      <AppDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerLogo: { width: 140, height: 36 },
  notifBtn: { width: 40, height: 40, backgroundColor: colors.gray50, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  section: { marginTop: 16, marginBottom: 8 },
  sectionLg: { marginTop: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  catItem: { alignItems: "center", marginRight: 16, width: 80 },
  catIcon: { width: 64, height: 64, borderRadius: 0, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 6, overflow: "hidden" },
  catImg: { width: "100%", height: "100%" },
  catName: { fontSize: 11, color: colors.gray700, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});
