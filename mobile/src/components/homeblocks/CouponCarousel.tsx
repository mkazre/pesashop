import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import BlockWrapper from "./BlockWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CouponCarousel({ block }: { block: any }) {
  const coupons = block.coupons || [];
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const copyCode = useCallback((code: string, i: number) => {
    Alert.alert("Coupon Code", code, [{ text: "OK" }]);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(-1), 2000);
  }, []);

  if (!coupons.length) return null;

  return (
    <BlockWrapper block={block}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={coupons}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item: coupon, index }) => (
          <View
            style={[
              s.card,
              {
                backgroundColor: coupon.bgColor || "#0F604B",
                width: SCREEN_WIDTH * 0.7,
              },
            ]}
          >
            <Text
              style={[s.title, { color: coupon.textColor || "#fff" }]}
              numberOfLines={1}
            >
              {coupon.title}
            </Text>
            {coupon.description ? (
              <Text
                style={[s.desc, { color: coupon.textColor || "#fff" }]}
                numberOfLines={2}
              >
                {coupon.description}
              </Text>
            ) : null}
            {coupon.validText ? (
              <Text style={[s.valid, { color: coupon.textColor || "#fff" }]}>
                {coupon.validText}
              </Text>
            ) : null}
            {coupon.code ? (
              <View style={s.codeRow}>
                <Text style={[s.code, { color: coupon.textColor || "#fff" }]}>
                  {coupon.code}
                </Text>
                <Pressable
                  onPress={() => copyCode(coupon.code, index)}
                  style={s.copyBtn}
                >
                  <Text style={[s.copyText, { color: coupon.textColor || "#fff" }]}>
                    {copiedIndex === index ? "Copied!" : "Copy"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  desc: { fontSize: 13, opacity: 0.9, marginBottom: 2 },
  valid: { fontSize: 11, opacity: 0.7, marginBottom: 10 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto" as any },
  code: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
  copyBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyText: { fontSize: 12, fontWeight: "600" },
});
