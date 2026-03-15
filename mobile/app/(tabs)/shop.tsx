import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { colors } from "@/theme";
import { productsAPI, categoriesAPI } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("-createdAt");

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        const params: any = { page: pageNum, limit: 12, sort: sortBy };
        if (selectedCategory) params.category = selectedCategory;
        const res = await productsAPI.getAll(params);
        const data = res.data?.data || [];
        if (append) setProducts((prev) => [...prev, ...data]);
        else setProducts(data);
        setHasMore(data.length === 12);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, sortBy]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesAPI.getAll({ limit: 20 });
        setCategories(res.data?.data || []);
      } catch {}
    };
    loadCategories();
  }, []);

  useEffect(() => { fetchProducts(1, false); }, [fetchProducts]);

  const loadMore = () => { if (!loadingMore && hasMore) fetchProducts(page + 1, true); };

  const renderHeader = () => (
    <View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        data={[{ _id: null, name: "All" }, ...categories]}
        keyExtractor={(item) => item._id || "all"}
        renderItem={({ item }) => {
          const active = selectedCategory === item._id;
          return (
            <Pressable
              onPress={() => setSelectedCategory(item._id)}
              style={[ss.chip, active ? ss.chipActive : ss.chipInactive]}
            >
              <Text style={[ss.chipText, active ? ss.chipTextActive : ss.chipTextInactive]}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
      <View style={ss.sortRow}>
        <Text style={ss.countText}>{products.length} products</Text>
        <Pressable
          style={ss.sortBtn}
          onPress={() => {
            const sorts = ["-createdAt", "regularPrice", "-regularPrice", "-averageRating"];
            const idx = sorts.indexOf(sortBy);
            setSortBy(sorts[(idx + 1) % sorts.length]);
          }}
        >
          <Ionicons name="swap-vertical" size={14} color={colors.gray500} />
          <Text style={ss.countText}>
            {sortBy === "-createdAt" ? "Newest" : sortBy === "regularPrice" ? "Price: Low" : sortBy === "-regularPrice" ? "Price: High" : "Rating"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={[ss.screen, { paddingTop: insets.top }]}>
      <View style={ss.header}>
        <Text style={ss.title}>Shop</Text>
        <SearchBar editable={false} />
      </View>
      {products.length === 0 ? (
        <EmptyState icon="bag-outline" title="No products found" message="Try a different category or check back later" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={{ width: (SCREEN_WIDTH - 44) / 2 }}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 0, borderWidth: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipInactive: { backgroundColor: colors.white, borderColor: colors.gray200 },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  chipTextInactive: { color: colors.gray700 },
  sortRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  countText: { fontSize: 12, color: colors.gray500 },
});
