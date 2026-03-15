import { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import ScreenHeader from "@/components/ScreenHeader";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { colors } from "@/theme";
import { productsAPI, categoriesAPI } from "@/services/api";
import BottomTabBar from "@/components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        const res = await productsAPI.getAll({ category: category?._id || slug, page: pageNum, limit: 12, sort: "-createdAt" });
        const data = res.data?.data || [];
        if (append) setProducts((prev) => [...prev, ...data]);
        else setProducts(data);
        setHasMore(data.length === 12);
        setPage(pageNum);
      } catch {
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, slug]
  );

  useEffect(() => {
    if (slug) {
      categoriesAPI.getBySlug(slug).then((res) => setCategory(res.data?.data || res.data)).catch(() => {});
    }
  }, [slug]);

  useEffect(() => { if (category || slug) fetchProducts(1); }, [category, slug, fetchProducts]);

  const loadMore = () => { if (!loadingMore && hasMore) fetchProducts(page + 1, true); };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={cts.screen}>
      <ScreenHeader title={category?.name || "Category"} showBack />
      {products.length === 0 ? (
        <EmptyState icon="bag-outline" title="No products" message="No products found in this category" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: any) => item._id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
          contentContainerStyle={{ paddingTop: 12 }}
          renderItem={({ item }: any) => (
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
      <BottomTabBar />
    </View>
  );
}

const cts = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
});
