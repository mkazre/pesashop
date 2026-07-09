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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

const LOGO = require("@/../assets/pesashop-logo.png");

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { ref: referralCode } = useLocalSearchParams<{ ref?: string }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: "Please fill in all required fields" });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: "error", text1: "Password must be at least 6 characters" });
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        referralCode: referralCode || undefined,
      });
      const { user, token } = res.data;
      await setAuth(user, token);
      Toast.show({ type: "success", text1: `Welcome, ${user.firstName}!` });
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={rs.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[rs.content, { paddingTop: insets.top + 20 }]}>
          <Pressable onPress={() => router.back()} style={rs.closeBtn}>
            <Ionicons name="close" size={22} color={colors.gray700} />
          </Pressable>

          <Image source={LOGO} style={rs.logo} contentFit="contain" />
          <Text style={rs.heading}>Create Account</Text>
          <Text style={rs.subheading}>Join Pesa Shop for the best deals</Text>

          {referralCode && (
            <View style={rs.referralBanner}>
              <Ionicons name="gift-outline" size={16} color={colors.primary} />
              <Text style={rs.referralBannerText}>Signing up with referral code <Text style={{ fontWeight: "700" }}>{referralCode.toUpperCase()}</Text></Text>
            </View>
          )}

          <Text style={rs.label}>First Name *</Text>
          <View style={rs.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="John" placeholderTextColor={colors.gray400} value={firstName} onChangeText={setFirstName} autoComplete="name" />
          </View>

          <Text style={rs.label}>Last Name *</Text>
          <View style={rs.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="Doe" placeholderTextColor={colors.gray400} value={lastName} onChangeText={setLastName} autoComplete="name-family" />
          </View>

          <Text style={rs.label}>Email *</Text>
          <View style={rs.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="you@example.com" placeholderTextColor={colors.gray400} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          </View>

          <Text style={rs.label}>Phone</Text>
          <View style={rs.inputWrap}>
            <Ionicons name="call-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="+27 12 345 6789" placeholderTextColor={colors.gray400} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          </View>

          <Text style={rs.label}>Password *</Text>
          <View style={rs.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="Min 6 characters" placeholderTextColor={colors.gray400} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.gray400} />
            </Pressable>
          </View>

          <Text style={rs.label}>Confirm Password *</Text>
          <View style={[rs.inputWrap, { marginBottom: 24 }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.gray400} />
            <TextInput style={rs.input} placeholder="Repeat password" placeholderTextColor={colors.gray400} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          </View>

          <Pressable onPress={handleRegister} disabled={loading} style={[rs.submitBtn, loading && { opacity: 0.7 }]}>
            <Text style={rs.submitText}>{loading ? "Creating account..." : "Create Account"}</Text>
          </Pressable>

          <View style={rs.linkRow}>
            <Text style={rs.linkLabel}>Already have an account? </Text>
            <Pressable onPress={() => router.replace("/auth/login" as any)}>
              <Text style={rs.linkAction}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const rs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 24 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray50, alignItems: "center", justifyContent: "center", marginBottom: 32 },
  logo: { width: 160, height: 50, marginBottom: 20, alignSelf: "center" } as any,
  heading: { fontSize: 30, fontWeight: "700", color: colors.gray900, marginBottom: 8 },
  referralBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20 },
  referralBannerText: { fontSize: 12, color: colors.primaryDark, flex: 1 },
  subheading: { fontSize: 16, color: colors.gray500, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray50, borderRadius: 0, paddingHorizontal: 12, height: 48, marginBottom: 16, borderWidth: 1, borderColor: colors.gray200 },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.gray800 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 0, alignItems: "center", marginBottom: 16 },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 32 },
  linkLabel: { fontSize: 14, color: colors.gray500 },
  linkAction: { fontSize: 14, color: colors.primary, fontWeight: "700" },
});
