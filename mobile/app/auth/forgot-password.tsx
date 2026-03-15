import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { authAPI } from "@/services/api";
import { colors } from "@/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email" });
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
      Toast.show({ type: "success", text1: "Reset link sent to your email" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset link";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={fs.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[fs.content, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={fs.closeBtn}>
          <Ionicons name="close" size={22} color={colors.gray700} />
        </Pressable>

        <Text style={fs.heading}>Forgot Password</Text>
        <Text style={fs.subheading}>Enter your email and we'll send you a reset link</Text>

        {sent ? (
          <View style={fs.sentWrap}>
            <View style={fs.sentIcon}>
              <Ionicons name="checkmark-circle" size={40} color={colors.green500} />
            </View>
            <Text style={fs.sentTitle}>Check your email</Text>
            <Text style={fs.sentSub}>We've sent a password reset link to {email}</Text>
            <Pressable onPress={() => router.replace("/auth/login" as any)} style={fs.backBtn}>
              <Text style={fs.backBtnText}>Back to Login</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={fs.label}>Email</Text>
            <View style={[fs.inputWrap, { marginBottom: 24 }]}>
              <Ionicons name="mail-outline" size={18} color={colors.gray400} />
              <TextInput style={fs.input} placeholder="you@example.com" placeholderTextColor={colors.gray400} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoFocus />
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} style={[fs.submitBtn, loading && { opacity: 0.7 }]}>
              <Text style={fs.submitText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const fs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 24 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  heading: { fontSize: 30, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  subheading: { fontSize: 16, color: colors.gray500, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, height: 48, marginBottom: 16, borderWidth: 1, borderColor: colors.gray200 },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.gray800 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center" },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  sentWrap: { alignItems: "center", paddingVertical: 32 },
  sentIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  sentTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  sentSub: { fontSize: 14, color: colors.gray500, textAlign: "center" },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 0, marginTop: 24 },
  backBtnText: { color: colors.white, fontWeight: "600" },
});
