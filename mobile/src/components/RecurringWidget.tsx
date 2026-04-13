import { useState } from "react";
import { View, Text, Pressable, Switch, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuthStore, useCartStore, useCurrencyStore } from "@/store";
import { recurringOrdersAPI } from "@/services/api";
import { colors } from "@/theme";

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", fortnightly: "Every 2 weeks",
  monthly: "Monthly", bimonthly: "Every 2 months", quarterly: "Quarterly",
};

interface RecurringWidgetProps {
  product: any;
  onRecurringChange?: (active: boolean) => void;
}

export default function RecurringWidget({ product, onRecurringChange }: RecurringWidgetProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { formatPrice } = useCurrencyStore();
  const { addItem, setItemRecurring } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState<"upfront" | "pay_as_you_go">("pay_as_you_go");
  const [instances, setInstances] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedPlan = plans.find((p) => p._id === selectedPlanId) || plans[0];

  const loadPlans = async () => {
    if (plansLoaded) return;
    setLoadingPlans(true);
    try {
      const res = await recurringOrdersAPI.getPlansForProduct(product._id);
      const data = res.data?.data || res.data || [];
      setPlans(Array.isArray(data) ? data : []);
      setPlansLoaded(true);
    } catch {
      setPlans([]);
      setPlansLoaded(true);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleToggle = (val: boolean) => {
    if (val && !isAuthenticated) {
      Toast.show({ type: "info", text1: "Sign in to set up recurring purchases" });
      return;
    }
    setIsOpen(val);
    onRecurringChange?.(val);
    if (val && !plansLoaded) loadPlans();
    if (!val) { setSubmitted(false); }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const res = await recurringOrdersAPI.create({
        productId: product._id,
        recurringPlanId: selectedPlan._id,
        frequency: selectedPlan.frequency,
        quantity,
        paymentMode,
        totalInstances: paymentMode === "upfront" ? instances : undefined,
      });
      // Add to cart and tag as recurring
      addItem(product, quantity);
      setTimeout(() => {
        const items = useCartStore.getState().items;
        const idx = items.map((i, j) => ({ i, j })).reverse().find(({ i }) => i.product._id === product._id && !i.laybye)?.j ?? -1;
        if (idx >= 0) {
          useCartStore.getState().setItemRecurring(idx, {
            frequency: selectedPlan.frequency,
            paymentMode,
            instances: paymentMode === "upfront" ? instances : null,
            recurringOrderId: res?.data?.data?._id || null,
          });
        }
      }, 100);
      setSubmitted(true);
      Toast.show({ type: "success", text1: "Recurring order set up!", text2: "Added to cart" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to set up recurring order" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const price = product.salePrice || product.regularPrice || 0;
  const totalUpfront = price * quantity * instances;

  return (
    <View style={s.container}>
      <View style={s.toggleRow}>
        <View style={s.toggleInfo}>
          <Text style={s.toggleIcon}>🔄</Text>
          <View>
            <Text style={s.toggleTitle}>Set Up Recurring Purchase</Text>
            <Text style={s.toggleSub}>Auto-repeat delivery — manage anytime in My Account</Text>
          </View>
        </View>
        <Switch
          value={isOpen}
          onValueChange={handleToggle}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {isOpen && !submitted && (
        <View style={s.panel}>
          {loadingPlans ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 12 }} />
          ) : plans.length === 0 ? (
            <Text style={s.emptyText}>No recurring plans available for this product.</Text>
          ) : (
            <>
              {/* Frequency */}
              <Text style={s.sectionLabel}>Delivery Frequency</Text>
              <View style={s.chipRow}>
                {plans.map((plan) => (
                  <Pressable
                    key={plan._id}
                    onPress={() => {
                      setSelectedPlanId(plan._id);
                      if (!plan.allowedPaymentModes?.includes(paymentMode)) {
                        setPaymentMode(plan.allowedPaymentModes?.[0] || "pay_as_you_go");
                      }
                    }}
                    style={[s.chip, selectedPlan?._id === plan._id && s.chipActive]}
                  >
                    <Text style={[s.chipText, selectedPlan?._id === plan._id && s.chipTextActive]}>
                      {FREQ_LABELS[plan.frequency] || plan.frequency}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Quantity */}
              <Text style={s.sectionLabel}>Quantity per Delivery</Text>
              <View style={s.qtyRow}>
                <Pressable onPress={() => setQuantity(Math.max(selectedPlan?.minQuantity || 1, quantity - 1))} style={s.qtyBtn}>
                  <Ionicons name="remove" size={16} color={colors.gray700} />
                </Pressable>
                <Text style={s.qtyText}>{quantity}</Text>
                <Pressable onPress={() => setQuantity(Math.min(selectedPlan?.maxQuantity || 100, quantity + 1))} style={s.qtyBtn}>
                  <Ionicons name="add" size={16} color={colors.gray700} />
                </Pressable>
              </View>

              {/* Payment mode */}
              {selectedPlan?.allowedPaymentModes?.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Payment Mode</Text>
                  <View style={s.modeRow}>
                    {selectedPlan.allowedPaymentModes.map((mode: string) => (
                      <Pressable
                        key={mode}
                        onPress={() => setPaymentMode(mode as any)}
                        style={[s.modeBtn, paymentMode === mode && s.modeBtnActive]}
                      >
                        <Text style={[s.modeBtnText, paymentMode === mode && s.modeBtnTextActive]}>
                          {mode === "upfront" ? "Pay Upfront" : "Pay As You Go"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Upfront instances */}
              {paymentMode === "upfront" && selectedPlan && (
                <>
                  <Text style={s.sectionLabel}>
                    Number of Deliveries ({selectedPlan.minInstances || 2}–{selectedPlan.maxInstances || 24})
                  </Text>
                  <TextInput
                    style={s.instanceInput}
                    keyboardType="number-pad"
                    value={String(instances)}
                    onChangeText={(v) => setInstances(Math.max(selectedPlan.minInstances || 2, Math.min(selectedPlan.maxInstances || 24, parseInt(v) || 2)))}
                  />
                </>
              )}

              {/* Summary */}
              <View style={s.summary}>
                <Text style={s.summaryTitle}>Summary</Text>
                <Text style={s.summaryLine}>Delivery: {FREQ_LABELS[selectedPlan?.frequency] || ""}</Text>
                <Text style={s.summaryLine}>Qty per delivery: {quantity} × {formatPrice(price)}</Text>
                {paymentMode === "upfront" ? (
                  <Text style={s.summaryTotal}>Total upfront: {formatPrice(totalUpfront)}</Text>
                ) : (
                  <Text style={s.summaryLine}>Billed per delivery — reminded in advance</Text>
                )}
              </View>

              <Pressable onPress={handleSubmit} disabled={submitting} style={[s.submitBtn, submitting && { opacity: 0.6 }]}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.submitText}>Set Up Recurring Purchase</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      )}

      {isOpen && submitted && (
        <View style={s.successPanel}>
          <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
          <Text style={s.successTitle}>Recurring order set up!</Text>
          <Text style={s.successSub}>Manage it in My Account → Recurring Orders</Text>
          <Pressable onPress={() => { setIsOpen(false); setSubmitted(false); onRecurringChange?.(false); }}>
            <Text style={s.successClose}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: "#e5eae6", paddingTop: 14, marginTop: 4 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  toggleIcon: { fontSize: 20 },
  toggleTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  toggleSub: { fontSize: 11, color: "#76889a", marginTop: 1 },
  panel: { marginTop: 14, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 14 },
  emptyText: { fontSize: 13, color: colors.gray400, paddingVertical: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: colors.gray500, marginTop: 10, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white },
  chipActive: { backgroundColor: "#059669", borderColor: "#059669" },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  chipTextActive: { color: colors.white },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: colors.gray300, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  qtyText: { fontSize: 15, fontWeight: "700", color: colors.gray900, minWidth: 28, textAlign: "center" },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  modeBtnText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  modeBtnTextActive: { color: colors.white },
  instanceInput: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, width: 100, backgroundColor: colors.white, color: colors.gray900 },
  summary: { backgroundColor: colors.white, borderWidth: 1, borderColor: "#86efac", borderRadius: 8, padding: 12, marginTop: 12 },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, marginBottom: 6 },
  summaryLine: { fontSize: 12, color: colors.gray600, marginBottom: 2 },
  summaryTotal: { fontSize: 13, fontWeight: "700", color: "#15803d", marginTop: 4 },
  submitBtn: { backgroundColor: "#059669", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 14 },
  submitText: { fontSize: 14, fontWeight: "700", color: colors.white },
  successPanel: { marginTop: 12, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 16, alignItems: "center" },
  successTitle: { fontSize: 14, fontWeight: "700", color: "#15803d", marginTop: 8 },
  successSub: { fontSize: 12, color: "#16a34a", marginTop: 4, textAlign: "center" },
  successClose: { fontSize: 12, color: colors.gray500, marginTop: 12, textDecorationLine: "underline" },
});
