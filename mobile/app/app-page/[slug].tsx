import { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { appPagesAPI } from "@/services/api";
import { colors } from "@/theme";
import AppPageRenderer from "@/components/apppageblocks/AppPageRenderer";
import { PageScrollContext } from "@/components/apppageblocks/PageScrollContext";
import BottomTabBar from "@/components/BottomTabBar";

// Renders pages authored in the mobile-only Page Builder (Admin -> Mobile
// App -> Page Builder). Deliberately separate from page/[slug].tsx, which
// bridges to the *website's* Craft.js-based Page Builder — different
// backend model, different route, no shared code between the two.
export default function AppPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);
  const [error, setError] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    appPagesAPI.getBySlug(slug)
      .then((res) => setPage(res.data?.data || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} title="Loading..." />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} title="Page" />
        <View style={s.center}>
          <Ionicons name="document-outline" size={48} color={colors.gray300} />
          <Text style={s.emptyText}>Page not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <Header router={router} title={page.title} />
      <PageScrollContext.Provider
        value={{
          scrollY,
          contentHeight,
          layoutHeight,
          scrollToTop: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
        }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          onContentSizeChange={(_, h) => setContentHeight(h)}
          onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
        >
          <AppPageRenderer blocks={page.blocks || []} />
        </ScrollView>
      </PageScrollContext.Provider>
      <BottomTabBar />
    </View>
  );
}

function Header({ router, title }: { router: any; title: string }) {
  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.gray800} />
      </Pressable>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: colors.gray400, marginTop: 12 },
});
