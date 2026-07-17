import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/theme";
import { useAuthStore } from "@/store";
import { applyBlockStyle } from "./applyBlockStyle";

export default function LoginFormBlock({ block }: { block: any }) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => !!s.token);
  const { title, description, buttonText, style } = block.props || {};

  if (isLoggedIn) return null;

  return (
    <View style={[{ backgroundColor: colors.gray50, padding: 20 }, applyBlockStyle(style)]}>
      {!!title && <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray900 }}>{title}</Text>}
      {!!description && <Text style={{ fontSize: 13, color: colors.gray500, marginTop: 4 }}>{description}</Text>}
      <Pressable
        onPress={() => router.push("/auth/login" as any)}
        style={{ marginTop: 14, backgroundColor: colors.primary, paddingVertical: 12, alignItems: "center" }}
      >
        <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>{buttonText || "Sign In"}</Text>
      </Pressable>
    </View>
  );
}
