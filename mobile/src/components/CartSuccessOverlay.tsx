/**
 * CartSuccessOverlay
 * Displays a full-screen animated overlay when a product is added to cart.
 * Shows animated PESA Coins counter + monetary equivalent.
 *
 * Usage:
 *   import { useCartSuccessOverlay, CartSuccessOverlay } from "@/components/CartSuccessOverlay";
 *
 *   // In root layout: <CartSuccessOverlay />
 *   // When adding to cart:
 *   const { show } = useCartSuccessOverlay();
 *   show({ product, points, cashValue, coinLabel });
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { create } from "zustand";
import { resolveImageUrl, colors } from "@/theme";
import { useCurrencyStore } from "@/store";

const { width: W, height: H } = Dimensions.get("window");

// ─── Store ────────────────────────────────────────────────────────────────────

interface OverlayState {
  visible: boolean;
  product: any;
  points: number;
  cashValue: number;
  coinLabel: string;
  show: (opts: { product: any; points: number; cashValue: number; coinLabel?: string }) => void;
  hide: () => void;
}

export const useCartSuccessOverlay = create<OverlayState>((set) => ({
  visible: false,
  product: null,
  points: 0,
  cashValue: 0,
  coinLabel: "PESA Coins",
  show: ({ product, points, cashValue, coinLabel = "PESA Coins" }) =>
    set({ visible: true, product, points, cashValue, coinLabel }),
  hide: () => set({ visible: false, product: null }),
}));

// ─── Animated counter hook ────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - pct, 3);
      setValue(Math.round(ease * target));
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export function CartSuccessOverlay() {
  const { visible, product, points, cashValue, coinLabel, hide } = useCartSuccessOverlay();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  // Animations
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.75)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const coinsBounce = useRef(new Animated.Value(0.6)).current;
  const coinsOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Counter
  const displayPoints = useCountUp(visible ? points : 0, 1200);

  const runEnter = useCallback(() => {
    // Reset
    backdropOpacity.setValue(0);
    cardScale.setValue(0.75);
    cardOpacity.setValue(0);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    coinsBounce.setValue(0.6);
    coinsOpacity.setValue(0);
    shimmer.setValue(0);

    Animated.sequence([
      // 1. Backdrop + card fade in
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0.6, duration: 220, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      // 2. Check icon pop
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      // 3. Coins bounce in
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(coinsBounce, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(coinsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    // Shimmer loop on coins
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Auto-dismiss after 2.8s
    const t = setTimeout(() => runExit(), 2800);
    return () => clearTimeout(t);
  }, []);

  const runExit = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.88, duration: 200, useNativeDriver: true }),
    ]).start(() => hide());
  }, []);

  useEffect(() => {
    if (visible) {
      const cleanup = runEnter();
      return cleanup;
    }
  }, [visible]);

  if (!visible && !product) return null;

  const imgUri = resolveImageUrl(product?.images?.[0]) || resolveImageUrl(product?.image);
  const coinsGold = "#E8A838";
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={runExit}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />

      <View style={s.centerer} pointerEvents="box-none">
        <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          {/* Product image */}
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={s.productImg} contentFit="cover" />
          ) : (
            <View style={[s.productImg, { backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="cube-outline" size={40} color={colors.gray300} />
            </View>
          )}

          {/* Check circle */}
          <Animated.View
            style={[
              s.checkCircle,
              { opacity: checkOpacity, transform: [{ scale: checkScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={28} color="#fff" />
          </Animated.View>

          {/* Product name */}
          <Text style={s.productName} numberOfLines={2}>
            {product?.name || "Item"}
          </Text>
          <Text style={s.addedLabel}>Added to cart!</Text>

          {/* PESA Coins block */}
          {points > 0 && (
            <Animated.View
              style={[
                s.coinsBlock,
                {
                  opacity: coinsOpacity,
                  transform: [{ scale: coinsBounce }],
                },
              ]}
            >
              <Animated.Text style={[s.coinEmoji, { opacity: shimmerOpacity }]}>🪙</Animated.Text>
              <View style={s.coinsTextCol}>
                <Animated.Text style={[s.coinsCount, { opacity: shimmerOpacity }]}>
                  +{displayPoints}
                </Animated.Text>
                <Text style={s.coinsLabel}>{coinLabel}</Text>
              </View>
              <View style={s.coinsDivider} />
              <View style={s.coinsValueCol}>
                <Text style={s.coinsValueAmt}>{formatPrice(cashValue)}</Text>
                <Text style={s.coinsValueLabel}>cash value</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centerer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: Math.min(W - 48, 320),
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  productImg: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkCircle: {
    position: "absolute",
    top: 80,
    right: W / 2 - 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green600,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: colors.green600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    marginRight: -(W / 2 - 24) + (Math.min(W - 48, 320) / 2) - 20,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray900,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  addedLabel: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: 16,
  },
  coinsBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E6",
    borderWidth: 1.5,
    borderColor: "#E8A838",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    width: "100%",
  },
  coinEmoji: { fontSize: 28 },
  coinsTextCol: { alignItems: "flex-start", minWidth: 64 },
  coinsCount: {
    fontSize: 26,
    fontWeight: "900",
    color: "#C97D0E",
    letterSpacing: -0.5,
  },
  coinsLabel: { fontSize: 10, color: "#B8860B", fontWeight: "600", letterSpacing: 0.5 },
  coinsDivider: { width: 1, height: 36, backgroundColor: "#E8A838" + "60" },
  coinsValueCol: { flex: 1, alignItems: "center" },
  coinsValueAmt: { fontSize: 16, fontWeight: "800", color: "#C97D0E" },
  coinsValueLabel: { fontSize: 10, color: "#B8860B", fontWeight: "500" },
});
