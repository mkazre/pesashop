import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { laybyAPI, settingsAPI, productPageSettingsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";
import { Image } from "expo-image";
import BottomTabBar from "@/components/BottomTabBar";

type PayStep = "amount" | "method" | "eft" | "cash" | "dynamic" | "success";

export default function LaybyeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { formatPrice, convertFromBase, selectedCurrency } = useCurrencyStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [laybye, setLaybye] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [dynamicMethods, setDynamicMethods] = useState<any[]>([]);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState<PayStep>("amount");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [lbRes, bankRes, ppRes] = await Promise.all([
        laybyAPI.getMyLaybye(id),
        settingsAPI.getBankDetails().catch(() => ({ data: { data: [] } })),
        productPageSettingsAPI.get().catch(() => ({ data: null })),
      ]);
      setLaybye(lbRes.data?.data || null);
      setBankDetails(bankRes.data?.data || []);
      const ppSettings = ppRes.data?.data || ppRes.data;
      const methods = (ppSettings?.checkoutDrawer?.paymentMethods || []).filter((p: any) => p.enabled !== false);
      setDynamicMethods(methods);
    } catch {
      Toast.show({ type: "error", text1: "Could not load laybye details" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return { bg: "#dcfce7", text: "#15803d" };
      case "completed": return { bg: "#dbeafe", text: "#1d4ed8" };
      case "defaulted": case "cancelled": return { bg: "#fee2e2", text: "#dc2626" };
      default: return { bg: colors.gray100, text: colors.gray600 };
    }
  };

  const getEffectiveRemaining = () => {
    if (!laybye) return 0;
    const pendingTotal = (laybye.payments || [])
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    return Math.max(0, (laybye.remainingAmount || 0) - pendingTotal);
  };

  const progress = laybye?.totalAmount
    ? Math.min(100, Math.round((laybye.paidAmount / laybye.totalAmount) * 100))
    : 0;

  const isOverdue = laybye?.nextPaymentDate && new Date(laybye.nextPaymentDate) < new Date();

  const convertToBase = (amountInSelected: number) => {
    if (!selectedCurrency || selectedCurrency.isBaseCurrency || selectedCurrency.exchangeRate === 1) return amountInSelected;
    return amountInSelected * selectedCurrency.exchangeRate;
  };

  const openPayModal = () => {
    const effRemaining = getEffectiveRemaining();
    const suggested = Math.min(laybye?.installmentPlan?.installmentAmount || 0, effRemaining);
    const convertedSuggested = convertFromBase(suggested);
    setPaymentAmount(convertedSuggested > 0 ? convertedSuggested.toFixed(2) : "");
    setPayStep("amount");
    setPaymentMethod("");
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setPaymentAmount("");
    setPayStep("amount");
    setPaymentMethod("");
  };

  const handleSubmitPayment = async () => {
    if (!laybye || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    const amountInBase = convertToBase(parseFloat(paymentAmount));
    setSubmitting(true);
    try {
      const methodLabel = paymentMethod === "eft" ? "EFT bank transfer"
        : paymentMethod === "cash" ? "Cash payment"
        : (dynamicMethods.find((m) => (m.id || m._id) === paymentMethod)?.label || paymentMethod);
      await laybyAPI.makePayment(laybye._id, {
        amount: amountInBase,
        paymentMethod: methodLabel,
        note: methodLabel,
      });
      setPayStep("success");
      fetchData();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Payment failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed": return { bg: "#dcfce7", text: "#15803d" };
      case "pending": return { bg: "#fef3c7", text: "#d97706" };
      case "failed": return { bg: "#fee2e2", text: "#dc2626" };
      default: return { bg: colors.gray100, text: colors.gray600 };
    }
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
          <Text style={s.headerTitle}>Laybye Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (!laybye) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </Pressable>
          <Text style={s.headerTitle}>Laybye Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.gray300} />
          <Text style={s.emptyText}>Laybye not found</Text>
        </View>
      </View>
    );
  }

  const sc = getStatusColor(laybye.status);
  const effRemaining = getEffectiveRemaining();
  const hasPending = effRemaining < (laybye.remainingAmount || 0);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Laybye #{laybye.laybyeNumber || laybye._id?.slice(-6)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {/* Status Badge & Order */}
        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={[s.badge, { backgroundColor: sc.bg }]}>
              <Text style={[s.badgeText, { color: sc.text }]}>{laybye.status}</Text>
            </View>
            {isOverdue && (
              <View style={[s.badge, { backgroundColor: "#fee2e2" }]}>
                <Text style={[s.badgeText, { color: "#dc2626" }]}>Overdue</Text>
              </View>
            )}
          </View>
          {laybye.order?.orderNumber && (
            <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 6 }}>
              Order #{laybye.order.orderNumber}
            </Text>
          )}
          {laybye.laybyPlan?.name && (
            <Text style={{ fontSize: 13, color: colors.gray600, marginTop: 2 }}>
              Plan: {laybye.laybyPlan.name}
            </Text>
          )}
        </View>

        {/* Progress */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Payment Progress</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 4, textAlign: "center" }}>{progress}% paid</Text>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total</Text>
              <Text style={s.statValue}>{formatPrice(laybye.totalAmount || 0)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Paid</Text>
              <Text style={[s.statValue, { color: colors.green600 }]}>{formatPrice(laybye.paidAmount || 0)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Remaining</Text>
              <Text style={[s.statValue, { color: colors.red500 }]}>{formatPrice(laybye.remainingAmount || 0)}</Text>
            </View>
          </View>

          {hasPending && (
            <View style={{ backgroundColor: "#fef3c7", padding: 8, marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: "#d97706" }}>Pending payments of {formatPrice((laybye.remainingAmount || 0) - effRemaining)} awaiting verification</Text>
            </View>
          )}
        </View>

        {/* Installment Details */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Installment Details</Text>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Frequency</Text>
            <Text style={s.detailValue}>{laybye.installmentPlan?.frequency || "N/A"}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Installment Amount</Text>
            <Text style={s.detailValue}>{formatPrice(laybye.installmentPlan?.installmentAmount || 0)}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Deposit</Text>
            <Text style={s.detailValue}>{formatPrice(laybye.depositAmount || 0)}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Next Payment</Text>
            <Text style={[s.detailValue, isOverdue && { color: colors.red500 }]}>
              {laybye.nextPaymentDate ? new Date(laybye.nextPaymentDate).toLocaleDateString("en-ZA") : "N/A"}
            </Text>
          </View>
          {laybye.expiryDate && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Expires</Text>
              <Text style={s.detailValue}>{new Date(laybye.expiryDate).toLocaleDateString("en-ZA")}</Text>
            </View>
          )}
        </View>

        {/* Products */}
        {laybye.order?.items && laybye.order.items.filter((i: any) => i.isLaybye).length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Products on Laybye</Text>
            {laybye.order.items.filter((i: any) => i.isLaybye).map((item: any, idx: number) => (
              <View key={idx} style={s.productRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray900 }} numberOfLines={2}>
                    {item.product?.name || item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>
                    Qty: {item.quantity} × {formatPrice(item.price || 0)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gray900 }}>
                  {formatPrice(item.total || (item.price * item.quantity) || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment History */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Payment History ({laybye.payments?.length || 0})</Text>
          {(!laybye.payments || laybye.payments.length === 0) ? (
            <Text style={{ fontSize: 13, color: colors.gray400, textAlign: "center", paddingVertical: 12 }}>No payments recorded yet</Text>
          ) : (
            laybye.payments.map((p: any, idx: number) => {
              const psc = getPaymentStatusColor(p.status);
              return (
                <View key={idx} style={[s.paymentRow, p.status === "pending" && { backgroundColor: "#fffbeb" }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gray900 }}>{formatPrice(p.amount || 0)}</Text>
                      <View style={[s.badge, { backgroundColor: psc.bg }]}>
                        <Text style={[s.badgeText, { color: psc.text }]}>{p.status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>
                      {p.paymentMethod || "—"} • {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-ZA") : "N/A"}
                    </Text>
                    {p.note ? <Text style={{ fontSize: 11, color: colors.gray400, marginTop: 1 }}>{p.note}</Text> : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Make Payment Button — above BottomTabBar in flex layout */}
      {laybye.status === "active" && (
        <View style={s.payBarInline}>
          <Pressable onPress={openPayModal} style={s.payBtn}>
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={s.payBtnText}>Make Payment</Text>
          </Pressable>
        </View>
      )}

      {/* ─── Payment Modal ─── */}
      <Modal visible={showPayModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {payStep === "success" ? "Payment Submitted" : "Make a Payment"}
              </Text>
              <Text style={s.modalSub}>Laybye #{laybye.laybyeNumber || laybye._id?.slice(-6)}</Text>
              <Pressable onPress={closePayModal} style={s.modalClose}>
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {/* Step 1: Amount */}
              {payStep === "amount" && (
                <View style={s.modalBody}>
                  <View style={s.amountBox}>
                    <View style={s.amountCol}>
                      <Text style={s.amountLabel}>Outstanding</Text>
                      <Text style={s.amountValue}>{formatPrice(effRemaining)}</Text>
                      {hasPending && <Text style={{ fontSize: 10, color: "#d97706" }}>Pending deducted</Text>}
                    </View>
                    <View style={s.amountCol}>
                      <Text style={s.amountLabel}>Suggested</Text>
                      <Text style={s.amountValue}>{formatPrice(Math.min(laybye.installmentPlan?.installmentAmount || 0, effRemaining))}</Text>
                    </View>
                  </View>

                  {effRemaining <= 0 ? (
                    <View style={{ backgroundColor: "#fef3c7", padding: 12, marginTop: 12 }}>
                      <Text style={{ fontSize: 13, color: "#d97706", fontWeight: "600" }}>Pending payments cover the full balance. Please wait for verification.</Text>
                    </View>
                  ) : (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 6 }}>Payment Amount</Text>
                      <TextInput
                        style={s.input}
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        placeholder={formatPrice(Math.min(laybye?.installmentPlan?.installmentAmount || 0, effRemaining))}
                        placeholderTextColor={colors.gray400}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}

                  <View style={s.modalFooter}>
                    <Pressable onPress={closePayModal} style={s.secondaryBtn}>
                      <Text style={s.secondaryBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPayStep("method")}
                      disabled={effRemaining <= 0 || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > convertFromBase(effRemaining) + 0.01}
                      style={[s.primaryBtn, (effRemaining <= 0 || !paymentAmount || parseFloat(paymentAmount) <= 0) && { opacity: 0.5 }]}
                    >
                      <Text style={s.primaryBtnText}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 2: Choose Method */}
              {payStep === "method" && (
                <View style={s.modalBody}>
                  <Text style={{ fontSize: 13, color: colors.gray600, marginBottom: 4 }}>Amount: <Text style={{ fontWeight: "700", color: colors.gray900 }}>{formatPrice(convertToBase(parseFloat(paymentAmount)))}</Text></Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray700, marginBottom: 12 }}>How would you like to pay?</Text>

                  {/* Dynamic methods from admin — shown first under "Popular Methods" */}
                  {dynamicMethods.length > 0 && (
                    <>
                      <Text style={s.methodGroupLabel}>Popular Methods</Text>
                      {dynamicMethods.map((pm: any) => {
                        const pmId = pm.id || pm._id || pm.key || pm.label;
                        return (
                          <Pressable key={pmId} onPress={() => { setPaymentMethod(pmId); setPayStep("dynamic"); }} style={s.methodCard}>
                            <View style={[s.methodIcon, { backgroundColor: "#fef3c7" }]}>
                              {pm.displayType === "image" && pm.image
                                ? <Image source={{ uri: pm.image }} style={{ width: 32, height: 32 }} contentFit="contain" />
                                : <Ionicons name={(pm.icon as any) || "wallet-outline"} size={20} color="#d97706" />}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={s.methodTitle}>{pm.label || pm.name}</Text>
                              {pm.description ? <Text style={s.methodDesc}>{pm.description}</Text> : null}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                          </Pressable>
                        );
                      })}
                      <Text style={[s.methodGroupLabel, { marginTop: 8 }]}>Other Options</Text>
                    </>
                  )}

                  <Pressable onPress={() => { setPaymentMethod("eft"); setPayStep("eft"); }} style={s.methodCard}>
                    <View style={[s.methodIcon, { backgroundColor: "#dbeafe" }]}>
                      <Ionicons name="card-outline" size={20} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.methodTitle}>EFT / Bank Transfer</Text>
                      <Text style={s.methodDesc}>Transfer funds to our bank account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                  </Pressable>

                  <Pressable onPress={() => { setPaymentMethod("cash"); setPayStep("cash"); }} style={s.methodCard}>
                    <View style={[s.methodIcon, { backgroundColor: "#dcfce7" }]}>
                      <Ionicons name="cash-outline" size={20} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.methodTitle}>Cash Payment</Text>
                      <Text style={s.methodDesc}>Record a cash payment for admin verification</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
                  </Pressable>

                  <Pressable onPress={() => setPayStep("amount")} style={[s.secondaryBtn, { marginTop: 12 }]}>
                    <Text style={s.secondaryBtnText}>← Back</Text>
                  </Pressable>
                </View>
              )}

              {/* Step 3a: EFT */}
              {payStep === "eft" && (
                <View style={s.modalBody}>
                  <View style={{ backgroundColor: "#dbeafe", padding: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#1d4ed8" }}>EFT / Bank Transfer</Text>
                    <Text style={{ fontSize: 12, color: "#2563eb", marginTop: 2 }}>
                      Please transfer {formatPrice(convertToBase(parseFloat(paymentAmount)))} to one of the accounts below.
                    </Text>
                  </View>

                  {bankDetails.length > 0 ? bankDetails.map((bank: any, idx: number) => (
                    <View key={idx} style={{ backgroundColor: colors.gray50, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.gray200 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 6 }}>{bank.bankName}</Text>
                      {bank.accountName && <DetailItem label="Account Name" value={bank.accountName} />}
                      {bank.accountNumber && <DetailItem label="Account No." value={bank.accountNumber} />}
                      {bank.branchCode && <DetailItem label="Branch Code" value={bank.branchCode} />}
                      {bank.accountType && <DetailItem label="Account Type" value={bank.accountType} />}
                      {bank.reference && <DetailItem label="Reference" value={bank.reference} />}
                    </View>
                  )) : (
                    <Text style={{ fontSize: 13, color: colors.gray500, textAlign: "center", paddingVertical: 12 }}>No bank details configured. Contact the store.</Text>
                  )}

                  <View style={{ backgroundColor: "#fef3c7", padding: 10, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: "#d97706" }}>Your payment will be marked as pending until the store verifies the funds.</Text>
                  </View>

                  <View style={s.modalFooter}>
                    <Pressable onPress={() => setPayStep("method")} style={s.secondaryBtn}>
                      <Text style={s.secondaryBtnText}>← Back</Text>
                    </Pressable>
                    <Pressable onPress={handleSubmitPayment} disabled={submitting} style={[s.primaryBtn, submitting && { opacity: 0.5 }]}>
                      {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>I've Made the Transfer</Text>}
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 3b: Cash */}
              {payStep === "cash" && (
                <View style={s.modalBody}>
                  <View style={{ backgroundColor: "#dcfce7", padding: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#15803d" }}>Cash Payment</Text>
                    <Text style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>
                      Recording a cash payment of {formatPrice(convertToBase(parseFloat(paymentAmount)))}.
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "#fef3c7", padding: 10 }}>
                    <Text style={{ fontSize: 11, color: "#d97706" }}>Your payment will be marked as pending until the store admin verifies it.</Text>
                  </View>
                  <View style={s.modalFooter}>
                    <Pressable onPress={() => setPayStep("method")} style={s.secondaryBtn}>
                      <Text style={s.secondaryBtnText}>← Back</Text>
                    </Pressable>
                    <Pressable onPress={handleSubmitPayment} disabled={submitting} style={[s.primaryBtn, submitting && { opacity: 0.5 }]}>
                      {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Submit Cash Payment</Text>}
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 3c: Dynamic payment method */}
              {payStep === "dynamic" && (() => {
                const selectedPm = dynamicMethods.find((m) => (m.id || m._id || m.key || m.label) === paymentMethod);
                return (
                  <View style={s.modalBody}>
                    <View style={{ backgroundColor: "#fef3c7", padding: 12, marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#d97706" }}>{selectedPm?.label || paymentMethod}</Text>
                      <Text style={{ fontSize: 12, color: "#d97706", marginTop: 2 }}>
                        Please make a payment of {formatPrice(convertToBase(parseFloat(paymentAmount)))} using {selectedPm?.label || paymentMethod} and tap "I've Paid" below.
                      </Text>
                    </View>
                    {selectedPm?.displayType === "image" && selectedPm?.image && (
                      <Image source={{ uri: resolveImageUrl(selectedPm.image) }} style={{ width: 120, height: 48, alignSelf: "center", marginBottom: 12 }} contentFit="contain" />
                    )}
                    {selectedPm?.instructions && (
                      <Text style={{ fontSize: 13, color: colors.gray600, marginBottom: 12, lineHeight: 20 }}>{selectedPm.instructions}</Text>
                    )}
                    <View style={{ backgroundColor: "#fef3c7", padding: 10, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: "#d97706" }}>Your payment will be marked as pending until the store verifies the funds.</Text>
                    </View>
                    <View style={s.modalFooter}>
                      <Pressable onPress={() => setPayStep("method")} style={s.secondaryBtn}>
                        <Text style={s.secondaryBtnText}>← Back</Text>
                      </Pressable>
                      <Pressable onPress={handleSubmitPayment} disabled={submitting} style={[s.primaryBtn, submitting && { opacity: 0.5 }]}>
                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>I've Paid</Text>}
                      </Pressable>
                    </View>
                  </View>
                );
              })()}

              {/* Success */}
              {payStep === "success" && (
                <View style={[s.modalBody, { alignItems: "center" }]}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray900, marginBottom: 6 }}>Payment Submitted</Text>
                  <Text style={{ fontSize: 13, color: colors.gray600, textAlign: "center", lineHeight: 20 }}>
                    Your {paymentMethod === "eft" ? "EFT" : paymentMethod === "cash" ? "cash" : (dynamicMethods.find((m) => (m.id || m._id || m.key || m.label) === paymentMethod)?.label || paymentMethod)} payment of {formatPrice(convertToBase(parseFloat(paymentAmount)))} has been recorded and is awaiting verification.
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.gray400, marginTop: 6 }}>You will be notified once confirmed.</Text>
                  <Pressable onPress={closePayModal} style={[s.primaryBtn, { marginTop: 16, width: "100%" }]}>
                    <Text style={s.primaryBtnText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomTabBar />
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
      <Text style={{ fontSize: 12, color: colors.gray500 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray900 }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: colors.gray900, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },

  card: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  progressBar: { height: 8, backgroundColor: colors.gray200, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: colors.primary },

  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  statBox: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 10, color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: "700", color: colors.gray900, marginTop: 2 },

  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  detailLabel: { fontSize: 13, color: colors.gray500 },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.gray900 },

  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray50 },

  paymentRow: { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },

  payBarInline: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  payBtn: { backgroundColor: colors.primary, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
  modalHeader: { backgroundColor: colors.gray900, paddingHorizontal: 20, paddingVertical: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalSub: { fontSize: 13, color: colors.gray400, marginTop: 2 },
  modalClose: { position: "absolute", top: 16, right: 16 },
  modalBody: { padding: 20 },
  modalFooter: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 16 },

  amountBox: { flexDirection: "row", backgroundColor: colors.gray50, padding: 12 },
  amountCol: { flex: 1, alignItems: "center" },
  amountLabel: { fontSize: 11, color: colors.gray500 },
  amountValue: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginTop: 2 },

  input: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colors.gray900 },

  methodGroupLabel: { fontSize: 10, fontWeight: "700", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  methodCard: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, borderColor: colors.gray200, marginBottom: 8, gap: 12 },
  methodIcon: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 14, fontWeight: "600", color: colors.gray900 },
  methodDesc: { fontSize: 11, color: colors.gray500, marginTop: 1 },

  primaryBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.gray200 },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.gray700 },
});
