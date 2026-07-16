import { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useVideoPlayer, VideoView } from "expo-video";
import { liveStreamsAPI } from "@/services/api";
import { useCurrencyStore } from "@/store";
import { colors, resolveImageUrl } from "@/theme";

function HlsPlayer({ url, poster }: { url: string; poster?: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="contain"
      nativeControls
    />
  );
}

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formatPrice } = useCurrencyStore();

  const [stream, setStream] = useState<any>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await liveStreamsAPI.getOne(id);
        if (!cancelled) setStream(res.data?.data || res.data);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || "Failed to load stream");
      }
    };
    load();
    intervalRef.current = setInterval(load, 5000);
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  const handleTap = (productId: string, action: string) => {
    liveStreamsAPI.tap(id as string, productId, action).catch(() => {});
  };

  if (error) {
    return (
      <View style={[s.screen, s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorText}>{error}</Text>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={s.homeBtn}>
          <Text style={s.homeBtnText}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  if (!stream) {
    return <View style={[s.screen, s.center, { paddingTop: insets.top }]}><Text style={{ color: colors.white }}>Loading...</Text></View>;
  }

  const isYoutube = stream.source === "youtube" && stream.playbackUrl;
  const isEnded = stream.status === "ended";
  const playUrl = isEnded ? (stream.vodPlaybackUrl || stream.playbackUrl) : stream.playbackUrl;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            {stream.status === "live" && (
              <View style={s.liveBadge}><Text style={s.liveBadgeText}>LIVE</Text></View>
            )}
            <Text style={s.title} numberOfLines={1}>{stream.title}</Text>
          </View>
          {stream.hostName && <Text style={s.hostName}>with {stream.hostName}</Text>}
        </View>
        <Pressable onPress={() => router.replace("/(tabs)" as any)} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.playerWrap}>
          {playUrl ? (
            isYoutube ? (
              <WebView source={{ uri: playUrl }} style={StyleSheet.absoluteFill} allowsFullscreenVideo />
            ) : (
              <HlsPlayer url={playUrl} poster={stream.posterImage} />
            )
          ) : (
            <View style={[StyleSheet.absoluteFill, s.center]}>
              <Text style={{ color: colors.gray400 }}>Stream not available</Text>
            </View>
          )}

          {stream.currentPin && (
            <Pressable
              onPress={() => { handleTap(stream.currentPin._id, "tap"); router.push(`/product/${stream.currentPin.slug}` as any); }}
              style={s.pinCard}
            >
              {resolveImageUrl(stream.currentPin.images?.[0]) && (
                <Image source={{ uri: resolveImageUrl(stream.currentPin.images[0]) }} style={s.pinImg} contentFit="cover" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.pinName} numberOfLines={1}>{stream.currentPin.name}</Text>
                <Text style={s.pinPrice}>{formatPrice(stream.currentPin.salePrice || stream.currentPin.regularPrice)} · Tap to view</Text>
              </View>
              <View style={s.pinLiveTag}><Text style={s.pinLiveTagText}>Live</Text></View>
            </Pressable>
          )}
        </View>

        <View style={{ padding: 12 }}>
          <Text style={s.featuredTitle}>Featured products</Text>
          {(stream.products || []).map((p: any) => (
            <Pressable
              key={p._id}
              onPress={() => { handleTap(p._id, "tap"); router.push(`/product/${p.slug}` as any); }}
              style={s.productRow}
            >
              {resolveImageUrl(p.images?.[0]) && (
                <Image source={{ uri: resolveImageUrl(p.images[0]) }} style={s.productImg} contentFit="cover" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.productPrice}>{formatPrice(p.salePrice || p.regularPrice)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: "center", justifyContent: "center" },
  errorText: { color: "#f87171", fontSize: 14, marginBottom: 16, textAlign: "center", paddingHorizontal: 32 },
  homeBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 0 },
  homeBtnText: { color: colors.white, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveBadge: { backgroundColor: "#dc2626", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  liveBadgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  title: { color: colors.white, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  hostName: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  playerWrap: { width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.black, position: "relative" },
  pinCard: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: colors.white, borderRadius: 0, padding: 10, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  pinImg: { width: 44, height: 44, borderRadius: 8 },
  pinName: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  pinPrice: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  pinLiveTag: { backgroundColor: "#dc2626", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pinLiveTagText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  featuredTitle: { color: colors.white, fontSize: 14, fontWeight: "700", marginBottom: 10 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 0, padding: 8, marginBottom: 8 },
  productImg: { width: 44, height: 44, borderRadius: 8 },
  productName: { color: colors.white, fontSize: 13, fontWeight: "500" },
  productPrice: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});
