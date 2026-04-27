import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
  StyleSheet, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { serviceTypesAPI, serviceRequestsAPI, settingsAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";

const MODES = [
  { value: "repair", label: "Repair", icon: "construct" },
  { value: "install", label: "Install", icon: "flash" },
  { value: "maintain", label: "Maintain", icon: "settings" },
];

export default function ServiceProvidersDirectory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState<any>({});
  const [requestOpen, setRequestOpen] = useState(false);
  const [seedType, setSeedType] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      serviceTypesAPI.getAll().then((r) => r.data?.data || []).catch(() => []),
      settingsAPI?.getPublic?.().then((r: any) => r.data?.data?.servicePageHero || r.data?.servicePageHero || {}).catch(() => ({})),
    ]).then(([types, h]) => {
      setServiceTypes(types);
      setHero(h);
      setLoading(false);
    });
  }, []);

  const openRequest = (type?: any) => {
    setSeedType(type || null);
    setRequestOpen(true);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>Services</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero */}
        <View style={s.hero}>
          {hero?.imageUrl && (
            <Image source={{ uri: resolveImageUrl(hero.imageUrl) }} style={s.heroBg} contentFit="cover" />
          )}
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>{hero?.title || "Professional Services"}</Text>
            <Text style={s.heroSubtitle}>
              {hero?.subtitle || "Book trusted professionals for repairs, installations & maintenance"}
            </Text>
          </View>
        </View>

        {/* Services Grid */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={s.sectionTitle}>Our Services</Text>
          <Text style={s.sectionSub}>Professional services available in your area</Text>

          {loading ? (
            <View style={{ paddingVertical: 32 }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : serviceTypes.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="construct-outline" size={32} color={colors.gray400} />
              <Text style={s.emptyText}>No services listed yet. Check back soon.</Text>
            </View>
          ) : (
            <View style={s.grid}>
              {serviceTypes.map((st) => (
                <Pressable key={st._id} onPress={() => openRequest(st)} style={s.card}>
                  {st.imageUrl ? (
                    <Image source={{ uri: resolveImageUrl(st.imageUrl) }} style={s.cardImg} contentFit="cover" />
                  ) : (
                    <View style={[s.cardImg, s.cardImgFallback]}>
                      <Text style={{ fontSize: 32 }}>{st.icon || "🔧"}</Text>
                    </View>
                  )}
                  <View style={{ padding: 12 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>{st.title}</Text>
                    {!!st.description && (
                      <Text style={s.cardDesc} numberOfLines={2}>{st.description}</Text>
                    )}
                    <View style={s.modeRow}>
                      {(st.serviceModes || []).map((m: string) => (
                        <View key={m} style={s.modeChip}>
                          <Text style={s.modeChipText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* CTAs */}
        <View style={s.ctaWrap}>
          <Pressable onPress={() => openRequest()} style={s.ctaPrimary}>
            <Ionicons name="hand-right" size={16} color="#fff" />
            <Text style={s.ctaPrimaryText}>Request a Service</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/service-providers-portal" as any)}
            style={s.ctaSecondary}
          >
            <Ionicons name="business" size={16} color={colors.gray800} />
            <Text style={s.ctaSecondaryText}>Provider Login & Ad Portal</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ServiceRequestSheet
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
        serviceTypes={serviceTypes}
        initialType={seedType}
      />
    </View>
  );
}

function ServiceRequestSheet({
  visible, onClose, serviceTypes, initialType,
}: {
  visible: boolean;
  onClose: () => void;
  serviceTypes: any[];
  initialType: any;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [modes, setModes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", suburb: "", city: "", province: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedTypeId(initialType?._id || "");
      setModes(initialType?.serviceModes || []);
      setSubmitted(false);
      setDescription("");
      const addr = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
      setForm({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: addr?.address || addr?.line1 || "",
        suburb: addr?.suburb || "",
        city: addr?.city || "",
        province: addr?.province || addr?.state || "",
      });
    }
  }, [visible, initialType?._id, user?._id]);

  const toggleMode = (m: string) =>
    setModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const handleSubmit = async () => {
    if (!selectedTypeId) {
      Toast.show({ type: "error", text1: "Please select a service" });
      return;
    }
    if (!form.firstName || !form.email) {
      Toast.show({ type: "error", text1: "Name and email are required" });
      return;
    }
    setSubmitting(true);
    try {
      await serviceRequestsAPI.submit({
        ...form,
        serviceTypeId: selectedTypeId,
        serviceModes: modes,
        description,
      });
      setSubmitted(true);
    } catch (e: any) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const sheetStyles = {
    input: {
      borderWidth: 1, borderColor: "#e5eae6", padding: 11, fontSize: 14,
      color: "#1a1a1a", backgroundColor: "#fff", borderRadius: 8, marginBottom: 10,
    },
    label: {
      fontSize: 11, fontWeight: "700" as const, color: "#555",
      textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 5,
    },
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Request a Service</Text>
          <Pressable onPress={onClose} style={s.sheetClose}>
            <Ionicons name="close" size={20} color="#555" />
          </Pressable>
        </View>

        {submitted ? (
          <View style={{ padding: 32, alignItems: "center", flex: 1, justifyContent: "center" }}>
            <View style={s.successCircle}>
              <Ionicons name="checkmark" size={32} color="#16a34a" />
            </View>
            <Text style={s.successTitle}>Request Submitted!</Text>
            <Text style={s.successBody}>
              Thank you. We've received your request and will contact you soon to confirm.
            </Text>
            <Pressable onPress={onClose} style={s.successBtn}>
              <Text style={s.successBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Text style={sheetStyles.label}>Service Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {serviceTypes.map((st) => {
                const active = st._id === selectedTypeId;
                return (
                  <Pressable
                    key={st._id}
                    onPress={() => { setSelectedTypeId(st._id); setModes(st.serviceModes || []); }}
                    style={[s.typeChip, active && s.typeChipActive]}
                  >
                    <Text style={[s.typeChipText, active && s.typeChipTextActive]}>{st.title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={sheetStyles.label}>What do you need?</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {MODES.map((m) => {
                const active = modes.includes(m.value);
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => toggleMode(m.value)}
                    style={[s.modeBtn, active && s.modeBtnActive]}
                  >
                    <Ionicons name={m.icon as any} size={16} color={active ? colors.primary : colors.gray500} />
                    <Text style={[s.modeBtnText, active && { color: colors.primary }]}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.label}>First Name *</Text>
                <TextInput
                  style={sheetStyles.input}
                  value={form.firstName}
                  onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
                  placeholder="John"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.label}>Last Name</Text>
                <TextInput
                  style={sheetStyles.input}
                  value={form.lastName}
                  onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
                  placeholder="Smith"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            <Text style={sheetStyles.label}>Email *</Text>
            <TextInput
              style={sheetStyles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />

            <Text style={sheetStyles.label}>Phone</Text>
            <TextInput
              style={sheetStyles.input}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="0712 345 678"
              keyboardType="phone-pad"
              placeholderTextColor="#aaa"
            />

            <Text style={sheetStyles.label}>Address</Text>
            <TextInput
              style={sheetStyles.input}
              value={form.address}
              onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
              placeholder="Street address"
              placeholderTextColor="#aaa"
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={[sheetStyles.input, { flex: 1 }]}
                value={form.suburb}
                onChangeText={(v) => setForm((f) => ({ ...f, suburb: v }))}
                placeholder="Suburb"
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={[sheetStyles.input, { flex: 1 }]}
                value={form.city}
                onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                placeholder="City"
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={[sheetStyles.input, { flex: 1 }]}
                value={form.province}
                onChangeText={(v) => setForm((f) => ({ ...f, province: v }))}
                placeholder="Province"
                placeholderTextColor="#aaa"
              />
            </View>

            <Text style={sheetStyles.label}>Notes</Text>
            <TextInput
              style={[sheetStyles.input, { height: 80, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what needs to be done…"
              multiline
              placeholderTextColor="#aaa"
            />

            <Pressable onPress={handleSubmit} disabled={submitting} style={[s.submitBtn, submitting && { opacity: 0.6 }]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Submit Request</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },

  hero: { position: "relative", height: 180, backgroundColor: "#1a1a1a", overflow: "hidden" },
  heroBg: StyleSheet.absoluteFillObject as any,
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  heroContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 18 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  sectionSub: { fontSize: 12, color: colors.gray500, textAlign: "center", marginTop: 4, marginBottom: 16 },

  emptyBox: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: colors.gray500 },

  grid: { gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardImg: { width: "100%", height: 130 },
  cardImgFallback: { backgroundColor: "#f0f7f3", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  cardDesc: { fontSize: 12, color: colors.gray500, marginTop: 4, lineHeight: 16 },
  modeRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  modeChip: { backgroundColor: "#e8f5ee", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  modeChipText: { fontSize: 10, color: colors.primary, fontWeight: "700", textTransform: "capitalize" },

  ctaWrap: { paddingHorizontal: 16, marginTop: 20, gap: 10 },
  ctaPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ctaPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  ctaSecondary: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 8,
  },
  ctaSecondaryText: { color: colors.gray800, fontSize: 14, fontWeight: "700" },

  // Sheet
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5eae6",
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  sheetClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#f6f7f8", alignItems: "center", justifyContent: "center",
  },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: colors.gray200, backgroundColor: "#fff",
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 12, color: colors.gray700, fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: "#fff",
  },
  modeBtnActive: { backgroundColor: "#e8f5ee", borderColor: colors.primary },
  modeBtnText: { fontSize: 12, color: colors.gray500, fontWeight: "600" },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Success
  successCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#f0fdf4", borderWidth: 2, borderColor: "#16a34a",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  successTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  successBody: { fontSize: 14, color: "#76889a", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  successBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 36, borderRadius: 10 },
  successBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
