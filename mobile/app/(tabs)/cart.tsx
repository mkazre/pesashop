import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "@/components/EmptyState";
import PulsingArrows from "@/components/PulsingArrows";
import BottomTabBar from "@/components/BottomTabBar";
import { useCartStore, useCurrencyStore, useUIStore } from "@/store";
import { settingsAPI } from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getCheckoutTotal = useCartStore((s) => s.getCheckoutTotal);
  const getLaybyeItems = useCartStore((s) => s.getLaybyeItems);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const { openCheckoutDrawer } = useUIStore();
  const [freeShippingMin, setFreeShippingMin] = useState(0);

  useEffect(() => {
    settingsAPI.getPublic().then((res) => {
      const d = res.data?.data || {};
      const fs = d?.freeShipping || d?.shipping?.freeShipping;
      if (fs?.enabled && fs.minimumOrderAmount > 0) {
        setFreeShippingMin(fs.minimumOrderAmount);
      }
    }).catch(() => {});
  }, []);

  const subtotal = getCheckoutTotal();
  const freeShipPct = freeShippingMin > 0 ? Math.min((subtotal / freeShippingMin) * 100, 100) : 0;
  const freeShipRemaining = Math.max(freeShippingMin - subtotal, 0);

  if (items.length === 0) {
    return (
      <View style={[cs.screenWhite, { paddingTop: insets.top }]}>
        <EmptyState icon="cart-outline" title="Your cart is empty" message="Add some products to get started" actionLabel="Start Shopping" onAction={() => router.push("/shop" as any)} />
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={[cs.screen, { paddingTop: insets.top }]}>
      <View style={cs.header}>
        <Text style={cs.title}>Cart ({getItemCount()})</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Free Shipping Progress Bar */}
        {freeShippingMin > 0 && (
          <View style={cs.freeShipWrap}>
            {freeShipPct >= 100 ? (
              <View style={cs.freeShipRow}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={[cs.freeShipText, { color: "#16a34a" }]}>🎉 You qualify for FREE shipping!</Text>
              </View>
            ) : (
              <>
                <View style={cs.freeShipRow}>
                  <Ionicons name="car-outline" size={16} color={colors.primary} />
                  <Text style={cs.freeShipText}>
                    Add <Text style={{ fontWeight: "700" }}>{formatPrice(freeShipRemaining)}</Text> more for FREE shipping!
                  </Text>
                </View>
                <View style={cs.freeShipTrack}>
                  <View style={[cs.freeShipFill, { width: `${freeShipPct}%` as any }]} />
                </View>
              </>
            )}
          </View>
        )}

        {items.map((item, index) => {
          const imageUrl = resolveImageUrl(item.product.images?.[0]) || resolveImageUrl(item.product.image);
          const price = item.product.salePrice || item.product.regularPrice;
          return (
            <View key={`${item.product._id}-${index}`} style={cs.cartItem}>
              <Image source={{ uri: imageUrl }} style={cs.cartImg} contentFit="cover" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={cs.itemName} numberOfLines={2}>{item.product.name}</Text>
                {item.variant && <Text style={cs.variant}>{Object.values(item.variant).join(" / ")}</Text>}
                {item.laybye ? (
                  <>
                    <Text style={cs.itemPrice}>{formatPrice(item.laybye.deposit || 0)}</Text>
                    <View style={cs.laybyeRow}>
                      <Ionicons name="calendar-outline" size={10} color={colors.amber500} />
                      <Text style={cs.laybyeText}>Laybye deposit</Text>
                      <Text style={cs.laybyeFullPrice}>(Full: {formatPrice(price)})</Text>
                    </View>
                  </>
                ) : (
                  <Text style={cs.itemPrice}>{formatPrice(price)}</Text>
                )}
                <View style={cs.qtyRow}>
                  <Pressable onPress={() => updateQuantity(index, item.quantity - 1)} style={cs.qtyBtn}>
                    <Ionicons name="remove" size={14} color={colors.gray700} />
                  </Pressable>
                  <Text style={cs.qtyText}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQuantity(index, item.quantity + 1)} style={cs.qtyBtn}>
                    <Ionicons name="add" size={14} color={colors.gray700} />
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => removeItem(index)} style={cs.deleteBtn}>
                    <Ionicons name="trash-outline" size={14} color={colors.red500} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={[cs.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {getLaybyeItems().length > 0 && (
          <View style={cs.laybyeNoteRow}>
            <Ionicons name="information-circle-outline" size={14} color={colors.amber500} />
            <Text style={cs.laybyeNote}>Total includes laybye deposits only</Text>
          </View>
        )}
        <View style={cs.totalRow}>
          <Text style={cs.totalLabel}>Total Due Now</Text>
          <Text style={cs.totalValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Pressable onPress={() => openCheckoutDrawer()} style={cs.checkoutBtn}>
          <Text style={cs.checkoutText}>Proceed to Checkout</Text>
          <PulsingArrows color="#fff" size={18} count={3} />
        </Pressable>
      </View>
      <BottomTabBar />
    </View>
  );
}

const cs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  screenWhite: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900 },
  freeShipWrap: { backgroundColor: "#f0fdf4", marginHorizontal: 16, marginTop: 12, padding: 12, borderWidth: 1, borderColor: "#bbf7d0" },
  freeShipRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  freeShipText: { fontSize: 13, color: colors.gray700, flex: 1 },
  freeShipTrack: { height: 6, backgroundColor: "#d1fae5", borderRadius: 3, overflow: "hidden" },
  freeShipFill: { height: 6, backgroundColor: "#16a34a", borderRadius: 3 },
  cartItem: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, borderRadius: 0, padding: 12, flexDirection: "row", borderWidth: 1, borderColor: colors.gray100 },
  cartImg: { width: 80, height: 80, borderRadius: 0 },
  itemName: { fontSize: 14, fontWeight: "600", color: colors.gray800 },
  variant: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 4 },
  laybyeRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  laybyeText: { fontSize: 10, color: colors.amber500, marginLeft: 4, fontWeight: "600" },
  laybyeFullPrice: { fontSize: 10, color: colors.gray400, marginLeft: 4 },
  laybyeNoteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, backgroundColor: "#fffbeb", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  laybyeNote: { fontSize: 11, color: colors.amber500, fontWeight: "500" },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 0, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: "600", color: colors.gray800 },
  deleteBtn: { width: 28, height: 28, borderRadius: 0, backgroundColor: colors.red50, alignItems: "center", justifyContent: "center" },
  bottomBar: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, paddingHorizontal: 16, paddingTop: 12 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontSize: 14, color: colors.gray500 },
  totalValue: { fontSize: 20, fontWeight: "700", color: colors.gray900 },
  checkoutBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  checkoutText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
