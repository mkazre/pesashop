import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, TextInput, Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { serviceProviderAdsAPI } from "@/services/api";
import { colors } from "@/theme";

interface Props {
  slotId: string;
  pageType: "home" | "shop" | "product_detail" | "category" | string;
  productId?: string;
  categorySlug?: string;
  maxAds?: number;
}

export default function ServiceProviderAdSlot({
  slotId,
  pageType,
  productId,
  categorySlug,
  maxAds = 6,
}: Props) {
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    serviceProviderAdsAPI.getContextual({ slotId, pageType, productId, categorySlug, maxAds })
      .then((res: any) => setAds(res.data?.data?.data || res.data?.data || []))
      .catch(() => setAds([]));
  }, [slotId, pageType, productId, categorySlug, maxAds]);

  useEffect(() => {
    serviceProviderAdsAPI.getAdSettings()
      .then((res: any) => setSettings(res.data?.data || {}))
      .catch(() => {});
  }, []);

  if (!ads.length) return null;

  const sectionTitle = settings.sectionTitle || "Featured Services";

  return (
    <View style={s.section}>
      <View style={s.header}>
        <Text style={s.title}>{sectionTitle}</Text>
        <Text style={s.sponsored}>SPONSORED</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.track}>
        {ads.map((ad: any) => (
          <SpAdCard key={ad._id} ad={ad} />
        ))}
      </ScrollView>
    </View>
  );
}

function SpAdCard({ ad }: { ad: any }) {
  const trackedRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!trackedRef.current && ad?._id) {
      trackedRef.current = true;
      serviceProviderAdsAPI.recordImpression(ad._id).catch(() => {});
    }
  }, [ad?._id]);

  const handleEnquire = () => {
    serviceProviderAdsAPI.recordClick(ad._id).catch(() => {});
    setModalOpen(true);
  };

  return (
    <>
      <TouchableOpacity onPress={handleEnquire} activeOpacity={0.85} style={s.card}>
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={s.cardImage} contentFit="cover" />
        ) : (
          <View style={s.cardFallback}>
            {ad.provider?.logoUrl
              ? <Image source={{ uri: ad.provider.logoUrl }} style={s.cardLogo} contentFit="cover" />
              : <Text style={{ fontSize: 26 }}>🏢</Text>}
          </View>
        )}
        <View style={s.adBadge}>
          <Text style={s.adBadgeText}>AD</Text>
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={2}>{ad.title}</Text>
          {!!ad.body && <Text style={s.cardDesc} numberOfLines={2}>{ad.body}</Text>}
          <View style={s.cta}>
            <Text style={s.ctaText}>Enquire</Text>
          </View>
        </View>
      </TouchableOpacity>
      <SpEnquiryModal ad={ad} visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function SpEnquiryModal({ ad, visible, onClose }: { ad: any; visible: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", additionalInfo: "", preferredDate: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      Alert.alert("Missing Info", "Please fill in your name, phone and email.");
      return;
    }
    setLoading(true);
    try {
      await serviceProviderAdsAPI.submitEnquiry(ad._id, form);
      setSuccess(true);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setForm({ name: "", phone: "", email: "", location: "", additionalInfo: "", preferredDate: "" });
    setSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{success ? "Enquiry Sent!" : "Enquire about this Service"}</Text>
            <Pressable onPress={close}><Ionicons name="close" size={22} color="#1a1a1a" /></Pressable>
          </View>
          {success ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={48} color="#1b5e35" />
              <Text style={{ marginTop: 12, color: "#555", textAlign: "center" }}>
                The provider will get back to you shortly.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TextInput style={s.input} placeholder="Your name *" value={form.name} onChangeText={(v) => set("name", v)} />
              <TextInput style={s.input} placeholder="Phone *" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => set("phone", v)} />
              <TextInput style={s.input} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => set("email", v)} />
              <TextInput style={s.input} placeholder="Location (optional)" value={form.location} onChangeText={(v) => set("location", v)} />
              <TextInput style={[s.input, { height: 80 }]} placeholder="Additional info (optional)" multiline value={form.additionalInfo} onChangeText={(v) => set("additionalInfo", v)} />
              <Pressable style={s.submit} disabled={loading} onPress={handleSubmit}>
                <Text style={s.submitText}>{loading ? "Sending..." : "Send Enquiry"}</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  section: { borderTopWidth: 1, borderTopColor: "#e5eae6", paddingTop: 14, marginTop: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f0f2f0", marginBottom: 12 },
  title: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  sponsored: { fontSize: 10, color: "#76889a", fontWeight: "600", letterSpacing: 0.6 },
  track: { paddingHorizontal: 16, paddingRight: 8, gap: 10, paddingBottom: 12 },
  card: { width: 180, borderWidth: 1, borderColor: colors.gray100, backgroundColor: colors.white, overflow: "hidden", marginBottom: 4 },
  cardImage: { width: "100%", height: 90 },
  cardFallback: { width: "100%", height: 90, backgroundColor: "#1b5e35", alignItems: "center", justifyContent: "center" },
  cardLogo: { width: 44, height: 44, borderRadius: 22 },
  adBadge: { position: "absolute", top: 5, right: 5, backgroundColor: "rgba(255,255,255,0.85)", paddingHorizontal: 4, paddingVertical: 1 },
  adBadgeText: { fontSize: 8, fontWeight: "700", color: colors.gray400, letterSpacing: 0.5 },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, lineHeight: 17 },
  cardDesc: { fontSize: 11, color: colors.gray500, lineHeight: 15 },
  cta: { marginTop: 6, backgroundColor: "#1b5e35", paddingVertical: 7, alignItems: "center" },
  ctaText: { fontSize: 11, fontWeight: "700", color: "#a8ffca", letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f2f0" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  input: { borderWidth: 1, borderColor: "#e5eae6", padding: 12, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fff", marginBottom: 12 },
  submit: { backgroundColor: "#1b5e35", paddingVertical: 14, alignItems: "center", marginTop: 4 },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.4 },
});
