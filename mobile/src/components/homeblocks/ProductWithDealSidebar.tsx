import { useState, useEffect, useRef } from "react";
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
import ProductCard from "@/components/ProductCard";
import { useBlockProducts } from "./useBlockProducts";
import { resolveImageUrl, colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function CountdownTimer({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = new Date(endDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <View style={s.countdown}>
      {(["d", "h", "m", "s"] as const).map((k) => (
        <View key={k} style={s.countdownCell}>
          <Text style={s.countdownNum}>{String(remaining[k]).padStart(2, "0")}</Text>
          <Text style={s.countdownLabel}>{k === "d" ? "Days" : k === "h" ? "Hrs" : k === "m" ? "Min" : "Sec"}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProductWithDealSidebar({ block }: { block: any }) {
  const router = useRouter();

  const { data: products, isLoading } = useBlockProducts(
    block.productSource || "best-selling",
    { limit: block.productLimit || 10 }
  );

  const { data: dealProducts } = useBlockProducts(
    block.dealProductSource || "featured",
    { limit: 1, enabled: block.dealEnabled !== false }
  );

  const dealProduct = dealProducts?.[0];
  const dealImg = dealProduct
    ? resolveImageUrl(dealProduct.images?.[0]?.url || dealProduct.image || dealProduct.thumbnail)
    : null;

  return (
    <BlockWrapper block={block}>
      {/* Deal card shown on top on mobile */}
      {block.dealEnabled !== false && dealProduct && (
        <Pressable
          onPress={() => router.push(`/product/${dealProduct.slug || dealProduct._id}` as any)}
          style={s.dealCard}
        >
          {block.dealBadgeText ? (
            <View style={s.dealBadge}>
              <Text style={s.dealBadgeText}>{block.dealBadgeText}</Text>
            </View>
          ) : null}
          {dealImg ? (
            <Image source={{ uri: dealImg }} style={s.dealImg} contentFit="cover" transition={200} />
          ) : null}
          <Text style={s.dealTitle}>{block.dealTitle || "Special Offer"}</Text>
          <Text style={s.dealName} numberOfLines={2}>{dealProduct.name}</Text>
          <Text style={s.dealPrice}>
            R {(dealProduct.salePrice || dealProduct.regularPrice || 0).toFixed(2)}
          </Text>
          {block.showCountdown !== false && block.dealsEndDate && (
            <CountdownTimer endDate={block.dealsEndDate} />
          )}
        </Pressable>
      )}

      {/* Product carousel */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingVertical: 30 }} />
      ) : products.length > 0 ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={products}
          keyExtractor={(p: any) => p._id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={{ width: (SCREEN_WIDTH - 48) / 2 }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      ) : (
        <Text style={s.empty}>No products found</Text>
      )}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  dealCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: "center",
  },
  dealBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  dealBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  dealImg: { width: 140, height: 140, borderRadius: 8, marginBottom: 8 },
  dealTitle: { fontSize: 14, fontWeight: "700", color: "#1f2937", marginBottom: 2 },
  dealName: { fontSize: 12, color: "#6b7280", marginBottom: 4, textAlign: "center" },
  dealPrice: { fontSize: 18, fontWeight: "800", color: colors.primary, marginBottom: 8 },
  countdown: { flexDirection: "row", gap: 8 },
  countdownCell: { alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 40 },
  countdownNum: { fontSize: 16, fontWeight: "800", color: "#1f2937" },
  countdownLabel: { fontSize: 9, color: "#9ca3af", fontWeight: "500" },
  empty: { textAlign: "center", color: "#9ca3af", paddingVertical: 32 },
});
