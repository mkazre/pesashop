import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { laybyAPI } from "@/services/api";
import {
  useAuthStore,
  useCartStore,
  useCurrencyStore,
} from "@/store";
import { colors } from "@/theme";

interface LaybyeApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  product: any;
  selectedPlan?: any; // { plan, deposit, installment }
}

type Step = "checking" | "auto-approved" | "pending-review" | "terms" | "form" | "submitted";

export default function LaybyeApplicationModal({
  visible,
  onClose,
  product,
  selectedPlan,
}: LaybyeApplicationModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const cartItems = useCartStore((s) => s.items);
  const laybyeCartItems = cartItems.filter((i) => !!i.laybye);

  const [step, setStep] = useState<Step>("checking");
  const [eligibility, setEligibility] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [idFile, setIdFile] = useState<any>(null);

  const productPrice = product?.salePrice || product?.regularPrice || 0;

  // Reset and check eligibility when modal opens
  useEffect(() => {
    if (!visible) return;

    if (!isAuthenticated) {
      onClose();
      Toast.show({ type: "info", text1: "Please sign in to apply for laybye" });
      router.push("/auth/login" as any);
      return;
    }

    // Pre-fill form
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      notes: "",
    });
    setAgreed(false);
    setIdFile(null);
    setStep("checking");
    setEligibility(null);

    // Fetch settings and check eligibility
    const init = async () => {
      try {
        const settRes = await laybyAPI.getSettings().catch(() => null);
        setSettings(settRes?.data?.data || null);
      } catch {}

      try {
        const eligRes = await laybyAPI.checkEligibility();
        const data = eligRes?.data;
        setEligibility(data);

        if (data?.eligible) {
          setStep("auto-approved");
        } else if (data?.pending) {
          setStep("pending-review");
        } else {
          setStep("terms");
        }
      } catch {
        // If eligibility check fails (network, auth), fall back to normal flow
        setStep("terms");
      }
    };
    init();
  }, [visible]);

  const frequencyLabel = (freq: string) => {
    switch (freq) {
      case "weekly": return "week";
      case "biweekly": return "2 weeks";
      case "monthly": return "month";
      default: return "month";
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Toast.show({ type: "error", text1: "File must be less than 10MB" });
          return;
        }
        // On web, also store the raw File object for proper FormData upload
        if (Platform.OS === "web" && asset.file) {
          setIdFile({ ...asset, _webFile: asset.file });
        } else {
          setIdFile(asset);
        }
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not pick file" });
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      Toast.show({ type: "error", text1: "Please fill in all required fields" });
      return;
    }
    if (!idFile) {
      Toast.show({ type: "error", text1: "Please upload your ID or Passport" });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("firstName", formData.firstName);
      fd.append("lastName", formData.lastName);
      fd.append("email", formData.email);
      fd.append("phone", formData.phone);
      fd.append("productId", product._id);
      fd.append("notes", formData.notes);

      // Build file name with proper extension (multer requires it for file filter)
      const mime = idFile.mimeType || "application/octet-stream";
      const extMap: Record<string, string> = {
        "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png",
        "image/gif": ".gif", "image/webp": ".webp", "application/pdf": ".pdf",
      };
      let fileName = idFile.name || "id-document";
      if (!fileName.includes(".")) {
        fileName = fileName + (extMap[mime] || ".jpg");
      }

      if (Platform.OS === "web") {
        // Web: use the real File object from document picker, or fetch the blob URI
        if (idFile._webFile) {
          fd.append("idDocument", idFile._webFile, fileName);
        } else {
          const blob = await fetch(idFile.uri).then((r) => r.blob());
          fd.append("idDocument", blob, fileName);
        }
      } else {
        // Native (iOS/Android): use RN's { uri, name, type } convention
        let fileUri = idFile.uri;
        if (Platform.OS === "ios" && !fileUri.startsWith("file://")) {
          fileUri = "file://" + fileUri;
        }
        fd.append("idDocument", {
          uri: fileUri,
          name: fileName,
          type: mime,
        } as any);
      }

      if (selectedPlan?.plan) {
        fd.append("laybyPlanId", selectedPlan.plan._id);
        fd.append("planName", selectedPlan.plan.name || "");
        fd.append("depositAmount", String(selectedPlan.deposit || 0));
        fd.append("installmentAmount", String(selectedPlan.installment || 0));
        fd.append("numberOfPayments", String(selectedPlan.plan.numberOfPayments || 0));
        fd.append("frequency", selectedPlan.plan.frequency || "monthly");
      }

      await laybyAPI.submitApplication(fd);
      setStep("submitted");
      Toast.show({ type: "success", text1: "Application submitted!" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Application failed. Please try again.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const renderChecking = () => (
    <View style={ms.centerSection}>
      <ActivityIndicator size="large" color={colors.amber500} />
      <Text style={ms.centerTitle}>Checking your eligibility...</Text>
      <Text style={ms.centerSub}>This will only take a moment</Text>
    </View>
  );

  const renderAutoApproved = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={ms.centerSection}>
        <View style={[ms.statusIcon, { backgroundColor: "#dcfce7" }]}>
          <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
        </View>
        <Text style={ms.centerTitle}>Congratulations!</Text>
        <Text style={ms.centerSub}>
          {eligibility?.message || `You've been automatically approved for laybye. Your previous application was approved within the last ${eligibility?.validityDays || 90} days, so there's no need to reapply.`}
        </Text>

        {eligibility?.application && (
          <View style={ms.infoCard}>
            <Text style={ms.infoLabel}>VERIFIED ACCOUNT DETAILS</Text>
            <View style={ms.infoRow}>
              <Text style={ms.infoKey}>Name</Text>
              <Text style={ms.infoVal}>{eligibility.application.firstName} {eligibility.application.lastName}</Text>
            </View>
            <View style={ms.infoRow}>
              <Text style={ms.infoKey}>Email</Text>
              <Text style={ms.infoVal}>{eligibility.application.email}</Text>
            </View>
            <View style={ms.infoRow}>
              <Text style={ms.infoKey}>Phone</Text>
              <Text style={ms.infoVal}>{eligibility.application.phone}</Text>
            </View>
          </View>
        )}

        {renderLaybyeItems()}

        <Text style={[ms.centerSub, { marginTop: 12 }]}>
          Simply proceed to checkout and your laybye will be created instantly.
        </Text>

        <Pressable onPress={onClose} style={[ms.primaryBtn, { backgroundColor: "#16a34a" }]}>
          <Text style={ms.primaryBtnText}>Got It — Continue to Checkout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderPendingReview = () => (
    <View style={ms.centerSection}>
      <View style={[ms.statusIcon, { backgroundColor: "#fef3c7" }]}>
        <Ionicons name="time" size={40} color="#d97706" />
      </View>
      <Text style={ms.centerTitle}>Application Under Review</Text>
      <Text style={ms.centerSub}>
        You already have a laybye application being reviewed. We'll notify you by email once it's processed.
      </Text>
      <Pressable onPress={onClose} style={ms.darkBtn}>
        <Text style={ms.darkBtnText}>Close</Text>
      </Pressable>
    </View>
  );

  const renderTerms = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ padding: 16 }}>
        {/* T&C text */}
        <View style={ms.termsBox}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
            <Text style={ms.termsText}>
              {settings?.termsAndConditions || "Terms and conditions have not been configured yet. Please contact the store for more information."}
            </Text>
          </ScrollView>
        </View>

        {/* Product / laybye items */}
        {laybyeCartItems.length > 0 ? (
          renderLaybyeItems()
        ) : (
          <View style={ms.productBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={ms.productBoxLabel}>Product</Text>
                <Text style={ms.productBoxName} numberOfLines={2}>{product?.name}</Text>
              </View>
              <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <Text style={ms.productBoxLabel}>Price</Text>
                <Text style={ms.productBoxPrice}>{formatPrice(productPrice)}</Text>
              </View>
            </View>
            {selectedPlan?.plan && (
              <View style={ms.planGrid}>
                <View style={ms.planGridRow}>
                  <View style={ms.planGridItem}>
                    <Text style={ms.planGridLabel}>Deposit</Text>
                    <Text style={ms.planGridValue}>{formatPrice(selectedPlan.deposit || 0)}</Text>
                  </View>
                  <View style={ms.planGridItem}>
                    <Text style={ms.planGridLabel}>
                      {selectedPlan.plan.numberOfPayments}× {frequencyLabel(selectedPlan.plan.frequency)}
                    </Text>
                    <Text style={ms.planGridValue}>{formatPrice(selectedPlan.installment || 0)}</Text>
                  </View>
                </View>
                <View style={ms.planGridItemFull}>
                  <Text style={ms.planGridLabel}>Plan</Text>
                  <Text style={[ms.planGridValue, { color: colors.amber500 }]}>{selectedPlan.plan.name}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Agreement */}
        <Pressable onPress={() => setAgreed(!agreed)} style={ms.agreeRow}>
          <View style={[ms.checkbox, agreed && ms.checkboxActive]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={ms.agreeText}>I have read and agree to the layby terms and conditions</Text>
        </Pressable>

        <Pressable
          onPress={() => setStep("form")}
          disabled={!agreed}
          style={[ms.primaryBtn, !agreed && { opacity: 0.5 }]}
        >
          <Text style={ms.primaryBtnText}>Continue to Application →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderForm = () => (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 16 }}>
        <Text style={ms.formHint}>Please provide your details below. Our team will review your application.</Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={ms.fieldLabel}>First Name *</Text>
            <TextInput
              style={ms.fieldInput}
              value={formData.firstName}
              onChangeText={(t) => setFormData({ ...formData, firstName: t })}
              placeholder="John"
              placeholderTextColor={colors.gray400}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ms.fieldLabel}>Last Name *</Text>
            <TextInput
              style={ms.fieldInput}
              value={formData.lastName}
              onChangeText={(t) => setFormData({ ...formData, lastName: t })}
              placeholder="Doe"
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        <Text style={ms.fieldLabel}>Email Address *</Text>
        <TextInput
          style={ms.fieldInput}
          value={formData.email}
          onChangeText={(t) => setFormData({ ...formData, email: t })}
          placeholder="john@example.com"
          placeholderTextColor={colors.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={ms.fieldLabel}>Contact Number *</Text>
        <TextInput
          style={ms.fieldInput}
          value={formData.phone}
          onChangeText={(t) => setFormData({ ...formData, phone: t })}
          placeholder="072 123 4567"
          placeholderTextColor={colors.gray400}
          keyboardType="phone-pad"
        />

        <Text style={ms.fieldLabel}>ID or Passport Copy *</Text>
        <Pressable onPress={pickDocument} style={[ms.uploadBox, idFile && ms.uploadBoxActive]}>
          {idFile ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={ms.uploadFileName} numberOfLines={1}>{idFile.name}</Text>
              <Pressable onPress={() => setIdFile(null)}>
                <Ionicons name="close-circle" size={18} color={colors.red500} />
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.gray400} />
              <Text style={ms.uploadText}>Tap to upload your ID or Passport</Text>
              <Text style={ms.uploadHint}>JPEG, PNG, PDF — Max 10MB</Text>
            </View>
          )}
        </Pressable>

        <Text style={ms.fieldLabel}>Additional Notes</Text>
        <TextInput
          style={[ms.fieldInput, { height: 80, textAlignVertical: "top" }]}
          value={formData.notes}
          onChangeText={(t) => setFormData({ ...formData, notes: t })}
          placeholder="Any additional information..."
          placeholderTextColor={colors.gray400}
          multiline
        />

        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Pressable onPress={() => setStep("terms")} style={ms.backBtn}>
            <Text style={ms.backBtnText}>← Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !idFile}
            style={[ms.primaryBtn, { flex: 1 }, (submitting || !idFile) && { opacity: 0.5 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={ms.primaryBtnText}>Submit Application</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  const renderSubmitted = () => (
    <View style={ms.centerSection}>
      <View style={[ms.statusIcon, { backgroundColor: "#dcfce7" }]}>
        <Ionicons name="checkmark" size={40} color="#16a34a" />
      </View>
      <Text style={ms.centerTitle}>Thank You!</Text>
      <Text style={ms.centerSub}>
        Your layby application has been submitted successfully. Our team will review it and get back to you shortly.
      </Text>
      <Text style={[ms.centerSub, { fontWeight: "600" }]}>
        Confirmation sent to {formData.email}
      </Text>
      <Pressable onPress={onClose} style={ms.darkBtn}>
        <Text style={ms.darkBtnText}>Close</Text>
      </Pressable>
    </View>
  );

  const renderLaybyeItems = () => {
    if (laybyeCartItems.length === 0) return null;
    return (
      <View style={ms.laybyeItemsCard}>
        <Text style={ms.laybyeItemsTitle}>ITEMS ON LAYBYE ({laybyeCartItems.length})</Text>
        {laybyeCartItems.map((item, idx) => {
          const price = item.product.salePrice || item.product.regularPrice || 0;
          return (
            <View key={idx} style={ms.laybyeItemRow}>
              <Text style={ms.laybyeItemName} numberOfLines={1}>{item.product.name} × {item.quantity}</Text>
              <Text style={ms.laybyeItemPrice}>{formatPrice(price * item.quantity)}</Text>
            </View>
          );
        })}
        <View style={ms.laybyeItemsTotal}>
          <Text style={ms.laybyeItemsTotalLabel}>Total Deposit</Text>
          <Text style={ms.laybyeItemsTotalValue}>
            {formatPrice(laybyeCartItems.reduce((t, i) => t + (i.laybye?.deposit || 0) * i.quantity, 0))}
          </Text>
        </View>
      </View>
    );
  };

  const headerColor =
    step === "auto-approved" ? "#16a34a" :
    step === "pending-review" ? "#d97706" :
    "#f59e0b";

  const headerTitle =
    step === "checking" ? "Checking Eligibility..." :
    step === "auto-approved" ? "You're Pre-Approved!" :
    step === "pending-review" ? "Application Under Review" :
    step === "submitted" ? "Application Submitted!" :
    step === "terms" ? "Layby Terms & Conditions" :
    "Apply for Layby";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.modal}>
          {/* Header */}
          <View style={[ms.header, { backgroundColor: headerColor }]}>
            <View>
              <Text style={ms.headerTitle}>{headerTitle}</Text>
              {product && <Text style={ms.headerSub}>{product.name}</Text>}
            </View>
            <Pressable onPress={onClose} style={ms.headerClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Body */}
          <View style={{ flex: 1 }}>
            {step === "checking" && renderChecking()}
            {step === "auto-approved" && renderAutoApproved()}
            {step === "pending-review" && renderPendingReview()}
            {step === "terms" && renderTerms()}
            {step === "form" && renderForm()}
            {step === "submitted" && renderSubmitted()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", maxHeight: "90%", borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  headerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  centerSection: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 32 },
  statusIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  centerTitle: { fontSize: 22, fontWeight: "700", color: colors.gray900, marginBottom: 8, textAlign: "center" },
  centerSub: { fontSize: 14, color: colors.gray500, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  infoCard: { width: "100%", backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 0, padding: 16, marginTop: 16 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: "#15803d", letterSpacing: 1, marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoKey: { fontSize: 12, color: colors.gray500 },
  infoVal: { fontSize: 12, fontWeight: "600", color: colors.gray900 },
  primaryBtn: { backgroundColor: "#f59e0b", paddingVertical: 14, borderRadius: 0, alignItems: "center", marginTop: 16, width: "100%" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  darkBtn: { backgroundColor: colors.gray900, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 0, alignItems: "center", marginTop: 16 },
  darkBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 0, alignItems: "center", borderWidth: 1, borderColor: colors.gray200 },
  backBtnText: { color: colors.gray600, fontWeight: "600", fontSize: 14 },
  termsBox: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, padding: 16, marginBottom: 16, height: 220 },
  termsText: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
  productBox: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 0, padding: 16, marginBottom: 16 },
  productBoxLabel: { fontSize: 12, color: "#92400e" },
  productBoxName: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  productBoxPrice: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  planGrid: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#fde68a", paddingTop: 12, gap: 8 },
  planGridRow: { flexDirection: "row", gap: 8 },
  planGridItem: { flex: 1, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 0, padding: 10, alignItems: "center" },
  planGridItemFull: { backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 0, padding: 10, alignItems: "center" },
  planGridLabel: { fontSize: 10, color: "#92400e", marginBottom: 4 },
  planGridValue: { fontSize: 13, fontWeight: "700", color: colors.gray900, textAlign: "center" },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: colors.gray300, borderRadius: 0, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  agreeText: { flex: 1, fontSize: 13, color: colors.gray700, lineHeight: 18 },
  formHint: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 12 },
  fieldInput: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 0, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.gray800 },
  uploadBox: { borderWidth: 2, borderStyle: "dashed", borderColor: colors.gray300, borderRadius: 0, padding: 20, alignItems: "center", marginTop: 4 },
  uploadBoxActive: { borderColor: "#86efac", backgroundColor: "#f0fdf4" },
  uploadFileName: { fontSize: 13, fontWeight: "600", color: "#15803d", flex: 1 },
  uploadText: { fontSize: 13, color: colors.gray600, marginTop: 6 },
  uploadHint: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  laybyeItemsCard: { width: "100%", backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 0, padding: 12, marginTop: 16 },
  laybyeItemsTitle: { fontSize: 10, fontWeight: "700", color: "#92400e", letterSpacing: 1, marginBottom: 8 },
  laybyeItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  laybyeItemName: { fontSize: 13, color: colors.gray800, flex: 1 },
  laybyeItemPrice: { fontSize: 13, fontWeight: "600", color: colors.gray900, marginLeft: 8 },
  laybyeItemsTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#fde68a", marginTop: 8, paddingTop: 8 },
  laybyeItemsTotalLabel: { fontSize: 12, fontWeight: "600", color: "#92400e" },
  laybyeItemsTotalValue: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
});
