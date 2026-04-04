import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import BottomTabBar from "@/components/BottomTabBar";
import { categoriesAPI } from "@/services/api";
import { resolveImageUrl, colors } from "@/theme";

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    categoriesAPI.getAll({ limit: 100, sort: "name" })
      .then((res) => {
        const cats = res.data?.data?.categories || res.data?.data || res.data?.categories || [];
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? categories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const renderItem = ({ item }: { item: any }) => {
    const imgUrl = resolveImageUrl(item.image || item.iconImage || item.bannerImage);
    return (
      <Pressable
        onPress={() => router.push(`/category/${item.slug || item._id}` as any)}
        style={s.card}
      >
        <View style={s.cardImageWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={s.cardImage} contentFit="cover" />
          ) : (
            <View style={[s.cardImage, s.cardImagePlaceholder]}>
              <Ionicons name="grid-outline" size={28} color={colors.gray300} />
            </View>
          )}
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{item.name}</Text>
          {item.description ? (
            <Text style={s.cardDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
          {item.productCount !== undefined ? (
            <Text style={s.cardCount}>{item.productCount} products</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
      </Pressable>
    );
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="All Categories" showBack />

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.gray400} style={{ marginLeft: 12 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} style={{ paddingHorizontal: 10 }}>
            <Ionicons name="close" size={16} color={colors.gray400} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="grid-outline" size={48} color={colors.gray200} />
          <Text style={s.emptyText}>No categories found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.gray100 }} />}
        />
      )}
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: colors.gray800 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: colors.gray400, marginTop: 12 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  cardImageWrap: { width: 60, height: 60, overflow: "hidden", borderRadius: 4, backgroundColor: colors.gray100 },
  cardImage: { width: 60, height: 60 },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.gray900 },
  cardDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  cardCount: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: "500" },
});
