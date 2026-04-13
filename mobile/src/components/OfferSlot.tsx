import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";
import { Image } from "expo-image";
import Toast from "react-native-toast-message";
import { offersAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

interface Props {
  page: string;
}

export default function OfferSlot({ page }: Props) {
  const [offers, setOffers] = useState<any[]>([]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    offersAPI.getForPage(page)
      .then((res) => setOffers(res.data?.data || []))
      .catch(() => {});
  }, [page]);

  if (offers.length === 0) return null;

  const handleTake = async (offer: any) => {
    if (!isAuthenticated) {
      Toast.show({ type: "info", text1: "Sign in to take this offer" });
      return;
    }
    try {
      if (offer.offerType === "contact_request") {
        await offersAPI.contactRequest(offer._id);
        Toast.show({ type: "success", text1: "Request sent!", text2: "We'll be in touch soon." });
      } else {
        await offersAPI.take(offer._id);
        Toast.show({ type: "success", text1: "Offer taken!", text2: "Check My Offers in your account." });
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.response?.data?.message || "Failed" });
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Special Offers</Text>
      {offers.map((offer) => (
        <View key={offer._id} style={s.card}>
          {offer.logoUrl && (
            <Image source={{ uri: offer.logoUrl }} style={s.logo} contentFit="contain" />
          )}
          <View style={s.body}>
            <Text style={s.title}>{offer.title}</Text>
            {offer.shortDescription ? (
              <Text style={s.desc}>{offer.shortDescription}</Text>
            ) : null}
            <Pressable
              style={s.cta}
              onPress={() => handleTake(offer)}
            >
              <Text style={s.ctaText}>
                {offer.offerType === "contact_request"
                  ? (offer.ctaText || "Request More Info")
                  : offer.offerType === "subscription"
                  ? (offer.ctaText || "Subscribe")
                  : (offer.ctaText || "Get This Offer")}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, padding: 12, marginBottom: 10, gap: 10 },
  logo: { width: 48, height: 48, flexShrink: 0 },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", color: colors.gray900, marginBottom: 3 },
  desc: { fontSize: 12, color: colors.gray500, marginBottom: 8, lineHeight: 17 },
  cta: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, alignSelf: "flex-start" },
  ctaText: { fontSize: 12, fontWeight: "700", color: colors.white },
});
