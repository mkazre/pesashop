import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { colors, resolveImageUrl } from "@/theme";
import { productsAPI, categoriesAPI, statsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import BottomTabBar from "@/components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Full search results (shown after submit)
  const [results, setResults] = useState<any[]>([]);
  const [fullLoading, setFullLoading] = useState(false);

  // Live suggestions (shown as user types)
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Top searches from stats module
  const [topSearches, setTopSearches] = useState<any[]>([]);

  useEffect(() => {
    statsAPI.getTopSearches({ limit: 10 })
      .then((res) => {
        const data = res.data?.data || [];
        setTopSearches(data);
      })
      .catch(() => {});
  }, []);

  // ── Live suggestions (debounced) ──
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSuggestedProducts([]);
      setSuggestedCategories([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestLoading(true);
    setShowSuggestions(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getAll({ search: q.trim(), limit: 6 }),
        categoriesAPI.getAll({ search: q.trim() }),
      ]);
      const products = prodRes?.data?.data || [];
      const allCats = catRes?.data?.data || [];
      const categories = allCats
        .filter((c: any) => c.name?.toLowerCase().includes(q.trim().toLowerCase()))
        .slice(0, 4);
      setSuggestedProducts(products);
      setSuggestedCategories(categories);
    } catch {
      setSuggestedProducts([]);
      setSuggestedCategories([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const handleTextChange = (text: string) => {
    setQuery(text);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  // ── Full search (on submit / "See all") ──
  const handleFullSearch = useCallback(async (q?: string) => {
    const searchTerm = (q || query).trim();
    if (!searchTerm) return;
    setShowSuggestions(false);
    setFullLoading(true);
    setHasSearched(true);
    try {
      const res = await productsAPI.search(searchTerm);
      setResults(res.data?.data || []);
      try {
        statsAPI.trackEvent({
          type: "search",
          searchQuery: searchTerm,
          searchResultCount: res.data?.data?.length || 0,
        });
      } catch {}
    } catch {
      setResults([]);
    } finally {
      setFullLoading(false);
    }
  }, [query]);

  const handleTopSearchTap = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    handleFullSearch(term);
  };

  const hasSuggestions = suggestedProducts.length > 0 || suggestedCategories.length > 0;
  const showTopSearches = !hasSearched && !showSuggestions && topSearches.length > 0;

  return (
    <View style={[sr.screen, { paddingTop: insets.top }]}>
      {/* ── Header with search bar ── */}
      <View style={sr.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray700} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SearchBar
            value={query}
            onChangeText={handleTextChange}
            onSubmit={() => handleFullSearch()}
            autoFocus
          />
        </View>
      </View>

      {/* ── Top Searches (from stats module) ── */}
      {showTopSearches && (
        <View style={sr.topSection}>
          <View style={sr.topHeader}>
            <Ionicons name="trending-up" size={16} color={colors.primary} />
            <Text style={sr.topTitle}>Top Searches</Text>
          </View>
          <View style={sr.chipWrap}>
            {topSearches.map((item: any, idx: number) => {
              const term = item.query || item.term || item._id || "";
              if (!term) return null;
              return (
                <Pressable key={idx} onPress={() => handleTopSearchTap(term)} style={sr.chip}>
                  <Ionicons name="search-outline" size={12} color={colors.gray500} />
                  <Text style={sr.chipText}>{term}</Text>
                  {item.count > 1 && (
                    <Text style={sr.chipCount}>{item.count}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Live Suggestions Dropdown ── */}
      {showSuggestions && !hasSearched && (
        <ScrollView style={sr.suggestContainer} keyboardShouldPersistTaps="handled">
          {suggestLoading && (
            <View style={sr.suggestLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={sr.suggestLoadingText}>Searching...</Text>
            </View>
          )}

          {/* Categories */}
          {!suggestLoading && suggestedCategories.length > 0 && (
            <View>
              <Text style={sr.suggestSectionTitle}>CATEGORIES</Text>
              {suggestedCategories.map((cat: any) => (
                <Pressable
                  key={cat._id}
                  style={sr.suggestRow}
                  onPress={() => {
                    setShowSuggestions(false);
                    router.push(`/category/${cat.slug}`);
                  }}
                >
                  <View style={sr.catIcon}>
                    <Text style={sr.catIconText}>{cat.name?.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sr.suggestName} numberOfLines={1}>{cat.name}</Text>
                    {cat.productCount > 0 && (
                      <Text style={sr.suggestMeta}>{cat.productCount} products</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.gray300} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Products */}
          {!suggestLoading && suggestedProducts.length > 0 && (
            <View>
              <Text style={sr.suggestSectionTitle}>PRODUCTS</Text>
              {suggestedProducts.map((product: any) => {
                const price = product.salePrice || product.regularPrice;
                const hasDiscount = product.salePrice && product.regularPrice && product.salePrice < product.regularPrice;
                const img = product.featuredImage || product.images?.[0];
                return (
                  <Pressable
                    key={product._id}
                    style={sr.suggestRow}
                    onPress={() => {
                      setShowSuggestions(false);
                      router.push(`/product/${product.slug || product._id}`);
                    }}
                  >
                    {img ? (
                      <Image
                        source={{ uri: resolveImageUrl(img) }}
                        style={sr.productThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[sr.productThumb, { backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" }]}>
                        <Ionicons name="cube-outline" size={16} color={colors.gray400} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={sr.suggestName} numberOfLines={1}>{product.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <Text style={sr.suggestPrice}>{formatPrice(price)}</Text>
                        {hasDiscount && (
                          <Text style={sr.suggestOldPrice}>{formatPrice(product.regularPrice)}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.gray300} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* No results */}
          {!suggestLoading && !hasSuggestions && query.length >= 2 && (
            <View style={sr.suggestEmpty}>
              <Ionicons name="search-outline" size={32} color={colors.gray300} />
              <Text style={sr.suggestEmptyText}>No results for "{query}"</Text>
              <Text style={sr.suggestEmptyHint}>Try a different search term</Text>
            </View>
          )}

          {/* See all results link */}
          {!suggestLoading && hasSuggestions && (
            <Pressable style={sr.seeAllBtn} onPress={() => handleFullSearch()}>
              <Text style={sr.seeAllText}>See all results for "{query}"</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* ── Full Search Results Grid ── */}
      {fullLoading ? (
        <LoadingSpinner />
      ) : hasSearched ? (
        results.length === 0 ? (
          <View style={sr.emptyWrap}>
            <Ionicons name="search-outline" size={48} color={colors.gray300} />
            <Text style={sr.emptyTitle}>No results found</Text>
            <Text style={sr.emptySub}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item: any) => item._id}
            numColumns={2}
            columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
            contentContainerStyle={{ paddingTop: 12 }}
            ListHeaderComponent={
              <Text style={sr.resultCount}>{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</Text>
            }
            renderItem={({ item }: any) => (
              <View style={{ width: (SCREEN_WIDTH - 44) / 2 }}>
                <ProductCard product={item} />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : null}
      <BottomTabBar />
    </View>
  );
}

const sr = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },

  // Top searches
  topSection: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.white },
  topHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  topTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.gray50, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.gray200 },
  chipText: { fontSize: 13, color: colors.gray700 },
  chipCount: { fontSize: 10, color: colors.gray400, fontWeight: "600" },

  // Suggestions
  suggestContainer: { flex: 1, backgroundColor: colors.white },
  suggestLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 20 },
  suggestLoadingText: { fontSize: 13, color: colors.gray500 },
  suggestSectionTitle: { fontSize: 10, fontWeight: "700", color: colors.gray400, letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.gray50 },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  catIcon: { width: 32, height: 32, borderRadius: 6, backgroundColor: `${colors.primary}15`, alignItems: "center", justifyContent: "center" },
  catIconText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  productThumb: { width: 44, height: 44, borderRadius: 6 },
  suggestName: { fontSize: 14, fontWeight: "500", color: colors.gray900 },
  suggestMeta: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  suggestPrice: { fontSize: 13, fontWeight: "700", color: colors.primary },
  suggestOldPrice: { fontSize: 11, color: colors.gray400, textDecorationLine: "line-through" },
  suggestEmpty: { alignItems: "center", paddingVertical: 32 },
  suggestEmptyText: { fontSize: 14, fontWeight: "500", color: colors.gray600, marginTop: 8 },
  suggestEmptyHint: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.gray100 },
  seeAllText: { fontSize: 14, fontWeight: "600", color: colors.primary },

  // Full results
  resultCount: { fontSize: 13, color: colors.gray500, paddingHorizontal: 16, paddingBottom: 8 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.gray700, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.gray500, textAlign: "center", marginTop: 4 },
});
