import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import BlockWrapper from "./BlockWrapper";
import ProductCard from "@/components/ProductCard";
import { useBlockProducts } from "./useBlockProducts";
import { colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

function CountdownTimer({
  endDate,
  primaryColor = colors.primary,
}: {
  endDate: string;
  primaryColor?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View style={s.countdownRow}>
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Mins", value: timeLeft.minutes },
        { label: "Secs", value: timeLeft.seconds },
      ].map((item) => (
        <View
          key={item.label}
          style={[s.countdownBox, { backgroundColor: primaryColor }]}
        >
          <Text style={s.countdownVal}>{pad(item.value)}</Text>
          <Text style={s.countdownLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DealsOfTheDay({ block }: { block: any }) {
  const { data: products, isLoading } = useBlockProducts(
    block.productSource || "sale",
    { limit: block.productLimit || 4 }
  );

  return (
    <BlockWrapper block={block}>
      {block.showCountdown && block.dealsEndDate ? (
        <View style={{ marginBottom: 14 }}>
          <CountdownTimer
            endDate={block.dealsEndDate}
            primaryColor={block.primaryColor || colors.primary}
          />
        </View>
      ) : null}

      {isLoading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : products.length > 0 ? (
        <View style={s.grid}>
          {products.map((product: any) => (
            <View key={product._id} style={{ width: CARD_WIDTH }}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      ) : (
        <Text style={s.empty}>No deals available</Text>
      )}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  countdownRow: { flexDirection: "row", gap: 8 },
  countdownBox: {
    alignItems: "center",
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
  },
  countdownVal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  countdownLabel: {
    color: "#fff",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  loadingRow: { height: 180, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  empty: { textAlign: "center", color: colors.gray400, paddingVertical: 32 },
});
