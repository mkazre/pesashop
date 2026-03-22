import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { useBlockProducts } from "./useBlockProducts";
import { resolveImageUrl, colors } from "@/theme";

export default function ProductVerticalTabs({ block }: { block: any }) {
  const router = useRouter();
  const tabs = block.tabs || [];
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = tabs[activeTab] || tabs[0] || { source: "all" };
  const tabActiveColor = block.tabActiveColor || block.primaryColor || colors.primary;

  const { data: products, isLoading } = useBlockProducts(currentTab.source, {
    categoryId: currentTab.categoryId,
    limit: block.productLimit || 4,
  });

  return (
    <BlockWrapper block={block}>
      {tabs.length > 1 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ gap: 8, marginBottom: 14 }}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setActiveTab(index)}
              style={[
                s.tab,
                {
                  backgroundColor:
                    index === activeTab ? tabActiveColor : colors.gray100,
                },
              ]}
            >
              <Text
                style={[
                  s.tabText,
                  { color: index === activeTab ? "#fff" : colors.gray600 },
                ]}
              >
                {item.label || "Tab"}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 30 }} />
      ) : products.length > 0 ? (
        <View style={s.list}>
          {products.map((p: any) => {
            const img = resolveImageUrl(
              p.images?.[0]?.url || p.image || p.thumbnail
            );
            const price = p.salePrice || p.regularPrice || 0;
            const oldPrice =
              p.salePrice && p.regularPrice > p.salePrice
                ? p.regularPrice
                : null;
            return (
              <Pressable
                key={p._id}
                onPress={() =>
                  router.push(`/product/${p.slug || p._id}` as any)
                }
                style={s.item}
              >
                {block.showImage !== false && img ? (
                  <Image
                    source={{ uri: img }}
                    style={s.thumb}
                    contentFit="cover"
                    transition={150}
                  />
                ) : null}
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {block.showPrice !== false && (
                    <View style={s.priceRow}>
                      <Text style={[s.price, { color: block.priceColor || colors.primary }]}>
                        R {price.toFixed(2)}
                      </Text>
                      {oldPrice ? (
                        <Text style={s.oldPrice}>R {oldPrice.toFixed(2)}</Text>
                      ) : null}
                    </View>
                  )}
                  {block.showRating !== false && p.averageRating > 0 && (
                    <Text style={s.rating}>
                      {"★".repeat(Math.round(p.averageRating))} {p.averageRating.toFixed(1)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={s.empty}>No products found</Text>
      )}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  list: { gap: 10 },
  item: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1f2937",
    lineHeight: 18,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  oldPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  rating: {
    fontSize: 11,
    color: "#f59e0b",
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    paddingVertical: 32,
  },
});
