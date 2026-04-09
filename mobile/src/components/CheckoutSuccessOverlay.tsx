/**
 * CheckoutSuccessOverlay
 * Full-screen celebration animation shown after a successful order.
 * Confetti burst + animated order confirmed message + total PESA coins earned.
 *
 * Usage:
 *   import { useCheckoutSuccessOverlay, CheckoutSuccessOverlay } from "@/components/CheckoutSuccessOverlay";
 *   const { show } = useCheckoutSuccessOverlay();
 *   show({ totalPoints, cashValue, coinLabel });
 */
import { useEffect, useRef, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { create } from "zustand";
import { colors } from "@/theme";
import { useCurrencyStore } from "@/store";

const { width: W } = Dimensions.get("window");

// ─── Store ────────────────────────────────────────────────────────────────────

interface CheckoutOverlayState {
  visible: boolean;
  totalPoints: number;
  cashValue: number;
  coinLabel: string;
  show: (opts: { totalPoints: number; cashValue: number; coinLabel?: string }) => void;
  hide: () => void;
}

export const useCheckoutSuccessOverlay = create<CheckoutOverlayState>((set) => ({
  visible: false,
  totalPoints: 0,
  cashValue: 0,
  coinLabel: "PESA Coins",
  show: ({ totalPoints, cashValue, coinLabel = "PESA Coins" }) =>
    set({ visible: true, totalPoints, cashValue, coinLabel }),
  hide: () => set({ visible: false }),
}));

// ─── Confetti particle ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#0F604B", "#E8A838", "#22c55e", "#6366f1", "#ec4899", "#f97316"];
const PARTICLE_COUNT = 26;

function Particle({ index }: { index: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = (index * 40) + Math.random() * 120;
    const xDrift = (Math.random() - 0.5) * W * 1.2;
    const duration = 1200 + Math.random() * 600;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 420 + Math.random() * 160, duration, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: xDrift, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: duration * 0.6, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${360 + Math.random() * 360}deg`] });
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 8;
  const isCircle = index % 3 === 0;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: W / 2 + (Math.random() - 0.5) * 80,
        width: isCircle ? size : size * 1.6,
        height: isCircle ? size : size * 0.6,
        borderRadius: isCircle ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
      }}
    />
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function CheckoutSuccessOverlay() {
  const { visible, totalPoints, cashValue, coinLabel, hide } = useCheckoutSuccessOverlay();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const checkRing = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const coinsOpacity = useRef(new Animated.Value(0)).current;
  const coinsBounce = useRef(new Animated.Value(0.5)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const runExit = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => hide());
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Reset
    [backdropOpacity, cardScale, cardOpacity, checkRing, textSlide, textOpacity, coinsOpacity, coinsBounce, pulse]
      .forEach((a, i) => a.setValue([0, 0.7, 0, 0, 30, 0, 0, 0.5, 1][i]));

    Animated.sequence([
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0.7, duration: 280, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.spring(checkRing, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(textSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(coinsBounce, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(coinsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse the check icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    const t = setTimeout(runExit, 3600);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  const checkScale = checkRing.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={runExit}>
      {/* Dark backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />

      {/* Confetti */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <Particle key={i} index={i} />
        ))}
      </View>

      <View style={s.centerer} pointerEvents="none">
        <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          {/* Check icon */}
          <Animated.View style={[s.checkOuter, { transform: [{ scale: checkScale }] }]}>
            <Animated.View style={[s.checkInner, { transform: [{ scale: pulse }] }]}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </Animated.View>
          </Animated.View>

          {/* Text */}
          <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textSlide }], alignItems: "center" }}>
            <Text style={s.heading}>Order Confirmed! 🎉</Text>
            <Text style={s.sub}>Thank you for shopping with us</Text>
          </Animated.View>

          {/* Coins */}
          {totalPoints > 0 && (
            <Animated.View
              style={[s.coinsBox, { opacity: coinsOpacity, transform: [{ scale: coinsBounce }] }]}
            >
              <Text style={s.coinEmoji}>🪙</Text>
              <View>
                <Text style={s.coinsEarned}>
                  +{totalPoints} {coinLabel}
                </Text>
                <Text style={s.coinsWorth}>Worth {formatPrice(cashValue)} in rewards</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centerer: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: Math.min(W - 48, 320),
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 24,
  },
  checkOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.green600 + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  checkInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green600,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.green600,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  heading: { fontSize: 22, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  sub: { fontSize: 14, color: colors.gray500, textAlign: "center" },
  coinsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8E6",
    borderWidth: 1.5,
    borderColor: "#E8A838",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: "100%",
    marginTop: 8,
  },
  coinEmoji: { fontSize: 32 },
  coinsEarned: { fontSize: 17, fontWeight: "800", color: "#C97D0E" },
  coinsWorth: { fontSize: 12, color: "#B8860B", marginTop: 2 },
});
