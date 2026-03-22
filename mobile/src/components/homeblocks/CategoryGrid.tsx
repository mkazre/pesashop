import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import BlockWrapper from "./BlockWrapper";
import { resolveImageUrl, colors } from "@/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CategoryGrid({ block }: { block: any }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cols = 2; // always 2 cols on mobile

  useEffect(() => {
    fetch(
      `${API_URL}/api/categories?limit=${block.categoryLimit || 8}&sort=${
        block.categorySource === "top" ? "productCount" : "name"
      }`
    )
      .then((r) => r.json())
      .then((json) => {
        setCategories(
          json.data?.categories || json.data || json.categories || []
        );
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [block.categorySource, block.categoryLimit]);

  if (loading) {
    return (
      <BlockWrapper block={block}>
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 40 }} />
      </BlockWrapper>
    );
  }

  if (!categories.length) return null;

  const cardW = (SCREEN_WIDTH - 48) / cols;
  const cardStyle = block.cardStyle || "card";
  const imgH = parseInt(block.imageHeight) || 120;
  const radius = parseInt(block.cardBorderRadius) || 12;

  return (
    <BlockWrapper block={block}>
      <View style={s.grid}>
        {categories.map((cat: any) => {
          const imgUrl = resolveImageUrl(cat.image);
          return (
            <Pressable
              key={cat._id}
              onPress={() =>
                router.push(`/shop?category=${cat.slug || cat._id}` as any)
              }
              style={[
                s.card,
                {
                  width: cardW,
                  borderRadius: cardStyle === "circle" ? 999 : radius,
                },
                cardStyle !== "circle" && s.cardBorder,
              ]}
            >
              {block.showImage !== false && (
                <View
                  style={
                    cardStyle === "circle"
                      ? s.circleImg
                      : { height: imgH, borderTopLeftRadius: radius, borderTopRightRadius: radius, overflow: "hidden" }
                  }
                >
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={s.placeholder}>
                      <Text style={{ fontSize: 28 }}>📦</Text>
                    </View>
                  )}
                </View>
              )}
              <View
                style={[
                  cardStyle === "circle" ? s.circleLabel : s.label,
                ]}
              >
                <Text style={s.catName} numberOfLines={1}>
                  {cat.name}
                </Text>
                {block.showProductCount !== false && cat.productCount != null && (
                  <Text style={s.count}>
                    {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    overflow: "hidden",
  },
  cardBorder: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  circleImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 12,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  circleLabel: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    padding: 10,
  },
  catName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  count: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
});
