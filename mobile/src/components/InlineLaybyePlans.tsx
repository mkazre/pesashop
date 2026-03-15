import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, Switch, StyleSheet, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCurrencyStore } from "@/store";
import { laybyPlansAPI } from "@/services/api";
import { colors } from "@/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface InlineLaybyePlansProps {
  product: any;
  onLaybyeSelect?: (data: any) => void;
}

export default function InlineLaybyePlans({
  product,
  onLaybyeSelect,
}: InlineLaybyePlansProps) {
  const { formatPrice } = useCurrencyStore();
  const [enabled, setEnabled] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const productPrice = product?.salePrice || product?.regularPrice || 0;

  useEffect(() => {
    if (!product?._id) return;
    laybyPlansAPI
      .getActive()
      .then((res) => {
        const raw = res.data?.data || res.data || [];
        const filtered = (Array.isArray(raw) ? raw : []).filter((p: any) => {
          if (!p.isActive) return false;
          if (p.minimumProductValue > 0 && productPrice < p.minimumProductValue)
            return false;
          if (p.maximumProductValue > 0 && productPrice > p.maximumProductValue)
            return false;
          return true;
        });
        setPlans(filtered);
      })
      .catch(() => setPlans([]));
  }, [product?._id, productPrice]);

  const selectedPlan =
    plans.find((p) => p._id === selectedPlanId) || plans[0] || null;

  const calcDeposit = (plan: any) => {
    if (!plan) return 0;
    if (plan.depositAmount > 0)
      return Math.min(plan.depositAmount, productPrice);
    return (productPrice * (plan.depositPercentage || 20)) / 100;
  };

  const calcInstallment = (plan: any) => {
    if (!plan) return 0;
    const deposit = calcDeposit(plan);
    const remaining = productPrice - deposit;
    return remaining / (plan.numberOfPayments || 1);
  };

  const deposit = calcDeposit(selectedPlan);
  const installment = calcInstallment(selectedPlan);

  const frequencyLabel = (freq: string) => {
    switch (freq) {
      case "weekly":
        return "/week";
      case "biweekly":
        return "/2 weeks";
      case "monthly":
        return "/month";
      default:
        return "/month";
    }
  };

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    if (val && selectedPlan) {
      if (!selectedPlanId) setSelectedPlanId(selectedPlan._id);
      onLaybyeSelect?.({
        plan: selectedPlan,
        deposit: calcDeposit(selectedPlan),
        installment: calcInstallment(selectedPlan),
      });
    } else {
      onLaybyeSelect?.(null);
    }
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlanId(plan._id);
    onLaybyeSelect?.({
      plan,
      deposit: calcDeposit(plan),
      installment: calcInstallment(plan),
    });
  };

  if (!plans.length) return null;

  return (
    <View style={s.container}>
      {/* Toggle */}
      <View style={s.toggleRow}>
        <View style={s.toggleLeft}>
          <Ionicons name="time-outline" size={16} color={colors.amber500} />
          <Text style={s.toggleLabel}>Pay with Layby</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.gray200, true: colors.primaryLight }}
          thumbColor={enabled ? colors.primary : colors.gray400}
        />
      </View>

      {enabled && (
        <>
          {/* Plan selector */}
          {plans.length > 1 && plans.length <= 2 && (
            <View style={s.plansList}>
              {plans.map((plan) => {
                const isSelected = plan._id === (selectedPlanId || plans[0]?._id);
                return (
                  <Pressable
                    key={plan._id}
                    onPress={() => handleSelectPlan(plan)}
                    style={[s.planCard, isSelected && s.planCardActive]}
                  >
                    <Text
                      style={[
                        s.planName,
                        isSelected && { color: colors.primary },
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <Text style={s.planDetail}>
                      {plan.numberOfPayments} payments
                      {frequencyLabel(plan.paymentFrequency)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {plans.length > 2 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={plans}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
              snapToInterval={SCREEN_WIDTH * 0.55 + 10}
              decelerationRate="fast"
              renderItem={({ item: plan }) => {
                const isSelected = plan._id === (selectedPlanId || plans[0]?._id);
                return (
                  <Pressable
                    onPress={() => handleSelectPlan(plan)}
                    style={[s.carouselCard, isSelected && s.planCardActive]}
                  >
                    <Text
                      style={[
                        s.planName,
                        isSelected && { color: colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {plan.name}
                    </Text>
                    <Text style={s.planDetail}>
                      {plan.numberOfPayments} payments
                      {frequencyLabel(plan.paymentFrequency)}
                    </Text>
                    <Text style={[s.planDeposit, isSelected && { color: colors.primary }]}>
                      Deposit: {formatPrice(calcDeposit(plan))}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Summary */}
          {selectedPlan && (
            <View style={s.summary}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Deposit</Text>
                <Text style={s.summaryVal}>{formatPrice(deposit)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>
                  {selectedPlan.numberOfPayments} ×{" "}
                  {frequencyLabel(selectedPlan.paymentFrequency)} installments
                </Text>
                <Text style={s.summaryVal}>{formatPrice(installment)}</Text>
              </View>
              <View style={[s.summaryRow, s.summaryTotal]}>
                <Text style={s.summaryTotalLabel}>Total</Text>
                <Text style={s.summaryTotalVal}>
                  {formatPrice(productPrice)}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 14,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: colors.gray800 },
  plansList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  planCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 10,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  carouselCard: {
    width: SCREEN_WIDTH * 0.55,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 12,
  },
  planName: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  planDetail: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  planDeposit: { fontSize: 11, fontWeight: "600", color: colors.gray700, marginTop: 4 },
  summary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 12, color: colors.gray600 },
  summaryVal: { fontSize: 12, fontWeight: "600", color: colors.gray800 },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 6,
    marginTop: 2,
  },
  summaryTotalLabel: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  summaryTotalVal: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
