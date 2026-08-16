import { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { SUPPORTED_LANGUAGES, setLanguage } from "@/i18n";
import { settingsAPI } from "@/services/api";
import { colors } from "@/theme";

export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [enabledCodes, setEnabledCodes] = useState<string[] | null>(null);

  useEffect(() => {
    // Same admin-controlled visibility as web's LanguagePicker.jsx (Settings
    // → Translations → Enabled Languages) — English + whatever's listed.
    settingsAPI.getPublic()
      .then((res) => setEnabledCodes(res.data?.data?.enabledLanguages || null))
      .catch(() => {});
  }, []);

  const languages = enabledCodes
    ? SUPPORTED_LANGUAGES.filter((l) => l.code === "en" || enabledCodes.includes(l.code))
    : SUPPORTED_LANGUAGES;

  if (languages.length <= 1) return null;

  const current = languages.find((l) => l.code === i18n.resolvedLanguage) || languages[0];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.trigger}>
        <Ionicons name="language-outline" size={13} color={colors.gray600} />
        <Text style={s.triggerText}>{current.code.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={12} color={colors.gray500} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.dropdown}>
            <Text style={s.dropdownTitle}>Select Language</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const active = current.code === item.code;
                return (
                  <Pressable
                    onPress={() => {
                      setLanguage(item.code);
                      setOpen(false);
                    }}
                    style={[s.option, active && s.optionActive]}
                  >
                    <Text style={[s.optionNative, active && { color: colors.primary, fontWeight: "700" }]}>{item.nativeLabel}</Text>
                    <Text style={s.optionLabel} numberOfLines={1}>{item.label}</Text>
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
    gap: 3,
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
  optionNative: { fontSize: 14, fontWeight: "600", color: colors.gray800, width: 90 },
  optionLabel: { flex: 1, fontSize: 13, color: colors.gray500 },
});
