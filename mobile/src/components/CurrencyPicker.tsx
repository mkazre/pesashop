import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCurrencyStore } from "@/store";
import { colors } from "@/theme";

export default function CurrencyPicker() {
  const { currencies, selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);

  const visibleCurrencies = currencies.filter((c) => c.showInFrontend !== false);

  if (visibleCurrencies.length <= 1) return null;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.trigger}>
        <Text style={s.triggerText}>{selectedCurrency?.code || "USD"}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.gray500} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.dropdown}>
            <Text style={s.dropdownTitle}>Select Currency</Text>
            <FlatList
              data={visibleCurrencies}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const active = selectedCurrency?.code === item.code;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedCurrency(item);
                      setOpen(false);
                      // Reload so all prices reflect the new currency
                      setTimeout(() => {
                        if (Platform.OS === "web") {
                          window.location.reload();
                        }
                      }, 100);
                    }}
                    style={[s.option, active && s.optionActive]}
                  >
                    <Text style={[s.optionSymbol, active && { color: colors.primary }]}>{item.symbol}</Text>
                    <Text style={[s.optionCode, active && { color: colors.primary, fontWeight: "700" }]}>{item.code}</Text>
                    <Text style={s.optionName} numberOfLines={1}>{item.name}</Text>
                    {active && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 6,
    backgroundColor: colors.gray50,
  },
  triggerText: { fontSize: 12, fontWeight: "600", color: colors.gray700 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: 360,
    padding: 16,
  },
  dropdownTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  optionActive: { backgroundColor: colors.primaryLight },
  optionSymbol: { fontSize: 16, fontWeight: "700", color: colors.gray600, width: 28 },
  optionCode: { fontSize: 14, fontWeight: "600", color: colors.gray800, width: 40 },
  optionName: { flex: 1, fontSize: 13, color: colors.gray500 },
});
