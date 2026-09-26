import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore, useCartStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";
import { resolveMenuLink } from "@/utils/resolveLink";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
const STORAGE_KEY = "pesa_popups_seen_app";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

const getSeenData = async (): Promise<Record<string, any>> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSeenData = async (data: Record<string, any>) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const shouldShow = async (popupId: string, frequency: string): Promise<boolean> => {
  const seen = await getSeenData();
  const record = seen[popupId];
  if (!record) return true;
  const now = Date.now();
  switch (frequency) {
    case "always": return true;
    case "once_per_session": return false; // app session — don't re-show in same launch
    case "once_per_day": return now - record.lastSeen > 86400000;
    case "once_per_week": return now - record.lastSeen > 604800000;
    case "once_per_month": return now - record.lastSeen > 2592000000;
    case "once_ever": return !record.lastSeen;
    default: return true;
  }
};

const markSeen = async (popupId: string) => {
  const seen = await getSeenData();
  seen[popupId] = { lastSeen: Date.now(), count: (seen[popupId]?.count || 0) + 1 };
  await saveSeenData(seen);
};

const trackEvent = (popupId: string, event: string) => {
  fetch(`${API_URL}/api/popups/track/${popupId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
};

// ─── BLOCK COMPONENTS ────────────────────────────────────────────────────────

const InputBlock = ({ content, onConversion }: any) => {
  const [val, setVal] = useState("");
  return (
    <View style={bs.inputWrap}>
      {content.label ? <Text style={bs.inputLabel}>{content.label}</Text> : null}
      <View style={bs.inputRow}>
        <TextInput
          style={bs.input}
          placeholder={content.placeholder || "Enter email"}
          placeholderTextColor={colors.gray400}
          value={val}
          onChangeText={setVal}
          keyboardType={content.type === "email" ? "email-address" : "default"}
          autoCapitalize="none"
        />
        {content.buttonText ? (
          <TouchableOpacity
            style={bs.inputBtn}
            onPress={() => { if (val) { onConversion?.(); setVal(""); } }}
          >
            <Text style={bs.inputBtnText}>{content.buttonText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const CountdownBlock = ({ content }: any) => {
  const calc = useCallback(() => {
    if (content.targetDate) {
      return Math.max(0, Math.floor((new Date(content.targetDate).getTime() - Date.now()) / 1000));
    }
    return content.duration || 3600;
  }, [content.targetDate, content.duration]);

  const [timeLeft, setTimeLeft] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((p: number) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View style={bs.countdown}>
      {content.label ? <Text style={bs.countdownLabel}>{content.label}</Text> : null}
      <View style={bs.countdownRow}>
        {h > 0 && <><View style={bs.countdownUnit}><Text style={bs.countdownNum}>{pad(h)}</Text><Text style={bs.countdownSub}>HRS</Text></View><Text style={bs.countdownColon}>:</Text></>}
        <View style={bs.countdownUnit}><Text style={bs.countdownNum}>{pad(m)}</Text><Text style={bs.countdownSub}>MIN</Text></View>
        <Text style={bs.countdownColon}>:</Text>
        <View style={bs.countdownUnit}><Text style={bs.countdownNum}>{pad(s)}</Text><Text style={bs.countdownSub}>SEC</Text></View>
      </View>
    </View>
  );
};

// ─── SLIDER BLOCK (own component so useState/useEffect are at top level) ────

const parsePx = (v: any, fallback: number): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const SLIDER_VARIANT_STYLES: Record<string, { backgroundColor: string; color: string; borderColor?: string; borderWidth?: number }> = {
  primary: { backgroundColor: colors.primary, color: "#fff" },
  secondary: { backgroundColor: "#f3f4f6", color: "#1f2937" },
  outline: { backgroundColor: "transparent", color: "#fff", borderColor: "#fff", borderWidth: 2 },
  ghost: { backgroundColor: "transparent", color: "#fff" },
  danger: { backgroundColor: "#ef4444", color: "#fff" },
};

const SliderSlide = ({ slide, onLinkPress }: any) => {
  const overlay = slide.overlay || {};
  const align = slide.align || {};
  const justifyMap: Record<string, "flex-start" | "center" | "flex-end"> = { left: "flex-start", center: "center", right: "flex-end" };
  const alignMap: Record<string, "flex-start" | "center" | "flex-end"> = { top: "flex-start", middle: "center", bottom: "flex-end" };
  const justify = justifyMap[align.h || "center"] || "center";
  const alignItems = alignMap[align.v || "middle"] || "center";
  const textAlign = align.h === "left" ? "left" : align.h === "right" ? "right" : "center";

  const Wrapper: any = slide.link ? TouchableOpacity : View;
  const wrapperProps = slide.link ? { onPress: () => onLinkPress(slide.link) } : {};

  return (
    <Wrapper {...wrapperProps} style={ss.slide}>
      {slide.image ? (
        <ExpoImage
          source={{ uri: resolveImageUrl(slide.image) }}
          style={StyleSheet.absoluteFill}
          contentFit={slide.imageFit === "contain" ? "contain" : "cover"}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, ss.slideFallback]} />
      )}
      {overlay.enabled ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay.color || "#000000", opacity: overlay.opacity ?? 0.25 }]} />
      ) : null}
      <View style={[ss.slideContent, { justifyContent: alignItems, alignItems: justify }]}>
        {slide.heading ? (
          <Text style={[ss.slideHeading, { color: slide.headingColor || "#ffffff", textAlign }]}>{slide.heading}</Text>
        ) : null}
        {slide.text ? (
          <Text style={[ss.slideText, { color: slide.textColor || "#ffffff", textAlign }]}>{slide.text}</Text>
        ) : null}
        {slide.buttons?.length ? (
          <View style={[ss.slideButtons, { justifyContent: justify }]}>
            {slide.buttons.map((btn: any) => {
              const v = SLIDER_VARIANT_STYLES[btn.variant] || SLIDER_VARIANT_STYLES.primary;
              return (
                <TouchableOpacity
                  key={btn.id}
                  style={[ss.slideBtn, { backgroundColor: v.backgroundColor, borderColor: v.borderColor, borderWidth: v.borderWidth || 0 }]}
                  onPress={() => onLinkPress(btn.link)}
                >
                  <Text style={[ss.slideBtnText, { color: v.color }]}>{btn.text || "Button"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
    </Wrapper>
  );
};

const SliderBlock = ({ content = {}, styles: s = {}, onConversion }: any) => {
  const router = useRouter();
  const slides: any[] = content.slides?.length ? content.slides : [];
  const settings = content.settings || {};
  const count = slides.length;
  const loop = settings.loop !== false;
  const transition = settings.transition === "fade" ? "fade" : "slide";

  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const fadeValues = useMemo(
    () => slides.map((_s, i) => new Animated.Value(i === 0 ? 1 : 0)),
    [count]
  );

  useEffect(() => { indexRef.current = index; }, [index]);

  const handleLinkPress = useCallback((link?: string) => {
    if (!link) return;
    onConversion?.();
    if (/^https?:\/\//i.test(link)) {
      Linking.openURL(link).catch(() => {});
      return;
    }
    const dest = resolveMenuLink({ link });
    if (dest) router.push(dest as any);
  }, [onConversion, router]);

  const goTo = useCallback((rawIndex: number, instant = false) => {
    if (count === 0) return;
    let next = rawIndex;
    let wrapped = false;
    if (next < 0) { next = loop ? count - 1 : 0; wrapped = loop; }
    else if (next >= count) { next = loop ? 0 : count - 1; wrapped = loop; }
    const prev = indexRef.current;
    if (next === prev) return;
    indexRef.current = next;
    setIndex(next);
    if (transition === "fade") {
      Animated.parallel([
        Animated.timing(fadeValues[prev], { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(fadeValues[next], { toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start();
    } else if (containerWidth > 0) {
      flatListRef.current?.scrollToOffset({ offset: next * containerWidth, animated: !wrapped && !instant });
    }
  }, [count, loop, transition, containerWidth, fadeValues]);

  // Autoplay
  useEffect(() => {
    if (!settings.autoplay || count <= 1) return;
    const id = setInterval(() => goTo(indexRef.current + 1), settings.interval || 4000);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.interval, count, goTo]);

  const handleMomentumEnd = (e: any) => {
    if (containerWidth <= 0 || transition === "fade") return;
    const i = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
    const clamped = Math.max(0, Math.min(count - 1, i));
    indexRef.current = clamped;
    setIndex(clamped);
  };

  if (count === 0) return null;

  const height = parsePx(s.height ?? settings.height, 320);
  const borderRadius = parsePx(s.borderRadius, 10);
  const marginBottom = parsePx(s.marginBottom, 16);

  return (
    <View
      style={[ss.wrap, { height, borderRadius, marginBottom }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && transition === "fade" && slides.map((slide, i) => (
        <Animated.View
          key={slide.id || i}
          pointerEvents={i === index ? "auto" : "none"}
          style={[StyleSheet.absoluteFill, { opacity: fadeValues[i] }]}
        >
          <SliderSlide slide={slide} onLinkPress={handleLinkPress} />
        </Animated.View>
      ))}

      {containerWidth > 0 && transition === "slide" && (
        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item: any, i: number) => item.id || String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item }) => (
            <View style={{ width: containerWidth, height }}>
              <SliderSlide slide={item} onLinkPress={handleLinkPress} />
            </View>
          )}
        />
      )}

      {settings.showArrows && count > 1 ? (
        <>
          <TouchableOpacity style={[ss.arrow, ss.arrowLeft]} onPress={() => goTo(index - 1)}>
            <Text style={ss.arrowText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.arrow, ss.arrowRight]} onPress={() => goTo(index + 1)}>
            <Text style={ss.arrowText}>›</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {settings.showDots && count > 1 ? (
        <View style={ss.dots}>
          {slides.map((_slide, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} style={[ss.dot, i === index && ss.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const BlockRenderer = ({ block, onConversion, onClose }: any) => {
  const { type, content = {}, styles: s = {} } = block;

  const mb = { marginBottom: s.marginBottom || 12 };
  const align = s.textAlign || "left";

  switch (type) {
    case "heading":
      return (
        <Text style={[bs.heading, mb, { textAlign: align, fontSize: s.fontSize || 22, color: s.color || colors.gray900, fontWeight: s.fontWeight || "700" }]}>
          {content.text || ""}
        </Text>
      );

    case "text":
      return (
        <Text style={[bs.bodyText, mb, { textAlign: align, fontSize: s.fontSize || 14, color: s.color || colors.gray700 }]}>
          {content.text || ""}
        </Text>
      );

    case "button":
      return (
        <TouchableOpacity
          style={[bs.btn, mb, { backgroundColor: s.backgroundColor || colors.primary, alignSelf: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }]}
          onPress={() => {
            onConversion?.();
            if (content.action === "close") onClose?.();
            else if (content.url) Linking.openURL(content.url).catch(() => {});
          }}
        >
          <Text style={[bs.btnText, { color: s.color || "#fff", fontSize: s.fontSize || 14 }]}>
            {content.text || "Click Here"}
          </Text>
        </TouchableOpacity>
      );

    case "image":
      if (!content.src) return null;
      return (
        <Image
          source={{ uri: resolveImageUrl(content.src) }}
          style={[bs.image, mb, { height: s.height || 160, borderRadius: s.borderRadius || 8 }]}
          resizeMode="cover"
        />
      );

    case "input":
      return <InputBlock content={content} onConversion={onConversion} />;

    case "countdown":
      return <CountdownBlock content={content} />;

    case "divider":
      return <View style={[bs.divider, mb, { borderColor: s.color || colors.gray200 }]} />;

    case "spacer":
      return <View style={{ height: s.height || 16 }} />;

    case "coupon":
      return (
        <View style={[bs.coupon, mb]}>
          <Text style={bs.couponLabel}>{content.label || "Your discount code:"}</Text>
          <View style={bs.couponCodeRow}>
            <Text style={bs.couponCode} selectable>{content.code || ""}</Text>
          </View>
        </View>
      );

    case "icon_text":
      return (
        <View style={[bs.iconText, mb]}>
          {content.icon ? <Text style={bs.iconEmoji}>{content.icon}</Text> : null}
          <Text style={[bs.iconTextBody, { color: s.color || colors.gray700 }]}>{content.text || ""}</Text>
        </View>
      );

    case "slider":
      return <SliderBlock content={content} styles={s} onConversion={onConversion} />;

    default:
      return null;
  }
};

// ─── POPUP DISPLAY ────────────────────────────────────────────────────────────

const PopupDisplay = ({ popup, onClose, onConversion }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
    trackEvent(popup._id, "dismissal");
  };

  const design = popup.design || {};
  const overlayColor = design.overlay?.color || "rgba(0,0,0,0.55)";

  // Pick the mobile layout blocks, fall back to desktop
  const layout = popup.layouts?.mobile || popup.layouts?.tablet || popup.layouts?.desktop || {};
  const blocks: any[] = layout.blocks || [];

  const bgStyle: any = {
    backgroundColor: design.background?.color || "#fff",
    borderRadius: design.background?.borderRadius ?? 12,
    padding: 20,
    width: Math.min(SCREEN_W - 40, 360),
    maxHeight: SCREEN_H * 0.82,
  };

  const closeBtn = design.closeButton || {};
  const showClose = closeBtn.show !== false;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={[ps.overlay, { backgroundColor: overlayColor, opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={design.overlay?.closeOnClick !== false ? dismiss : undefined} />
        <Animated.View style={[bgStyle, { transform: [{ scale }] }]}>
          {showClose && (
            <TouchableOpacity style={ps.closeBtn} onPress={dismiss}>
              <Text style={ps.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {blocks.map((block: any, i: number) => (
              <BlockRenderer key={i} block={block} onConversion={onConversion} onClose={dismiss} />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── MAIN POPUP RENDERER ─────────────────────────────────────────────────────

interface PopupRendererProps {
  pageType?: string;
}

export default function PopupRenderer({ pageType = "homepage" }: PopupRendererProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore((s) => s.items);
  const cartTotal = cart?.reduce((sum: number, i: any) => sum + (i.price || 0) * (i.quantity || 1), 0) || 0;

  const meetsConditions = useCallback((popup: any): boolean => {
    const { conditions } = popup;
    if (!conditions) return true;
    if (conditions.loggedIn === "logged_in" && !user) return false;
    if (conditions.loggedIn === "logged_out" && user) return false;
    if (conditions.cartMinValue && cartTotal < conditions.cartMinValue) return false;
    if (conditions.cartMaxValue && cartTotal > conditions.cartMaxValue) return false;
    return true;
  }, [user, cartTotal]);

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const params = new URLSearchParams({
          pageType,
          isWeb: "false",
          isApp: "true",
        });
        const res = await fetch(`${API_URL}/api/popups/public/active?${params}`);
        const json = await res.json();
        if (!json.success) return;

        const eligible: any[] = [];
        for (const popup of json.data || []) {
          if (!meetsConditions(popup)) continue;
          const frequency = popup.display?.frequency || "once_per_session";
          const ok = await shouldShow(popup._id, frequency);
          if (ok) eligible.push(popup);
        }
        setQueue(eligible);
      } catch {}
    };
    fetchPopups();
    return () => { timerRefs.current.forEach(clearTimeout); };
  }, [pageType, meetsConditions]);

  useEffect(() => {
    if (!queue.length || current) return;

    queue.forEach((popup) => {
      const trigger = popup.trigger || {};
      const delay = trigger.type === "delay" ? (trigger.delaySeconds || 0) * 1000
        : trigger.type === "immediate" || trigger.type === "on_app_open" ? 0
        : 0; // scroll/exit-intent not applicable in native — treat as immediate

      const t = setTimeout(() => {
        setCurrent(popup);
        markSeen(popup._id);
        trackEvent(popup._id, "impression");
      }, delay);
      timerRefs.current.push(t);
    });
  }, [queue, current]);

  if (!current) return null;

  const handleClose = () => {
    setCurrent(null);
    setQueue((q) => q.filter((p) => p._id !== current._id));
  };

  const handleConversion = () => {
    trackEvent(current._id, "conversion");
  };

  return (
    <PopupDisplay
      popup={current}
      onClose={handleClose}
      onConversion={handleConversion}
    />
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const bs = StyleSheet.create({
  heading: { marginBottom: 8 },
  bodyText: { lineHeight: 22, marginBottom: 8 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 6, marginBottom: 8 },
  btnText: { fontWeight: "700", textAlign: "center" },
  image: { width: "100%", marginBottom: 12 },
  divider: { borderTopWidth: 1, marginVertical: 8 },
  coupon: { backgroundColor: "#f3f4f6", borderRadius: 8, padding: 12, alignItems: "center" },
  couponLabel: { fontSize: 12, color: colors.gray500, marginBottom: 6 },
  couponCodeRow: { borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  couponCode: { fontSize: 18, fontWeight: "800", color: colors.primary, letterSpacing: 2 },
  iconText: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconEmoji: { fontSize: 20 },
  iconTextBody: { flex: 1, fontSize: 14, lineHeight: 20 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 13, color: colors.gray700, fontWeight: "500", marginBottom: 6 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray800 },
  inputBtn: { backgroundColor: "#6366f1", borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" },
  inputBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  countdown: { alignItems: "center", marginBottom: 12 },
  countdownLabel: { fontSize: 12, color: colors.gray500, marginBottom: 8 },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  countdownUnit: { alignItems: "center", backgroundColor: colors.gray900, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, minWidth: 52 },
  countdownNum: { fontSize: 22, fontWeight: "800", color: "#fff" },
  countdownSub: { fontSize: 9, color: colors.gray400, fontWeight: "600", letterSpacing: 1 },
  countdownColon: { fontSize: 22, fontWeight: "800", color: colors.gray900, marginBottom: 14 },
});

const ss = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden", backgroundColor: colors.gray200, position: "relative" },
  slide: { flex: 1, position: "relative", overflow: "hidden" },
  slideFallback: { backgroundColor: colors.gray800 },
  slideContent: { flex: 1, padding: 20, gap: 8 },
  slideHeading: { fontSize: 20, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.3)", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  slideText: { fontSize: 13, lineHeight: 18, textShadowColor: "rgba(0,0,0,0.3)", textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  slideButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  slideBtn: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 8 },
  slideBtnText: { fontWeight: "700", fontSize: 13 },
  arrow: { position: "absolute", top: "50%", marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", zIndex: 3 },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  arrowText: { color: "#fff", fontSize: 18, lineHeight: 18, fontWeight: "700" },
  dots: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, zIndex: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 18, backgroundColor: "#fff" },
});

const ps = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.12)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  closeBtnText: { fontSize: 12, color: colors.gray700, fontWeight: "700" },
});
