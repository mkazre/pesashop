import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { authAPI } from "@/services/api";
import { colors } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

interface Address {
  _id: string;
  type?: "shipping" | "billing";
  label?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}

const EMPTY_ADDRESS = {
  type: "shipping" as "shipping" | "billing",
  label: "",
  firstName: "",
  lastName: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "South Africa",
  phone: "",
};

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await authAPI.getAddresses();
      setAddresses(res.data?.data || res.data?.addresses || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, []);

  const handleSave = async () => {
    if (!form.street.trim() || !form.city.trim()) {
      Toast.show({ type: "error", text1: "Street and city are required" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await authAPI.updateAddress(editingId, form);
        Toast.show({ type: "success", text1: "Address updated" });
      } else {
        await authAPI.addAddress(form);
        Toast.show({ type: "success", text1: "Address added" });
      }
      setEditing(false);
      setEditingId(null);
      setForm(EMPTY_ADDRESS);
      fetchAddresses();
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed to save address" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await authAPI.deleteAddress(id);
            Toast.show({ type: "success", text1: "Address deleted" });
            fetchAddresses();
          } catch {
            Toast.show({ type: "error", text1: "Failed to delete" });
          }
        }
      },
    ]);
  };

  const startEdit = (addr: Address) => {
    setForm({
      type: addr.type || "shipping",
      label: addr.label || "",
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      street: addr.street || "",
      street2: addr.street2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "South Africa",
      phone: addr.phone || "",
    });
    setEditingId(addr._id);
    setEditing(true);
  };

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={colors.gray800} /></Pressable>
          <Text style={s.headerTitle}>My Addresses</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => editing ? (setEditing(false), setEditingId(null), setForm(EMPTY_ADDRESS)) : router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>{editing ? (editingId ? "Edit Address" : "Add Address") : "My Addresses"}</Text>
        {!editing ? (
          <Pressable onPress={() => { setForm(EMPTY_ADDRESS); setEditingId(null); setEditing(true); }} style={s.addBtn}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      {editing ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <Text style={s.fieldLabel}>Address Type *</Text>
          <View style={s.typePicker}>
            {(["shipping", "billing"] as const).map((t) => (
              <Pressable key={t} onPress={() => setForm({ ...form, type: t })} style={[s.typeOption, form.type === t && s.typeOptionActive]}>
                <Ionicons name={t === "shipping" ? "cube-outline" : "card-outline"} size={16} color={form.type === t ? "#fff" : colors.gray600} />
                <Text style={[s.typeOptionText, form.type === t && { color: "#fff" }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.fieldLabel}>Label (e.g. Home, Work)</Text>
          <TextInput style={s.input} value={form.label} onChangeText={(t) => setForm({ ...form, label: t })} placeholder="Home" placeholderTextColor={colors.gray400} />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>First Name</Text>
              <TextInput style={s.input} value={form.firstName} onChangeText={(t) => setForm({ ...form, firstName: t })} placeholder="First name" placeholderTextColor={colors.gray400} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Last Name</Text>
              <TextInput style={s.input} value={form.lastName} onChangeText={(t) => setForm({ ...form, lastName: t })} placeholder="Last name" placeholderTextColor={colors.gray400} />
            </View>
          </View>

          <Text style={s.fieldLabel}>Street Address *</Text>
          <TextInput style={s.input} value={form.street} onChangeText={(t) => setForm({ ...form, street: t })} placeholder="123 Main St" placeholderTextColor={colors.gray400} />

          <Text style={s.fieldLabel}>Street Address 2</Text>
          <TextInput style={s.input} value={form.street2} onChangeText={(t) => setForm({ ...form, street2: t })} placeholder="Apt, Suite, etc." placeholderTextColor={colors.gray400} />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>City *</Text>
              <TextInput style={s.input} value={form.city} onChangeText={(t) => setForm({ ...form, city: t })} placeholder="City" placeholderTextColor={colors.gray400} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Province/State</Text>
              <TextInput style={s.input} value={form.state} onChangeText={(t) => setForm({ ...form, state: t })} placeholder="Province" placeholderTextColor={colors.gray400} />
            </View>
          </View>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Postal Code</Text>
              <TextInput style={s.input} value={form.postalCode} onChangeText={(t) => setForm({ ...form, postalCode: t })} placeholder="0001" keyboardType="numeric" placeholderTextColor={colors.gray400} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Country</Text>
              <TextInput style={s.input} value={form.country} onChangeText={(t) => setForm({ ...form, country: t })} placeholder="South Africa" placeholderTextColor={colors.gray400} />
            </View>
          </View>

          <Text style={s.fieldLabel}>Phone</Text>
          <TextInput style={s.input} value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} placeholder="+27..." keyboardType="phone-pad" placeholderTextColor={colors.gray400} />

          <Pressable onPress={handleSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.5 }]}>
            <Text style={s.saveBtnText}>{saving ? "Saving..." : (editingId ? "Update Address" : "Add Address")}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAddresses(); }} />}
        >
          {addresses.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="location-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyText}>No saved addresses</Text>
              <Text style={s.emptySub}>Add an address for faster checkout</Text>
            </View>
          ) : (
            addresses.map((addr) => (
              <View key={addr._id} style={s.card}>
                <View style={s.cardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <Text style={s.cardTitle}>{addr.label || "Address"}</Text>
                    {addr.type && <View style={[s.defaultBadge, { backgroundColor: addr.type === "billing" ? "#dbeafe" : "#dcfce7" }]}><Text style={[s.defaultBadgeText, { color: addr.type === "billing" ? "#1d4ed8" : "#15803d" }]}>{addr.type}</Text></View>}
                    {addr.isDefault && <View style={s.defaultBadge}><Text style={s.defaultBadgeText}>Default</Text></View>}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => startEdit(addr)}><Ionicons name="pencil-outline" size={18} color={colors.gray500} /></Pressable>
                    <Pressable onPress={() => handleDelete(addr._id)}><Ionicons name="trash-outline" size={18} color={colors.red500} /></Pressable>
                  </View>
                </View>
                {(addr.firstName || addr.lastName) && <Text style={s.addrLine}>{addr.firstName} {addr.lastName}</Text>}
                <Text style={s.addrLine}>{addr.street}</Text>
                {addr.street2 && <Text style={s.addrLine}>{addr.street2}</Text>}
                <Text style={s.addrLine}>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}</Text>
                {addr.country && <Text style={s.addrLine}>{addr.country}</Text>}
                {addr.phone && <Text style={[s.addrLine, { color: colors.gray500 }]}>{addr.phone}</Text>}
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  addBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.gray500, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  card: { backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  defaultBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 10, fontWeight: "600", color: "#15803d" },
  addrLine: { fontSize: 13, color: colors.gray700, lineHeight: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 14 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.gray800 },
  row: { flexDirection: "row", gap: 12 },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  typePicker: { flexDirection: "row", gap: 12, marginTop: 4 },
  typeOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: colors.white },
  typeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  typeOptionText: { fontSize: 13, fontWeight: "600", color: colors.gray600 },
});
