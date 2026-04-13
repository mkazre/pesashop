import { useState, useMemo } from "react";
import { View, Text, Pressable, Switch, TextInput, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store";
import { serviceTypesAPI, serviceRequestsAPI } from "@/services/api";
import { colors } from "@/theme";

const MODE_LABELS: Record<string, string> = { repair: "Repair", install: "Install", maintain: "Maintain" };

interface ServiceRequestWidgetProps {
  product: any;
}

export default function ServiceRequestWidget({ product }: ServiceRequestWidgetProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categoryIds = useMemo(() => {
    const cats = product?.categories || [];
    return cats.map((c: any) => (typeof c === "object" ? c._id : c)).filter(Boolean).join(",");
  }, [product]);

  const loadServiceTypes = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await serviceTypesAPI.getAll(categoryIds ? { categoryIds } : undefined);
      setServiceTypes(res.data?.data || []);
      setLoaded(true);
    } catch {
      setServiceTypes([]);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (val: boolean) => {
    if (val && !isAuthenticated) {
      Toast.show({ type: "info", text1: "Sign in to book a professional" });
      return;
    }
    setIsOpen(val);
    if (val && !loaded) loadServiceTypes();
    if (!val) { setSubmitted(false); setSelectedTypeId(null); setSelectedModes([]); }
  };

  const handleSelectType = (type: any) => {
    setSelectedTypeId(type._id);
    setSelectedModes(type.serviceModes || []);
  };

  const toggleMode = (m: string) => {
    setSelectedModes((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const selectedType = serviceTypes.find((t) => t._id === selectedTypeId) || null;

  const handleSubmit = async () => {
    if (!selectedType) {
      Toast.show({ type: "error", text1: "Please select a service type" });
      return;
    }
    setSubmitting(true);
    const address = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
    try {
      await serviceRequestsAPI.submit({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        serviceTypeId: selectedType._id,
        serviceModes: selectedModes,
        description,
        address: address?.address || address?.line1 || "",
        suburb: address?.suburb || "",
        city: address?.city || "",
        province: address?.province || address?.state || "",
        productId: product?._id || "",
        productName: product?.name || product?.title || "",
      });
      setSubmitted(true);
      Toast.show({ type: "success", text1: "Request submitted!", text2: "We'll be in touch soon" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if loaded and no services
  if (loaded && serviceTypes.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.toggleRow}>
        <View style={s.toggleInfo}>
          <Text style={s.toggleIcon}>🔧</Text>
          <View>
            <Text style={s.toggleTitle}>Book a Professional</Text>
            <Text style={s.toggleSub}>
              {loading ? "Loading services..." : loaded ? `${serviceTypes.length} service${serviceTypes.length !== 1 ? "s" : ""} available` : "Electricians, plumbers & more"}
            </Text>
          </View>
        </View>
        <Switch
          value={isOpen}
          onValueChange={handleToggle}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {isOpen && !submitted && (
        <View style={s.panel}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 12 }} />
          ) : serviceTypes.length === 0 ? (
            <Text style={s.emptyText}>No services available for this product.</Text>
          ) : (
            <>
              {/* Service type cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={s.typeRow}>
                  {serviceTypes.map((type) => {
                    const isSelected = type._id === selectedTypeId;
                    return (
                      <Pressable
                        key={type._id}
                        onPress={() => handleSelectType(type)}
                        style={[s.typeCard, isSelected && s.typeCardSelected]}
                      >
                        {type.imageUrl ? (
                          <Image source={{ uri: type.imageUrl }} style={s.typeImage} contentFit="cover" />
                        ) : (
                          <Text style={s.typeEmoji}>{type.icon || "🔧"}</Text>
                        )}
                        <Text style={[s.typeTitle, isSelected && s.typeTitleSelected]} numberOfLines={2}>
                          {type.title}
                        </Text>
                        <Text style={s.typeModes} numberOfLines={1}>
                          {(type.serviceModes || []).map((m: string) => MODE_LABELS[m] || m).join(" · ")}
                        </Text>
                        {isSelected && (
                          <View style={s.selectedBadge}>
                            <Text style={s.selectedBadgeText}>✓</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Form when type selected */}
              {selectedType && (
                <View style={s.form}>
                  <Text style={s.formTitle}>{selectedType.icon} {selectedType.title}</Text>

                  {/* Mode selector */}
                  {selectedType.serviceModes?.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={s.formLabel}>What do you need?</Text>
                      <View style={s.modeRow}>
                        {selectedType.serviceModes.map((m: string) => (
                          <Pressable
                            key={m}
                            onPress={() => toggleMode(m)}
                            style={[s.modeChip, selectedModes.includes(m) && s.modeChipActive]}
                          >
                            <Text style={[s.modeChipText, selectedModes.includes(m) && s.modeChipTextActive]}>
                              {MODE_LABELS[m] || m}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Notes */}
                  <Text style={s.formLabel}>Notes (optional)</Text>
                  <TextInput
                    style={s.notesInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the issue or what you need..."
                    placeholderTextColor={colors.gray400}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  {/* Address preview */}
                  {user?.addresses && user.addresses.length > 0 && (() => {
                    const a = user.addresses.find((x: any) => x.isDefault) || user.addresses[0];
                    return (
                      <Text style={s.addressNote}>
                        📍 Using saved address: {[a?.suburb, a?.city, a?.province].filter(Boolean).join(", ")}
                      </Text>
                    );
                  })()}

                  <Pressable onPress={handleSubmit} disabled={submitting} style={[s.submitBtn, submitting && { opacity: 0.6 }]}>
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={s.submitText}>Request This Service</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {isOpen && submitted && (
        <View style={s.successPanel}>
          <Text style={s.successIcon}>✅</Text>
          <Text style={s.successTitle}>Request submitted!</Text>
          <Text style={s.successSub}>We'll contact you shortly to confirm your booking.</Text>
          <Pressable onPress={() => { setIsOpen(false); setSubmitted(false); setSelectedTypeId(null); }}>
            <Text style={s.successClose}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: "#e5eae6", paddingTop: 14, marginTop: 4 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  toggleIcon: { fontSize: 20 },
  toggleTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  toggleSub: { fontSize: 11, color: "#76889a", marginTop: 1 },
  panel: { marginTop: 14, borderRadius: 10, padding: 2 },
  emptyText: { fontSize: 13, color: colors.gray400, paddingVertical: 8 },
  typeRow: { flexDirection: "row", gap: 10, paddingBottom: 4 },
  typeCard: { width: 110, borderRadius: 8, borderWidth: 1, borderColor: "#e5eae6", backgroundColor: colors.white, padding: 10, alignItems: "center" },
  typeCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: "#f0fdf4" },
  typeImage: { width: 36, height: 36, borderRadius: 6, marginBottom: 6 },
  typeEmoji: { fontSize: 28, marginBottom: 4 },
  typeTitle: { fontSize: 11, fontWeight: "700", color: "#1a1a1a", textAlign: "center", lineHeight: 14 },
  typeTitleSelected: { color: colors.primary },
  typeModes: { fontSize: 9, color: "#76889a", marginTop: 3, textAlign: "center" },
  selectedBadge: { position: "absolute", top: 4, right: 4, backgroundColor: colors.primary, borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  selectedBadgeText: { color: colors.white, fontSize: 9, fontWeight: "700" },
  form: { backgroundColor: "#fafbfc", borderWidth: 1, borderColor: "#e5eae6", borderRadius: 8, padding: 12 },
  formTitle: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  formLabel: { fontSize: 11, fontWeight: "600", color: "#76889a", marginBottom: 6 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  modeChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "#e5eae6", backgroundColor: colors.white },
  modeChipActive: { borderColor: colors.primary, backgroundColor: "#f0fdf4" },
  modeChipText: { fontSize: 11, fontWeight: "600", color: "#76889a" },
  modeChipTextActive: { color: colors.primary },
  notesInput: { borderWidth: 1, borderColor: "#e5eae6", borderRadius: 6, padding: 10, fontSize: 12, color: colors.gray800, backgroundColor: colors.white, minHeight: 72, marginBottom: 10 },
  addressNote: { fontSize: 10, color: "#76889a", marginBottom: 10 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  submitText: { fontSize: 13, fontWeight: "700", color: colors.white },
  successPanel: { marginTop: 12, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 16, alignItems: "center" },
  successIcon: { fontSize: 32, marginBottom: 8 },
  successTitle: { fontSize: 14, fontWeight: "700", color: "#166534" },
  successSub: { fontSize: 12, color: "#16a34a", marginTop: 4, textAlign: "center" },
  successClose: { fontSize: 12, color: colors.gray500, marginTop: 12, textDecorationLine: "underline" },
});
