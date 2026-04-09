import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { settingsAPI } from "@/services/api";
import { useCartStore, useCurrencyStore } from "@/store";
import { colors } from "@/theme";

/**
 * Animated free-shipping progress bar.
 * Shows how much more the customer needs to spend to unlock free shipping,
 * based on current cart subtotal + optionally an extra amount (e.g. product price × qty).
 *
 * Props:
 *   extraAmount  – additional spend to account for (e.g. current product price × qty)
 */
export default function FreeShippingBar({ extraAmount = 0 }: { extraAmount?: number }) {
  const [threshold, setThreshold] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const cartItems = useCartStore((s) => s.items);
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const subtotal =
    cartItems.reduce(
      (sum: number, i: any) =>
        sum + (i.product?.salePrice || i.product?.regularPrice || i.price || 0) * (i.quantity || 1),
      0
    ) + extraAmount;

  useEffect(() => {
    settingsAPI.getPublic()
      .then((res) => {
        const d = res.data?.data || res.data;
        const fs = d?.freeShipping || d?.shipping?.freeShipping;
        if (fs?.enabled && fs?.minimumOrderAmount > 0) {
          setThreshold(fs.minimumOrderAmount);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (threshold <= 0) return;
    const pct = Math.min(1, subtotal / threshold);
    Animated.spring(progress, {
      toValue: pct,
      friction: 7,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [subtotal, threshold]);

  if (!loaded || threshold <= 0) return null;

  const remaining = threshold - subtotal;
  const unlocked = remaining <= 0;

  return (
    <View style={s.wrap}>
      {/* Header row */}
      <View style={s.row}>
        <Ionicons
          name={unlocked ? "checkmark-circle" : "car-outline"}
          size={14}
          color={unlocked ? colors.green600 : colors.primary}
        />
        {unlocked ? (
          <Text style={[s.label, { color: colors.green600 }]}>
            You've unlocked <Text style={s.bold}>FREE Delivery!</Text> 🎉
          </Text>
        ) : (
          <Text style={s.label}>
            Add{" "}
            <Text style={s.bold}>{formatPrice(remaining)}</Text>
            {" "}more to get{" "}
            <Text style={s.bold}>FREE Delivery</Text>
          </Text>
        )}
      </View>

      {/* Progress track */}
      <View style={s.track}>
        <Animated.View
          style={[
            s.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: unlocked ? colors.green600 : colors.primary,
            },
          ]}
        />
        {/* Truck emoji that rides the bar */}
        <Animated.View
          style={[
            s.truckWrap,
            {
              left: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["-2%", "96%"],
              }),
            },
          ]}
        >
          <Text style={s.truck}>{unlocked ? "✅" : "🚚"}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + "30",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 17 },
  bold: { fontWeight: "700" },
  track: {
    height: 7,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: "visible",
    position: "relative",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 7,
    borderRadius: 4,
  },
  truckWrap: {
    position: "absolute",
    top: -7,
  },
  truck: { fontSize: 14 },
});
