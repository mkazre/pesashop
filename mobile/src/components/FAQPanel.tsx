import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme";

const FAQ_KEYS = ["tracking", "returns", "loyalty", "support", "referrals"];

export default function FAQPanel() {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0]);

  return (
    <ScrollView style={fs.container} contentContainerStyle={fs.content}>
      <Text style={fs.title}>{t("chat.faq.title")}</Text>
      {FAQ_KEYS.map((key) => {
        const isOpen = openKey === key;
        return (
          <View key={key} style={fs.item}>
            <Pressable onPress={() => setOpenKey(isOpen ? null : key)} style={fs.question}>
              <Text style={fs.questionText}>{t(`chat.faq.items.${key}.q`)}</Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.gray400}
              />
            </Pressable>
            {isOpen && (
              <MotiView
                from={{ opacity: 0, translateY: -4 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 150 }}
              >
                <Text style={fs.answer}>{t(`chat.faq.items.${key}.a`)}</Text>
              </MotiView>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const fs = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 10 },
  item: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, marginBottom: 8, overflow: "hidden" },
  question: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  questionText: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.gray800 },
  answer: { paddingHorizontal: 12, paddingBottom: 12, fontSize: 13, color: colors.gray600, lineHeight: 19 },
});
