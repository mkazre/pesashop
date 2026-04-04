import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import BottomTabBar from "@/components/BottomTabBar";
import { colors, resolveImageUrl } from "@/theme";
import { productsAPI, categoriesAPI, productArchiveSettingsAPI, productPageSettingsAPI } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SORT_OPTIONS = [
  { value: "-createdAt",    label: "Newest First" },
  { value: "regularPrice",  label: "Price: Low to High" },
  { value: "-regularPrice", label: "Price: High to Low" },
  { value: "-averageRating",label: "Top Rated" },
  { value: "-salesCount",   label: "Best Selling" },
];

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [archiveSettings, setArchiveSettings] = useState<any>(null);
  const [deliveryDays, setDeliveryDays] = useState<number | undefined>(undefined);

  // Filter state
  const [sortBy, setSortBy] = useState("-createdAt");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [gridMode, setGridMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingSort, setPendingSort] = useState("-createdAt");
  const [pendingInStock, setPendingInStock] = useState(false);

  const numColumns = gridMode === "grid" ? (archiveSettings?.productGrid?.colsMobile || 2) : 1;
  const limit = archiveSettings?.toolbar?.perPage || 12;

  useEffect(() => {
    Promise.all([
      productArchiveSettingsAPI.get().catch(() => null),
      productPageSettingsAPI.get().catch(() => null),
    ]).then(([archRes, pageRes]) => {
      setArchiveSettings(archRes?.data?.data || archRes?.data);
      const days = pageRes?.data?.data?.productInfo?.estimatedDeliveryDays || pageRes?.data?.productInfo?.estimatedDeliveryDays;
      if (days) setDeliveryDays(days);
    });
    if (slug) {
      categoriesAPI.getBySlug(slug).then((res) => setCategory(res.data?.data || res.data)).catch(() => {});
    }
  }, [slug]);

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        const params: any = { category: category?._id || slug, page: pageNum, limit, sort: sortBy };
        if (inStockOnly) params.inStock = true;
        const res = await productsAPI.getAll(params);
        const data = res.data?.data || [];
        const total = res.data?.total || res.data?.count || data.length;
        if (append) setProducts((prev) => [...prev, ...data]);
        else setProducts(data);
        setTotalCount(total);
        setHasMore(data.length === limit);
        setPage(pageNum);
      } catch {
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, slug, sortBy, inStockOnly, limit]
  );

  useEffect(() => { if (category || slug) fetchProducts(1); }, [fetchProducts, category, slug]);

  const loadMore = () => { if (!loadingMore && hasMore) fetchProducts(page + 1, true); };

  const applyFilters = () => {
    setSortBy(pendingSort);
    setInStockOnly(pendingInStock);
    setFilterOpen(false);
  };

  const cardWidth = gridMode === "grid"
    ? (SCREEN_WIDTH - 32 - (numColumns - 1) * 12) / numColumns
    : SCREEN_WIDTH - 32;

  if (loading && !category) return <LoadingSpinner fullScreen />;

  const bannerUrl = category?.bannerImage ? resolveImageUrl(category.bannerImage) : null;

  const renderHeader = () => (
    <View>
      {/* Category Banner */}
      {bannerUrl && (
        <View style={cat.banner}>
          <Image source={{ uri: bannerUrl }} style={cat.bannerImage} contentFit="cover" />
          <View style={cat.bannerOverlay}>
            <Text style={cat.bannerTitle}>{category?.name}</Text>
            {category?.description ? (
              <Text style={cat.bannerDesc} numberOfLines={2}>{category.description}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Toolbar */}
      <View style={cat.toolbar}>
        <Text style={cat.countText}>
          {totalCount > 0 ? `${totalCount} products` : `${products.length} products`}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {/* Grid/List toggle */}
          <Pressable onPress={() => setGridMode(gridMode === "grid" ? "list" : "grid")} style={cat.iconBtn}>
            <Ionicons name={gridMode === "grid" ? "list-outline" : "grid-outline"} size={18} color={colors.gray700} />
          </Pressable>
          {/* Filter/Sort */}
          <Pressable onPress={() => { setPendingSort(sortBy); setPendingInStock(inStockOnly); setFilterOpen(true); }} style={cat.filterBtn}>
            <Ionicons name="options-outline" size={15} color={colors.gray700} />
            <Text style={cat.filterBtnText}>Sort & Filter</Text>
            {(sortBy !== "-createdAt" || inStockOnly) && <View style={cat.filterDot} />}
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={cat.screen}>
      <ScreenHeader title={category?.name || "Category"} showBack />

      {products.length === 0 && !loading ? (
        <>
          {renderHeader()}
          <EmptyState icon="bag-outline" title="No products" message="No products found in this category" />
        </>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: any) => item._id}
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: 16, gap: 12, marginBottom: 12 } : undefined}
          contentContainerStyle={numColumns === 1 ? { paddingHorizontal: 16, paddingTop: 0 } : { paddingTop: 0 }}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }: any) => (
            <View style={{ width: cardWidth, marginBottom: numColumns === 1 ? 12 : 0 }}>
              <ProductCard product={item} deliveryDays={deliveryDays} />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
              : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter/Sort Modal */}
      <Modal visible={filterOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <Pressable style={cat.modalOverlay} onPress={() => setFilterOpen(false)} />
        <View style={cat.drawer}>
          <View style={cat.drawerHeader}>
            <Text style={cat.drawerTitle}>Sort & Filter</Text>
            <Pressable onPress={() => setFilterOpen(false)}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={cat.drawerSection}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setPendingSort(opt.value)}
                style={[cat.drawerOption, pendingSort === opt.value && cat.drawerOptionActive]}
              >
                <Text style={[cat.drawerOptionText, pendingSort === opt.value && { color: colors.primary, fontWeight: "700" }]}>
                  {opt.label}
                </Text>
                {pendingSort === opt.value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}

            <Text style={cat.drawerSection}>Stock</Text>
            <View style={cat.drawerToggleRow}>
              <Text style={cat.drawerOptionText}>In Stock Only</Text>
              <Pressable
                onPress={() => setPendingInStock(!pendingInStock)}
                style={[cat.toggle, pendingInStock && cat.toggleOn]}
              >
                <View style={[cat.toggleThumb, pendingInStock && cat.toggleThumbOn]} />
              </Pressable>
            </View>
          </ScrollView>

          <View style={cat.drawerFooter}>
            <Pressable onPress={() => { setPendingSort("-createdAt"); setPendingInStock(false); }} style={cat.clearBtn}>
              <Text style={cat.clearBtnText}>Clear</Text>
            </Pressable>
            <Pressable onPress={applyFilters} style={cat.applyBtn}>
              <Text style={cat.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </View>
  );
}

const cat = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  banner: { position: "relative", height: 160, marginBottom: 0 },
  bannerImage: { width: "100%", height: 160 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end", padding: 16 },
  bannerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  bannerDesc: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  countText: { fontSize: 12, color: colors.gray500 },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.white, position: "relative" },
  filterBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  filterDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, position: "absolute", top: 3, right: 3 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  drawer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "70%", paddingBottom: 34 },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  drawerTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  drawerSection: { fontSize: 11, fontWeight: "700", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  drawerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  drawerOptionActive: { backgroundColor: colors.primaryLight },
  drawerOptionText: { fontSize: 14, color: colors.gray800 },
  drawerToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.gray200, padding: 2 },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleThumbOn: { marginLeft: 20 },
  drawerFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.gray100 },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: colors.gray300, paddingVertical: 13, alignItems: "center" },
  clearBtnText: { fontSize: 14, fontWeight: "600", color: colors.gray700 },
  applyBtn: { flex: 2, backgroundColor: colors.primary, paddingVertical: 13, alignItems: "center" },
  applyBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
