import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore, useCartStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";

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
    const t = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
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

const ps = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  closeBtn: { position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.12)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  closeBtnText: { fontSize: 12, color: colors.gray700, fontWeight: "700" },
});
