import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import BottomTabBar from "@/components/BottomTabBar";
import TikTokVideoSlot from "@/components/social/TikTokVideoSlot";
import { colors, resolveImageUrl } from "@/theme";
import { productsAPI, categoriesAPI, productArchiveSettingsAPI } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SORT_OPTIONS = [
  { value: "featured",     label: "Featured" },
  { value: "newest",       label: "Newest First" },
  { value: "price-low",    label: "Price: Low to High" },
  { value: "price-high",   label: "Price: High to Low" },
  { value: "name-az",      label: "Name: A to Z" },
  { value: "name-za",      label: "Name: Z to A" },
  { value: "rating",       label: "Top Rated" },
  { value: "best-selling", label: "Best Selling" },
];

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; search?: string }>();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [archiveSettings, setArchiveSettings] = useState<any>(null);

  // Filter state — null until user picks; falls back to admin defaults
  const [sortOverride, setSortOverride] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const sortBy = sortOverride ?? archiveSettings?.toolbar?.defaultSort ?? "newest";
  const setSortBy = (v: string) => setSortOverride(v);

  // Pending (in drawer) vs applied
  const [pendingSort, setPendingSort] = useState<string>(sortBy);
  const [pendingInStock, setPendingInStock] = useState(false);

  // Dynamic columns + per-page from admin settings (correct field names: columnsMobile, defaultPerPage)
  const numColumns = archiveSettings?.productGrid?.columnsMobile || 2;
  const limit = archiveSettings?.toolbar?.defaultPerPage || 12;
  const paginationType = archiveSettings?.pagination?.type || 'infinite-scroll';

  useEffect(() => {
    productArchiveSettingsAPI.get().then((res) => {
      setArchiveSettings(res.data?.data || res.data);
    }).catch(() => {});
    categoriesAPI.getAll({ limit: 30 }).then((res) => {
      setCategories(res.data?.data || []);
    }).catch(() => {});
  }, []);

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        const params: any = { page: pageNum, limit, sort: sortBy };
        if (selectedCategory) params.category = selectedCategory;
        if (inStockOnly) params.inStock = true;
        const res = await productsAPI.getAll(params);
        const data = res.data?.data || [];
        const total = res.data?.total || res.data?.count || data.length;
        if (append) setProducts((prev) => [...prev, ...data]);
        else setProducts(data);
        setTotalCount(total);
        setHasMore(data.length === limit);
        setPage(pageNum);
      } catch {}
      finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, sortBy, inStockOnly, limit]
  );

  useEffect(() => { fetchProducts(1, false); }, [fetchProducts]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    // For numbered: replace page; for load-more / infinite-scroll: append
    fetchProducts(page + 1, paginationType !== 'numbered');
  };
  const goToPrevPage = () => {
    if (loadingMore || page <= 1) return;
    fetchProducts(page - 1, false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const openFilterDrawer = () => {
    setPendingSort(sortBy);
    setPendingInStock(inStockOnly);
    setFilterDrawerOpen(true);
  };

  const applyFilters = () => {
    setSortBy(pendingSort);
    setInStockOnly(pendingInStock);
    setFilterDrawerOpen(false);
  };

  const clearFilters = () => {
    const adminDefault = archiveSettings?.toolbar?.defaultSort || "newest";
    setPendingSort(adminDefault);
    setPendingInStock(false);
  };

  const emptyTitle = archiveSettings?.emptyState?.title || "No products found";
  const emptyMessage = archiveSettings?.emptyState?.message || "Try a different category or check back later";

  const cardWidth = (SCREEN_WIDTH - 32 - (numColumns - 1) * 12) / numColumns;

  const shopBanner = archiveSettings?.shopBanner || archiveSettings?.banner;

  const renderHeader = () => (
    <View>
      {/* Shop Banner */}
      {shopBanner?.image && (
        <Pressable style={ss.bannerWrap} onPress={() => shopBanner.link && router.push(shopBanner.link as any)}>
          <Image source={{ uri: resolveImageUrl(shopBanner.image) }} style={ss.bannerImg} contentFit="cover" />
          {(shopBanner.title || shopBanner.subtitle) && (
            <View style={ss.bannerOverlay}>
              {shopBanner.title && <Text style={ss.bannerTitle}>{shopBanner.title}</Text>}
              {shopBanner.subtitle && <Text style={ss.bannerSubtitle}>{shopBanner.subtitle}</Text>}
            </View>
          )}
        </Pressable>
      )}
      {/* Category pills — tap navigates to category page */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        data={[{ _id: null, name: "All", slug: null }, ...categories]}
        keyExtractor={(item: any) => item._id || "all"}
        renderItem={({ item }: any) => {
          const active = !item._id && !selectedCategory;
          return (
            <Pressable
              onPress={() => {
                if (!item._id) {
                  setSelectedCategory(null);
                } else {
                  router.push(`/category/${item.slug || item._id}` as any);
                }
              }}
              style={[ss.chip, active ? ss.chipActive : ss.chipInactive]}
            >
              <Text style={[ss.chipText, active ? ss.chipTextActive : ss.chipTextInactive]}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
      {/* TikTok carousel */}
      <TikTokVideoSlot
        keywords={selectedCategory ? [String(selectedCategory)] : ["trending", "shopping"]}
        pageType="shop"
      />

      {/* Toolbar */}
      <View style={ss.sortRow}>
        <Text style={ss.countText}>{totalCount > 0 ? `${totalCount} products` : `${products.length} products`}</Text>
        <Pressable onPress={openFilterDrawer} style={ss.filterBtn}>
          <Ionicons name="options-outline" size={15} color={colors.gray700} />
          <Text style={ss.filterBtnText}>Filter & Sort</Text>
          {(sortOverride !== null || inStockOnly) && (
            <View style={ss.filterBadge} />
          )}
        </Pressable>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={[ss.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={ss.header}>
        <Text style={ss.title}>Shop</Text>
        <SearchBar editable={false} />
      </View>

      {products.length === 0 ? (
        <EmptyState icon="bag-outline" title={emptyTitle} message={emptyMessage} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: 16, gap: 12, marginBottom: 12 } : undefined}
          contentContainerStyle={numColumns === 1 ? { paddingHorizontal: 16 } : undefined}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={{ width: numColumns === 1 ? "100%" : cardWidth }}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReached={paginationType === 'infinite-scroll' ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <PaginationFooter
              type={paginationType}
              page={page}
              hasMore={hasMore}
              totalCount={totalCount}
              limit={limit}
              loadingMore={loadingMore}
              loadMoreText={archiveSettings?.pagination?.loadMoreText || 'Load More Products'}
              onLoadMore={loadMore}
              onPrev={goToPrevPage}
            />
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}

      <BottomTabBar />

      {/* Filter & Sort Drawer */}
      <Modal visible={filterDrawerOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <Pressable style={ss.modalOverlay} onPress={() => setFilterDrawerOpen(false)} />
        <View style={ss.drawer}>
          <View style={ss.drawerHeader}>
            <Text style={ss.drawerTitle}>Filter & Sort</Text>
            <Pressable onPress={() => setFilterDrawerOpen(false)}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

            {/* Sort */}
            <Text style={ss.drawerSection}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setPendingSort(opt.value)}
                style={[ss.drawerOption, pendingSort === opt.value && ss.drawerOptionActive]}
              >
                <Text style={[ss.drawerOptionText, pendingSort === opt.value && { color: colors.primary, fontWeight: "700" }]}>{opt.label}</Text>
                {pendingSort === opt.value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}

            {/* In Stock */}
            <Text style={ss.drawerSection}>Stock</Text>
            <View style={ss.drawerToggleRow}>
              <Text style={ss.drawerOptionText}>In Stock Only</Text>
              <Switch
                value={pendingInStock}
                onValueChange={setPendingInStock}
                trackColor={{ true: colors.primary, false: colors.gray200 }}
                thumbColor={colors.white}
              />
            </View>

            {/* Categories */}
            <Text style={ss.drawerSection}>Category</Text>
            {[{ _id: null, name: "All Categories" }, ...categories].map((cat) => (
              <Pressable
                key={cat._id || "all"}
                onPress={() => { setSelectedCategory(cat._id); setFilterDrawerOpen(false); }}
                style={[ss.drawerOption, selectedCategory === cat._id && ss.drawerOptionActive]}
              >
                <Text style={[ss.drawerOptionText, selectedCategory === cat._id && { color: colors.primary, fontWeight: "700" }]}>{cat.name}</Text>
                {selectedCategory === cat._id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </ScrollView>

          <View style={ss.drawerFooter}>
            <Pressable onPress={clearFilters} style={ss.clearBtn}>
              <Text style={ss.clearBtnText}>Clear All</Text>
            </Pressable>
            <Pressable onPress={applyFilters} style={ss.applyBtn}>
              <Text style={ss.applyBtnText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PaginationFooter({
  type, page, hasMore, totalCount, limit, loadingMore, loadMoreText, onLoadMore, onPrev,
}: {
  type: string;
  page: number;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  loadingMore: boolean;
  loadMoreText: string;
  onLoadMore: () => void;
  onPrev: () => void;
}) {
  if (loadingMore) {
    return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />;
  }
  if (type === 'load-more' && hasMore) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <Pressable onPress={onLoadMore} style={ss.loadMoreBtn}>
          <Text style={ss.loadMoreText}>{loadMoreText}</Text>
        </Pressable>
      </View>
    );
  }
  if (type === 'numbered') {
    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / Math.max(1, limit)));
    if (totalPages <= 1) return null;
    return (
      <View style={ss.pagerRow}>
        <Pressable onPress={onPrev} disabled={page <= 1} style={[ss.pagerBtn, page <= 1 && ss.pagerBtnDisabled]}>
          <Ionicons name="chevron-back" size={16} color={page <= 1 ? colors.gray400 : colors.gray700} />
          <Text style={[ss.pagerBtnText, page <= 1 && { color: colors.gray400 }]}>Prev</Text>
        </Pressable>
        <Text style={ss.pagerLabel}>Page {page} of {totalPages}</Text>
        <Pressable onPress={onLoadMore} disabled={!hasMore} style={[ss.pagerBtn, !hasMore && ss.pagerBtnDisabled]}>
          <Text style={[ss.pagerBtnText, !hasMore && { color: colors.gray400 }]}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={!hasMore ? colors.gray400 : colors.gray700} />
        </Pressable>
      </View>
    );
  }
  return null;
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  bannerWrap: { position: "relative", height: 140, marginBottom: 0 },
  bannerImg: { width: "100%", height: 140 },
  bannerOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.4)" },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  bannerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 0, borderWidth: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipInactive: { backgroundColor: colors.white, borderColor: colors.gray200 },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  chipTextInactive: { color: colors.gray700 },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  countText: { fontSize: 12, color: colors.gray500 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 7, position: "relative" },
  filterBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  filterBadge: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, position: "absolute", top: 4, right: 4 },
  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  drawer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "80%", paddingBottom: 34 },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  drawerTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  drawerSection: { fontSize: 11, fontWeight: "700", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  drawerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  drawerOptionActive: { backgroundColor: colors.primaryLight },
  drawerOptionText: { fontSize: 14, color: colors.gray800 },
  drawerToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10 },
  drawerFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.gray100 },
  clearBtn: { flex: 1, borderWidth: 1, borderColor: colors.gray300, paddingVertical: 13, alignItems: "center" },
  clearBtnText: { fontSize: 14, fontWeight: "600", color: colors.gray700 },
  applyBtn: { flex: 2, backgroundColor: colors.primary, paddingVertical: 13, alignItems: "center" },
  applyBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
  // Pagination footer
  loadMoreBtn: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", borderRadius: 4 },
  loadMoreText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  pagerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  pagerBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white },
  pagerBtnDisabled: { borderColor: colors.gray100, backgroundColor: colors.gray50 },
  pagerBtnText: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
  pagerLabel: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
});
