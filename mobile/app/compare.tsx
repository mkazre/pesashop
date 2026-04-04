import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCompareStore, useCurrencyStore } from "@/store";
import { resolveImageUrl, colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ATTRIBUTES = [
  { key: "price",        label: "Price" },
  { key: "stock",        label: "Stock" },
  { key: "sku",          label: "SKU" },
  { key: "brand",        label: "Brand" },
  { key: "weight",       label: "Weight" },
  { key: "averageRating",label: "Rating" },
  { key: "reviewCount",  label: "Reviews" },
];

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, removeProduct, clearAll } = useCompareStore();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const colWidth = products.length > 0 ? Math.min((SCREEN_WIDTH - 80) / products.length, 160) : 160;

  const getValue = (product: any, key: string) => {
    if (key === "price") return formatPrice(product.salePrice || product.regularPrice);
    if (key === "stock") return product.stock > 0 ? `${product.stock} in stock` : "Out of stock";
    if (key === "averageRating") return product.averageRating ? `${product.averageRating.toFixed(1)} ★` : "—";
    if (key === "reviewCount") return product.reviewCount ? `${product.reviewCount}` : "0";
    return product[key] || "—";
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Compare Products</Text>
        {products.length > 0 && (
          <Pressable onPress={clearAll} style={s.clearBtn}>
            <Text style={s.clearBtnText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {products.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="git-compare-outline" size={56} color={colors.gray200} />
          <Text style={s.emptyTitle}>Nothing to compare</Text>
          <Text style={s.emptySub}>Add products using the compare icon on product cards</Text>
          <Pressable onPress={() => router.push("/(tabs)/shop" as any)} style={s.shopBtn}>
            <Text style={s.shopBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Product images + name row */}
              <View style={s.row}>
                <View style={s.labelCol}>
                  <Text style={s.labelColText}>Product</Text>
                </View>
                {products.map((p) => (
                  <View key={p._id} style={[s.col, { width: colWidth }]}>
                    <Pressable
                      onPress={() => removeProduct(p._id)}
                      style={s.removeBtn}
                    >
                      <Ionicons name="close" size={14} color={colors.gray500} />
                    </Pressable>
                    <Pressable onPress={() => router.push(`/product/${p.slug || p._id}` as any)}>
                      <Image
                        source={{ uri: resolveImageUrl(p.images?.[0] || p.image) }}
                        style={s.productImg}
                        contentFit="cover"
                      />
                      <Text style={s.productName} numberOfLines={2}>{p.name}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Attribute rows */}
              {ATTRIBUTES.map((attr, i) => (
                <View key={attr.key} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowOdd]}>
                  <View style={s.labelCol}>
                    <Text style={s.attrLabel}>{attr.label}</Text>
                  </View>
                  {products.map((p) => {
                    const val = getValue(p, attr.key);
                    return (
                      <View key={p._id} style={[s.col, { width: colWidth }]}>
                        <Text style={[
                          s.attrValue,
                          attr.key === "price" && { color: "#dc2626", fontWeight: "700" },
                          attr.key === "stock" && { color: p.stock > 0 ? colors.green600 : colors.red500 },
                        ]}>
                          {val}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Specs from product attributes */}
              {products.some((p) => p.specifications?.length > 0) && (
                <View style={s.row}>
                  <View style={s.labelCol}><Text style={s.attrLabel}>Specifications</Text></View>
                  {products.map((p) => (
                    <View key={p._id} style={[s.col, { width: colWidth }]}>
                      {(p.specifications || []).slice(0, 5).map((spec: any, i: number) => (
                        <Text key={i} style={s.specText} numberOfLines={1}>
                          <Text style={{ fontWeight: "600" }}>{spec.name}:</Text> {spec.value}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Add to cart row */}
              <View style={s.row}>
                <View style={s.labelCol} />
                {products.map((p) => (
                  <View key={p._id} style={[s.col, { width: colWidth }]}>
                    <Pressable
                      onPress={() => router.push(`/product/${p.slug || p._id}` as any)}
                      style={s.viewBtn}
                    >
                      <Text style={s.viewBtnText}>View Product</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { fontSize: 13, color: colors.red500, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.gray700, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.gray400, textAlign: "center", marginTop: 8 },
  shopBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 },
  shopBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowEven: { backgroundColor: colors.white },
  rowOdd: { backgroundColor: colors.gray50 },
  labelCol: { width: 80, padding: 10, justifyContent: "center" },
  labelColText: { fontSize: 12, fontWeight: "700", color: colors.gray700 },
  col: { padding: 10, borderLeftWidth: 1, borderLeftColor: colors.gray100, alignItems: "center" },
  removeBtn: { position: "absolute", top: 4, right: 4, zIndex: 10, width: 20, height: 20, backgroundColor: colors.gray100, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productImg: { width: "100%", height: 100, marginBottom: 6 },
  productName: { fontSize: 11, fontWeight: "600", color: colors.gray800, textAlign: "center", lineHeight: 15 },
  attrLabel: { fontSize: 11, fontWeight: "600", color: colors.gray600 },
  attrValue: { fontSize: 12, color: colors.gray800, textAlign: "center" },
  specText: { fontSize: 10, color: colors.gray600, marginBottom: 2 },
  viewBtn: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 10, width: "100%" },
  viewBtnText: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
});
