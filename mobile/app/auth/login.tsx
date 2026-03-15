import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: "Please fill in all fields" });
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ email: email.trim(), password });
      const { user, token } = res.data;
      await setAuth(user, token);
      Toast.show({ type: "success", text1: `Welcome back, ${user.firstName || user.name || 'there'}!` });
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ls.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[ls.content, { paddingTop: insets.top + 20 }]}>
          <Pressable onPress={() => router.back()} style={ls.closeBtn}>
            <Ionicons name="close" size={22} color={colors.gray700} />
          </Pressable>

          <Image source={LOGO} style={ls.logo} contentFit="contain" />
          <Text style={ls.heading}>Welcome back</Text>
          <Text style={ls.subheading}>Sign in to your Pesa Shop account</Text>

          <Text style={ls.label}>Email</Text>
          <View style={ls.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.gray400} />
            <TextInput style={ls.input} placeholder="you@example.com" placeholderTextColor={colors.gray400} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          </View>

          <Text style={ls.label}>Password</Text>
          <View style={[ls.inputWrap, { marginBottom: 8 }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.gray400} />
            <TextInput style={ls.input} placeholder="Your password" placeholderTextColor={colors.gray400} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="password" />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.gray400} />
            </Pressable>
          </View>

          <Pressable onPress={() => router.push("/auth/forgot-password" as any)} style={ls.forgotBtn}>
            <Text style={ls.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable onPress={handleLogin} disabled={loading} style={[ls.submitBtn, loading && { opacity: 0.7 }]}>
            <Text style={ls.submitText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </Pressable>

          <View style={ls.linkRow}>
            <Text style={ls.linkLabel}>Don't have an account? </Text>
            <Pressable onPress={() => router.replace("/auth/register" as any)}>
              <Text style={ls.linkAction}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ls = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 24 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  logo: { width: 160, height: 50, marginBottom: 20, alignSelf: "center" } as any,
  heading: { fontSize: 30, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  subheading: { fontSize: 16, color: colors.gray500, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, height: 48, marginBottom: 16, borderWidth: 1, borderColor: colors.gray200 },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.gray800 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center", marginBottom: 16 },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
  linkLabel: { fontSize: 14, color: colors.gray500 },
  linkAction: { fontSize: 14, color: colors.primary, fontWeight: "700" },
});
