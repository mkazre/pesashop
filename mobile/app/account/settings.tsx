import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import BottomTabBar from "@/components/BottomTabBar";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAuth } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !email.trim()) {
      Toast.show({ type: "error", text1: "First name and email are required" });
      return;
    }
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      const updatedUser = res.data?.data || res.data?.user || res.data;
      if (updatedUser) {
        const token = useAuthStore.getState().token;
        if (token) await setAuth(updatedUser, token);
      }
      Toast.show({ type: "success", text1: "Profile updated" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Toast.show({ type: "error", text1: "Please fill in all password fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "New passwords don't match" });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: "Password must be at least 6 characters" });
      return;
    }
    setChangingPassword(true);
    try {
      await authAPI.updateProfile({
        currentPassword,
        newPassword,
      });
      Toast.show({ type: "success", text1: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Toast.show({ type: "info", text1: "Please contact support to delete your account" });
          },
        },
      ]
    );
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Account Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile Information</Text>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>First Name *</Text>
              <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.gray400} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Last Name</Text>
              <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.gray400} />
            </View>
          </View>

          <Text style={s.fieldLabel}>Email *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.gray400} />

          <Text style={s.fieldLabel}>Phone</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+27..." keyboardType="phone-pad" placeholderTextColor={colors.gray400} />

          <Pressable onPress={handleSaveProfile} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={s.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </View>

        {/* Password Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Change Password</Text>

          <Text style={s.fieldLabel}>Current Password</Text>
          <TextInput style={s.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" secureTextEntry placeholderTextColor={colors.gray400} />

          <Text style={s.fieldLabel}>New Password</Text>
          <TextInput style={s.input} value={newPassword} onChangeText={setNewPassword} placeholder="New password" secureTextEntry placeholderTextColor={colors.gray400} />

          <Text style={s.fieldLabel}>Confirm New Password</Text>
          <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry placeholderTextColor={colors.gray400} />

          <Pressable onPress={handleChangePassword} disabled={changingPassword} style={[s.saveBtn, { backgroundColor: colors.gray900 }, changingPassword && { opacity: 0.5 }]}>
            <Text style={s.saveBtnText}>{changingPassword ? "Changing..." : "Change Password"}</Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={[s.section, { borderTopWidth: 1, borderTopColor: "#fee2e2" }]}>
          <Text style={[s.sectionTitle, { color: colors.red500 }]}>Danger Zone</Text>
          <Pressable onPress={handleDeleteAccount} style={s.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.red500} />
            <Text style={s.deleteBtnText}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  section: { backgroundColor: colors.white, marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 14 },
  input: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.gray800 },
  row: { flexDirection: "row", gap: 12 },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "#fecaca", alignSelf: "flex-start" },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: colors.red500 },
});
