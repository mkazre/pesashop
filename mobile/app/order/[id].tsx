import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/ScreenHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ordersAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  useEffect(() => {
    if (id) {
      ordersAPI.getOne(id).then((res) => setOrder(res.data?.data || res.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order) {
    return (
      <View style={od.screenWhite}>
        <ScreenHeader title="Order" showBack />
        <View style={od.center}>
          <Text style={{ color: colors.gray500 }}>Order not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={od.screen}>
      <ScreenHeader title={`Order #${order.orderNumber || order._id?.slice(-8)}`} showBack />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={od.statusSection}>
          <View style={od.statusIcon}>
            <Ionicons
              name={order.status === "delivered" ? "checkmark-circle" : order.status === "cancelled" ? "close-circle" : "time"}
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={od.statusText}>{order.status}</Text>
          <Text style={od.dateText}>
            Placed on {new Date(order.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>

        <View style={od.section}>
          <Text style={od.sectionTitle}>Items</Text>
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={[od.itemRow, i < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.gray50 }]}>
              <View style={{ flex: 1 }}>
                <Text style={od.itemName} numberOfLines={1}>{item.product?.name || "Product"}</Text>
                <Text style={od.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={od.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={od.totalRow}>
            <Text style={od.totalLabel}>Total</Text>
            <Text style={od.totalValue}>{formatPrice(order.total || 0)}</Text>
          </View>
        </View>

        {order.shippingAddress && (
          <View style={od.section}>
            <Text style={od.sectionTitle}>{order.deliveryMethod === "pickup" ? "Pickup Location" : "Delivery Address"}</Text>
            {order.deliveryMethod === "pickup" && order.pickupAddress ? (
              <>
                <Text style={od.addrName}>{order.pickupAddress.label}</Text>
                <Text style={od.addrDetail}>{order.pickupAddress.address}</Text>
              </>
            ) : (
              <>
                <Text style={od.addrName}>{order.shippingAddress.name}</Text>
                <Text style={od.addrDetail}>{order.shippingAddress.address}, {order.shippingAddress.city}</Text>
                <Text style={od.addrDetail}>{order.shippingAddress.postalCode} {order.shippingAddress.country}</Text>
              </>
            )}
          </View>
        )}

        <View style={[od.section, { marginBottom: 32 }]}>
          <Text style={od.sectionTitle}>Payment</Text>
          <Text style={od.addrName}>{order.paymentMethod?.replace("_", " ") || "N/A"}</Text>
          <Text style={[od.addrDetail, { marginTop: 2 }]}>Status: {order.paymentStatus || "Pending"}</Text>
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const od = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  screenWhite: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusSection: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 16, alignItems: "center" },
  statusIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statusText: { fontSize: 18, fontWeight: "700", color: colors.gray900, textTransform: "capitalize" },
  dateText: { fontSize: 12, color: colors.gray500, marginTop: 4 },
  section: { backgroundColor: colors.white, marginTop: 8, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  itemName: { fontSize: 14, color: colors.gray800 },
  itemQty: { fontSize: 12, color: colors.gray500 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: colors.gray800 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.gray200, marginTop: 8, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  totalValue: { fontSize: 16, fontWeight: "700", color: colors.primary },
  addrName: { fontSize: 14, color: colors.gray700, textTransform: "capitalize" },
  addrDetail: { fontSize: 12, color: colors.gray500 },
});
