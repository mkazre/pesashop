import { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCartStore, useUIStore, useAuthStore, useCurrencyStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";
import PulsingArrows from "@/components/PulsingArrows";
import Toast from "react-native-toast-message";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 380);

export default function CartSidebar() {
  const { items, updateQuantity, removeItem, getCheckoutTotal, getLaybyeItems, getItemCount } = useCartStore();
  const { cartSidebarOpen, closeCartSidebar, openCheckoutDrawer } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cartSidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cartSidebarOpen]);

  const handleCheckout = () => {
    if (items.length === 0) {
      Toast.show({ type: "error", text1: "Your cart is empty" });
      return;
    }
    if (!isAuthenticated) {
      closeCartSidebar();
      router.push("/auth/login" as any);
      Toast.show({ type: "info", text1: "Please sign in to checkout" });
      return;
    }
    openCheckoutDrawer();
  };

  if (!cartSidebarOpen) return null;

  const subtotal = getCheckoutTotal();
  const hasLaybye = getLaybyeItems().length > 0;
  const itemCount = getItemCount();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeCartSidebar} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Shopping Cart ({itemCount})</Text>
          <Pressable onPress={closeCartSidebar} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={colors.gray700} />
          </Pressable>
        </View>

        {/* Items */}
        {items.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="cart-outline" size={48} color={colors.gray300} />
            <Text style={s.emptyText}>Your cart is empty</Text>
            <Pressable
              onPress={() => {
                closeCartSidebar();
                router.push("/shop" as any);
              }}
              style={s.shopBtn}
            >
              <Text style={s.shopBtnText}>Continue Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={s.itemsList} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => {
              const imgUrl =
                resolveImageUrl(item.product.images?.[0]) ||
                resolveImageUrl(item.product.image);
              const price =
                item.product.salePrice || item.product.regularPrice;
              const displayPrice = item.laybye ? (item.laybye.deposit || 0) : price;

              return (
                <View key={`${item.product._id}-${index}`} style={s.item}>
                  <Image
                    source={{ uri: imgUrl }}
                    style={s.itemImg}
                    contentFit="cover"
                  />
                  <View style={s.itemInfo}>
                    <Text style={s.itemName} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    {item.laybye && (
                      <View style={s.laybyTag}>
                        <Ionicons name="time-outline" size={10} color={colors.amber500} />
                        <Text style={s.laybyTagText}>Layby deposit</Text>
                      </View>
                    )}
                    <Text style={s.itemPrice}>
                      {formatPrice(displayPrice)}
                    </Text>
                    <View style={s.qtyRow}>
                      <Pressable
                        onPress={() => updateQuantity(index, item.quantity - 1)}
                        style={s.qtyBtn}
                      >
                        <Ionicons name="remove" size={14} color={colors.gray700} />
                      </Pressable>
                      <Text style={s.qtyVal}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => updateQuantity(index, item.quantity + 1)}
                        style={s.qtyBtn}
                      >
                        <Ionicons name="add" size={14} color={colors.gray700} />
                      </Pressable>
                      <Pressable
                        onPress={() => removeItem(index)}
                        style={s.removeBtn}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.red500} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <View style={s.footer}>
            {hasLaybye && (
              <View style={s.laybyeNoteRow}>
                <Ionicons name="information-circle-outline" size={12} color={colors.amber500} />
                <Text style={s.laybyeNoteText}>Includes laybye deposits</Text>
              </View>
            )}
            <View style={s.subtotalRow}>
              <Text style={s.subtotalLabel}>{hasLaybye ? 'Total Due Now' : 'Subtotal'}</Text>
              <Text style={s.subtotalVal}>{formatPrice(subtotal)}</Text>
            </View>
            <Pressable onPress={handleCheckout} style={s.checkoutBtn}>
              <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
              <PulsingArrows color="#fff" size={14} count={3} />
            </Pressable>
            <Pressable
              onPress={() => {
                closeCartSidebar();
                router.push("/cart" as any);
              }}
              style={s.viewCartBtn}
            >
              <Text style={s.viewCartBtnText}>View Full Cart</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 40,
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#fff",
    zIndex: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: -4, height: 0 },
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingTop: 50,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray500,
    marginTop: 12,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  shopBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  itemsList: { flex: 1 },
  item: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: 10,
  },
  itemImg: { width: 64, height: 64, backgroundColor: colors.gray100 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "500", color: colors.gray800, marginBottom: 2 },
  laybyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 2,
  },
  laybyTagText: { fontSize: 10, color: colors.amber500, fontWeight: "600" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#dc2626", marginBottom: 6 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyVal: { fontSize: 13, fontWeight: "600", color: colors.gray800, minWidth: 20, textAlign: "center" },
  removeBtn: {
    marginLeft: "auto",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: 16,
    paddingBottom: 34,
  },
  laybyeNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  laybyeNoteText: { fontSize: 10, color: colors.amber500, fontWeight: "500" },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subtotalLabel: { fontSize: 14, color: colors.gray600 },
  subtotalVal: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  checkoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    marginBottom: 8,
  },
  checkoutBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  viewCartBtn: {
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: "center",
    paddingVertical: 10,
  },
  viewCartBtnText: { fontSize: 13, fontWeight: "600", color: colors.gray700 },
});
