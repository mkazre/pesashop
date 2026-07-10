import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { ordersAPI, returnsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

const REASONS = [
  { value: "defective", label: "Item is defective" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "damaged_shipping", label: "Damaged in shipping" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "size_fit", label: "Size / fit issue" },
  { value: "other", label: "Other" },
];

const REFUND_METHODS = [
  { value: "pesa_coins", label: "PESA Coins — instant credit" },
  { value: "original_payment", label: "Original payment method (slower)" },
  { value: "store_credit", label: "Store credit" },
];

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png",
  "image/webp": ".webp", "application/pdf": ".pdf",
};

function toFileName(asset: any, fallback: string) {
  const mime = asset.mimeType || "application/octet-stream";
  let name = asset.name || fallback;
  if (!name.includes(".")) name += MIME_EXT[mime] || ".jpg";
  return { name, mime };
}

async function appendFile(fd: FormData, field: string, asset: any, fallback: string) {
  const { name, mime } = toFileName(asset, fallback);
  if (Platform.OS === "web") {
    if (asset._webFile) {
      fd.append(field, asset._webFile, name);
    } else {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      fd.append(field, blob, name);
    }
  } else {
    let uri = asset.uri;
    if (Platform.OS === "ios" && !uri.startsWith("file://")) uri = "file://" + uri;
    fd.append(field, { uri, name, type: mime } as any);
  }
}

