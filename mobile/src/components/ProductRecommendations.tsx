import { useState, useEffect } from "react";
import { View, Text, FlatList, Dimensions, StyleSheet } from "react-native";
import ProductCard from "./ProductCard";
import { statsAPI } from "@/services/api";
import { colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

type RecommendationType = "related" | "upsells" | "also_bought" | "recommended";

interface ProductRecommendationsProps {
  productId: string;
  type: RecommendationType;
  title?: string;
}

const FETCH_MAP: Record<RecommendationType, (id: string) => Promise<any>> = {
  related: (id) => statsAPI.getAlsoViewed(id, { limit: 8 }),
  upsells: (id) => statsAPI.getFrequentlyBoughtTogether(id, { limit: 8 }),
  also_bought: (id) => statsAPI.getAlsoBought(id, { limit: 8 }),
  recommended: (id) => statsAPI.getRecommended(id, { limit: 8 }),
};

const DEFAULT_TITLES: Record<RecommendationType, string> = {
  related: "Customers Also Viewed",
  upsells: "Frequently Bought Together",
  also_bought: "Customers Also Bought",
  recommended: "Recommended For You",
};

export default function ProductRecommendations({ productId, type, title }: ProductRecommendationsProps) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!productId) return;
    const fetcher = FETCH_MAP[type];
    if (!fetcher) return;

    fetcher(productId)
      .then((res) => {
        const data = res.data?.data || [];
        setProducts(data);
      })
      .catch(() => {});
  }, [productId, type]);

  if (products.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.title}>{title || DEFAULT_TITLES[type]}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        data={products}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: any) => (
          <View style={{ width: CARD_WIDTH }}>
            <ProductCard product={item} compact />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 24 },
  title: { fontSize: 16, fontWeight: "700", color: colors.gray900, paddingHorizontal: 16, marginBottom: 12 },
});
