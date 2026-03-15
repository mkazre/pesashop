import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { categoriesAPI } from "@/services/api";
import { resolveImageUrl, colors } from "@/theme";

export default function CategoryCarousel({ block }: { block: any }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params: any = { limit: block.categoryLimit || 10 };
    if (block.categorySource === "top") params.sort = "-productCount";
    categoriesAPI
      .getAll(params)
      .then((res) => {
        const cats =
          res.data?.data?.categories || res.data?.data || res.data?.categories || [];
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [block.categorySource, block.categoryLimit]);

  return (
    <BlockWrapper block={block}>
      {loading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : categories.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => {
            const img = item.iconImage || item.image;
            const imgUrl = resolveImageUrl(img);
            return (
              <Pressable
                onPress={() =>
                  router.push(`/category/${item.slug || item._id}` as any)
                }
                style={s.catItem}
              >
                <View style={s.catIcon}>
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={s.catImg}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={s.catEmoji}>📦</Text>
                  )}
                </View>
                <Text style={s.catName} numberOfLines={2}>
                  {item.name}
                </Text>
                {block.showCategoryProductCount !== false &&
                item.productCount !== undefined ? (
                  <Text style={s.catCount}>{item.productCount} items</Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      ) : (
        <Text style={s.empty}>No categories found</Text>
      )}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  loadingRow: { height: 120, alignItems: "center", justifyContent: "center" },
  catItem: { alignItems: "center", width: 90 },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  catImg: { width: "100%", height: "100%" },
  catEmoji: { fontSize: 22 },
  catName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  catCount: { fontSize: 9, color: "#9ca3af", marginTop: 1 },
  empty: { textAlign: "center", color: "#9ca3af", paddingVertical: 24 },
});
