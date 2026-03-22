import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { useBlockProducts } from "./useBlockProducts";
import { resolveImageUrl, colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ColumnSection({ column }: { column: any }) {
  const router = useRouter();
  const { data: products, isLoading } = useBlockProducts(column.source, {
    categoryId: column.categoryId,
    limit: column.limit || 3,
  });

  return (
    <View style={s.column}>
      <Text style={s.colTitle}>{column.title || "Products"}</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
      ) : (
        products.map((p: any) => {
          const img = resolveImageUrl(
            p.images?.[0]?.url || p.image || p.thumbnail
          );
          const price = p.salePrice || p.regularPrice || 0;
          return (
            <Pressable
              key={p._id}
              onPress={() => router.push(`/product/${p.slug || p._id}` as any)}
              style={s.item}
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  style={s.thumb}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={[s.thumb, { backgroundColor: "#f3f4f6" }]} />
              )}
              <View style={s.itemInfo}>
                <Text style={s.itemName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={s.itemPrice}>R {price.toFixed(2)}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

export default function ProductColumnsGrid({ block }: { block: any }) {
  const columns = block.columns || [];
  if (!columns.length) return null;

  // On mobile, show columns stacked vertically (2 per row)
  return (
    <BlockWrapper block={block}>
      <View style={s.grid}>
        {columns.map((col: any, i: number) => (
          <View key={i} style={{ width: (SCREEN_WIDTH - 48) / 2 }}>
            <ColumnSection column={col} />
          </View>
        ))}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  column: {
    gap: 8,
  },
  colTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 6,
  },
  item: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
});