export default function RequestReturnScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [reasonCategory, setReasonCategory] = useState("other");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("pesa_coins");
  const [invoiceFile, setInvoiceFile] = useState<any>(null);
  const [photoFiles, setPhotoFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      ordersAPI.getOne(orderId),
      returnsAPI.eligibility(orderId),
    ]).then(([orderRes, eligRes]) => {
      setOrder(orderRes.data?.data || orderRes.data);
      setEligibility(eligRes.data?.data || eligRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  const toggleItem = (item: any) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item._id]) delete next[item._id];
      else next[item._id] = { orderItem: item._id, product: item.product, name: item.name, quantity: item.quantity, unitPrice: item.salePrice || item.price };
      return next;
    });
  };

  const updateQty = (id: string, qty: number) => {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], quantity: Math.max(1, qty) } }));
  };

  const pickInvoice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Toast.show({ type: "error", text1: "File must be less than 10MB" });
          return;
        }
        setInvoiceFile(Platform.OS === "web" && asset.file ? { ...asset, _webFile: asset.file } : asset);
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not pick file" });
    }
  };

  const pickPhotos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true, multiple: true });
      if (!result.canceled && result.assets?.length) {
        const assets = result.assets.slice(0, 5).map((a) => (Platform.OS === "web" && a.file ? { ...a, _webFile: a.file } : a));
        setPhotoFiles(assets);
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not pick photos" });
    }
  };

  const submit = async () => {
    if (Object.keys(selected).length === 0) {
      Toast.show({ type: "error", text1: "Pick at least one item to return" });
      return;
    }
    if (!reason.trim()) {
      Toast.show({ type: "error", text1: "Please explain the reason for your return" });
      return;
    }
    if (!invoiceFile) {
      Toast.show({ type: "error", text1: "Proof of purchase (invoice) is required" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("orderId", orderId as string);
      fd.append("reason", reason);
      fd.append("reasonCategory", reasonCategory);
      fd.append("customerNotes", notes);
      fd.append("refundMethod", refundMethod);
      fd.append("items", JSON.stringify(Object.values(selected)));
      await appendFile(fd, "invoice", invoiceFile, "invoice");
      for (const f of photoFiles) await appendFile(fd, "photos", f, "photo");

      await returnsAPI.create(fd);
      Toast.show({ type: "success", text1: "Return request submitted" });
      router.replace("/account/returns" as any);
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Failed to submit return" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (!order || !eligibility) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={s.center}><Text style={{ color: colors.gray500 }}>Order not found</Text></View>
      </View>
    );
  }

  if (!eligibility.eligible) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} />
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.gray300} />
          <Text style={s.notEligibleTitle}>Return not available</Text>
          <Text style={s.notEligibleText}>{eligibility.reason}</Text>
          {eligibility.existingReturn && (
            <Text style={s.notEligibleText}>Existing RMA: <Text style={{ fontWeight: "700" }}>{eligibility.existingReturn.rmaNumber}</Text></Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <Header router={router} />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Text style={s.orderLabel}>Order {order.orderNumber}</Text>

        <Text style={s.sectionTitle}>Select items to return</Text>
        {order.items.map((item: any) => {
          const isSel = !!selected[item._id];
          return (
            <Pressable key={item._id} onPress={() => toggleItem(item)} style={s.itemRow}>
              <Ionicons name={isSel ? "checkbox" : "square-outline"} size={22} color={isSel ? colors.primary : colors.gray400} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemMeta}>Qty {item.quantity} · {formatPrice(item.salePrice || item.price)} each</Text>
              </View>
              {isSel && (
                <View style={s.qtyBox}>
                  <Pressable onPress={() => updateQty(item._id, selected[item._id].quantity - 1)} style={s.qtyBtn}>
                    <Text style={s.qtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={s.qtyText}>{selected[item._id].quantity}</Text>
                  <Pressable onPress={() => updateQty(item._id, Math.min(item.quantity, selected[item._id].quantity + 1))} style={s.qtyBtn}>
                    <Text style={s.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}

        <Text style={s.sectionTitle}>Reason category</Text>
        <View style={s.chipsRow}>
          {REASONS.map((r) => (
            <Pressable key={r.value} onPress={() => setReasonCategory(r.value)} style={[s.chip, reasonCategory === r.value && s.chipActive]}>
              <Text style={[s.chipText, reasonCategory === r.value && s.chipTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionTitle}>Tell us what happened</Text>
        <TextInput
          style={s.textArea}
          placeholder="Describe the issue..."
          placeholderTextColor={colors.gray400}
          multiline
          value={reason}
          onChangeText={setReason}
        />

        <Text style={s.sectionTitle}>Additional notes (optional)</Text>
        <TextInput
          style={s.textArea}
          placeholder="Anything else we should know?"
          placeholderTextColor={colors.gray400}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <Text style={s.sectionTitle}>Proof of purchase / invoice <Text style={{ color: colors.red500 }}>*</Text></Text>
        <Text style={s.helperText}>Required. PDF or image. We only process returns we can verify.</Text>
        <Pressable onPress={pickInvoice} style={s.uploadBox}>
          {invoiceFile ? (
            <Text style={s.uploadFileText}>📄 {invoiceFile.name} · tap to change</Text>
          ) : (
            <Text style={s.uploadPlaceholder}>📄 Tap to upload your invoice</Text>
          )}
        </Pressable>

        <Text style={s.sectionTitle}>Photos of the item (optional, up to 5)</Text>
        <Text style={s.helperText}>Helpful for "defective" or "damaged in shipping" claims.</Text>
        <Pressable onPress={pickPhotos} style={s.uploadBox}>
          {photoFiles.length > 0 ? (
            <Text style={s.uploadFileText}>📸 {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""} selected · tap to change</Text>
          ) : (
            <Text style={s.uploadPlaceholder}>📸 Tap to add photos</Text>
          )}
        </Pressable>

        <Text style={s.sectionTitle}>Refund method</Text>
        <View style={{ gap: 8 }}>
          {REFUND_METHODS.map((m) => (
            <Pressable key={m.value} onPress={() => setRefundMethod(m.value)} style={s.radioRow}>
              <Ionicons name={refundMethod === m.value ? "radio-button-on" : "radio-button-off"} size={20} color={refundMethod === m.value ? colors.primary : colors.gray400} />
              <Text style={s.radioLabel}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={submit} disabled={submitting} style={[s.submitBtn, submitting && { opacity: 0.6 }]}>
          <Text style={s.submitBtnText}>{submitting ? "Submitting..." : "Submit return request"}</Text>
        </Pressable>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

function Header({ router }: { router: any }) {
  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.gray800} />
      </Pressable>
      <Text style={s.headerTitle}>Request a return</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  notEligibleTitle: { fontSize: 16, fontWeight: "700", color: colors.gray800, marginTop: 12 },
  notEligibleText: { fontSize: 13, color: colors.gray500, marginTop: 6, textAlign: "center" },
  orderLabel: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginTop: 20, marginBottom: 8 },
  helperText: { fontSize: 12, color: colors.gray400, marginBottom: 8, marginTop: -4 },
  itemRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, padding: 12, marginBottom: 8 },
  itemName: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  itemMeta: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  qtyBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 0, backgroundColor: colors.gray100, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 15, fontWeight: "700", color: colors.gray700 },
  qtyText: { fontSize: 13, fontWeight: "600", color: colors.gray900, minWidth: 16, textAlign: "center" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 0, borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.white },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.gray700, fontWeight: "500" },
  chipTextActive: { color: colors.white },
  textArea: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, padding: 12, fontSize: 13, color: colors.gray900, minHeight: 72, textAlignVertical: "top", backgroundColor: colors.white },
  uploadBox: { borderWidth: 2, borderColor: colors.gray200, borderStyle: "dashed", borderRadius: 0, padding: 16, alignItems: "center", backgroundColor: colors.white },
  uploadPlaceholder: { fontSize: 13, color: colors.gray500 },
  uploadFileText: { fontSize: 13, color: colors.gray700, fontWeight: "500" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, padding: 12 },
  radioLabel: { fontSize: 13, color: colors.gray800, flex: 1 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 0, paddingVertical: 15, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
