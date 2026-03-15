import { View, Text, FlatList, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";
import { useWishlistStore } from "@/store";
import { colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useWishlistStore((s) => s.items);

  if (items.length === 0) {
    return (
      <View style={[ws.screenWhite, { paddingTop: insets.top }]}>
        <View style={ws.header}>
          <Text style={ws.title}>Wishlist</Text>
        </View>
        <EmptyState icon="heart-outline" title="Your wishlist is empty" message="Save products you love for later" actionLabel="Browse Products" onAction={() => router.push("/shop" as any)} />
      </View>
    );
  }

  return (
    <View style={[ws.screen, { paddingTop: insets.top }]}>
      <View style={ws.header}>
        <Text style={ws.title}>Wishlist ({items.length})</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item: any) => item._id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
        contentContainerStyle={{ paddingTop: 12 }}
        renderItem={({ item }: any) => (
          <View style={{ width: (SCREEN_WIDTH - 44) / 2 }}>
            <ProductCard product={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const ws = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  screenWhite: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900 },
});
