import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
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

export default function BlogCarousel({ block }: { block: any }) {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${API_URL}/api/blog?limit=${block.blogLimit || 6}&sort=${
        block.blogSource === "popular" ? "-views" : "-createdAt"
      }`
    )
      .then((r) => r.json())
      .then((json) => {
        setPosts(json.data?.posts || json.data || json.posts || []);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [block.blogSource, block.blogLimit]);

  if (loading) {
    return (
      <BlockWrapper block={block}>
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 40 }} />
      </BlockWrapper>
    );
  }

  if (!posts.length) return null;

  const cardW = SCREEN_WIDTH * 0.72;
  const radius = parseInt(block.cardBorderRadius) || 12;

  return (
    <BlockWrapper block={block}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={posts}
        keyExtractor={(p: any) => p._id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item: post }) => {
          const img = resolveImageUrl(post.featuredImage || post.image);
          return (
            <Pressable
              onPress={() => router.push(`/blog/${post.slug || post._id}` as any)}
              style={[s.card, { width: cardW, borderRadius: radius }]}
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  style={[s.cardImg, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={[
                    s.cardImg,
                    {
                      backgroundColor: "#f3f4f6",
                      borderTopLeftRadius: radius,
                      borderTopRightRadius: radius,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>📰</Text>
                </View>
              )}
              <View style={s.cardBody}>
                {block.showDate !== false && post.createdAt && (
                  <Text style={s.date}>
                    {new Date(post.createdAt).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                )}
                <Text style={s.title} numberOfLines={2}>
                  {post.title}
                </Text>
                {block.showExcerpt !== false && post.excerpt ? (
                  <Text style={s.excerpt} numberOfLines={2}>
                    {post.excerpt}
                  </Text>
                ) : null}
                {block.showReadMore !== false && (
                  <Text
                    style={[
                      s.readMore,
                      { color: block.linkColor || block.primaryColor || colors.primary },
                    ]}
                  >
                    Read More →
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: 150,
  },
  cardBody: {
    padding: 12,
  },
  date: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 19,
    marginBottom: 4,
  },
  excerpt: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
    marginBottom: 6,
  },
  readMore: {
    fontSize: 12,
    fontWeight: "600",
  },
});
