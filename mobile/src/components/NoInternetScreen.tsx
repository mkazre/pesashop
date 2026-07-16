import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface NoInternetScreenProps {
  onRetry: () => void;
  retrying?: boolean;
}

export default function NoInternetScreen({ onRetry, retrying }: NoInternetScreenProps) {
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.primary} />
      </View>
      <Text style={s.title}>No internet connection</Text>
      <Text style={s.message}>
        Check your WiFi or mobile data and try again. PesaShop needs a connection to load products and orders.
      </Text>
      <Pressable onPress={onRetry} disabled={retrying} style={[s.btn, retrying && { opacity: 0.6 }]}>
        <Ionicons name="refresh" size={16} color={colors.white} />
        <Text style={s.btnText}>{retrying ? "Checking..." : "Try Again"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: colors.white },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "700", color: colors.gray800, marginBottom: 8 },
  message: { fontSize: 14, color: colors.gray500, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 0 },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
