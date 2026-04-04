import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { giftCardsAPI } from "@/services/api";
import { useCurrencyStore, useAuthStore } from "@/store";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

export default function BuyGiftCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const exchangeRate = useCurrencyStore((s) => s.selectedCurrency?.exchangeRate ?? 1);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [presets, setPresets] = useState<any[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    giftCardsAPI.getPresets()
      .then((res) => setPresets(res.data?.data || res.data || []))
      .catch(() => setPresets([]))
      .finally(() => setLoadingPresets(false));
  }, []);

  // finalAmount is always in ZAR (base currency) for backend processing
  // Preset amounts are stored in ZAR; custom amounts are entered in selected currency and converted back
  const finalAmount = selectedPreset
    ? selectedPreset.amount
    : (parseFloat(customAmount) || 0) * exchangeRate;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login" as any);
      return;
    }
    if (finalAmount <= 0) {
      Toast.show({ type: "error", text1: "Please select or enter an amount" });
      return;
    }
    if (!recipientEmail.trim()) {
      Toast.show({ type: "error", text1: "Recipient email is required" });
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(recipientEmail.trim())) {
      Toast.show({ type: "error", text1: "Please enter a valid email" });
      return;
    }

    try {
      setSubmitting(true);
      await giftCardsAPI.purchase({
        amount: finalAmount,
        currency: selectedCurrency?.code || "ZAR",
        exchangeRate: exchangeRate,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        senderName: senderName.trim() || undefined,
        message: message.trim() || undefined,
        presetId: selectedPreset?._id ? String(selectedPreset._id) : undefined,
      });
      Toast.show({ type: "success", text1: "Gift card purchased!", text2: `Sent to ${recipientEmail.trim()}`, visibilityTime: 3000 });
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Purchase failed. Please try again.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Buy Gift Card</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Amount selection */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Amount</Text>
          {loadingPresets ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <View style={s.presetGrid}>
              {presets.map((preset, idx) => {
                const isSelected = selectedPresetIdx === idx;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => { setSelectedPreset(preset); setSelectedPresetIdx(idx); setCustomAmount(""); }}
                    style={[s.presetCard, isSelected && s.presetCardActive]}
                  >
                    <Text style={[s.presetAmount, isSelected && { color: "#fff" }]}>
                      {formatPrice(preset.amount)}
                    </Text>
                    {preset.label && (
                      <Text style={[s.presetLabel, isSelected && { color: "rgba(255,255,255,0.8)" }]}>
                        {preset.label}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={s.orText}>— or enter custom amount —</Text>
          <View style={s.inputRow}>
            <Text style={s.currencySymbol}>{selectedCurrency?.symbol || "R"}</Text>
            <TextInput
              style={s.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.gray400}
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={(v) => { setCustomAmount(v); setSelectedPreset(null); setSelectedPresetIdx(null); }}
            />
          </View>
        </View>

        {/* Recipient details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recipient Details</Text>
          <TextInput
            style={s.input}
            placeholder="Recipient Email *"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={recipientEmail}
            onChangeText={setRecipientEmail}
          />
          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="Recipient Name (optional)"
            placeholderTextColor={colors.gray400}
            value={recipientName}
            onChangeText={setRecipientName}
          />
        </View>

        {/* Sender & message */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>From You</Text>
          <TextInput
            style={s.input}
            placeholder="Your Name (optional)"
            placeholderTextColor={colors.gray400}
            value={senderName}
            onChangeText={setSenderName}
          />
          <TextInput
            style={[s.input, s.textArea, { marginTop: 8 }]}
            placeholder="Personal message (optional)"
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Summary */}
        {finalAmount > 0 && (
          <View style={s.summary}>
            <Ionicons name="gift-outline" size={24} color={colors.primary} />
            <Text style={s.summaryText}>
              Gift card value: <Text style={{ fontWeight: "700", color: colors.primary }}>{formatPrice(finalAmount)}</Text>
            </Text>
          </View>
        )}

        {/* Buy button */}
        <Pressable
          onPress={handlePurchase}
          style={[s.buyBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.buyBtnText}>Purchase Gift Card</Text>
          }
        </Pressable>

        <View style={{ height: 8 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  section: { backgroundColor: colors.white, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  presetCard: { flex: 1, minWidth: "28%", borderWidth: 1, borderColor: colors.gray200, padding: 14, alignItems: "center" },
  presetCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetAmount: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  presetLabel: { fontSize: 10, color: colors.gray500, marginTop: 2 },
  orText: { textAlign: "center", color: colors.gray400, fontSize: 12, marginVertical: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.gray50 },
  currencySymbol: { paddingHorizontal: 14, fontSize: 16, color: colors.gray500 },
  amountInput: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: "600", color: colors.gray900 },
  input: { borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.gray900, backgroundColor: colors.gray50 },
  textArea: { height: 80, textAlignVertical: "top" },
  summary: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.primaryLight, padding: 14 },
  summaryText: { fontSize: 14, color: colors.gray800 },
  buyBtn: { backgroundColor: colors.primary, paddingVertical: 16, alignItems: "center" },
  buyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
