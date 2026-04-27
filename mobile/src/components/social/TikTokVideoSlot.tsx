import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { socialEngineAPI } from "@/services/api";
import { colors } from "@/theme";

interface Video {
  id: string;
  embedUrl?: string;
  webUrl?: string;
  coverUrl?: string;
  description?: string;
  author?: { handle?: string; nickname?: string };
  stats?: { plays?: number; likes?: number };
}

interface Props {
  keywords?: string[];
  pageType: "home" | "shop" | "product_detail";
}

function formatCount(n?: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function TikTokVideoSlot({ keywords = [], pageType }: Props) {
  const [cfg, setCfg] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialEngineAPI.getSettings()
      .then((res) => setCfg(res.data?.data || null))
      .catch(() => setCfg(null));
  }, []);

  const enabledForPage = !!(
    cfg?.enabled &&
    (pageType === "home" ? cfg.showOnHome !== false :
     pageType === "shop" ? cfg.showOnShop !== false :
     pageType === "product_detail" ? cfg.showOnProductDetail !== false : false)
  );

  const limit = cfg?.videosPerCarousel || 8;

  useEffect(() => {
    if (!enabledForPage || keywords.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    socialEngineAPI.getVideos(keywords, limit)
      .then((res) => setVideos(res.data?.data || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [enabledForPage, keywords.join(","), limit]);

  if (!enabledForPage) return null;
  if (!loading && videos.length === 0) return null;

  const sectionTitle = cfg?.sectionTitle || "Featured in Videos";
  const sectionSubtitle = cfg?.sectionSubtitle || "See what creators are sharing";

  const handleOpen = (video: Video) => {
    const url = video.webUrl || video.embedUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={s.title}>{sectionTitle}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>TikTok</Text>
            </View>
          </View>
          {!!sectionSubtitle && <Text style={s.subtitle}>{sectionSubtitle}</Text>}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.track}
        >
          {videos.map((video) => (
            <TouchableOpacity
              key={video.id}
              activeOpacity={0.85}
              onPress={() => handleOpen(video)}
              style={s.card}
            >
              {video.coverUrl ? (
                <Image source={{ uri: video.coverUrl }} style={s.cover} resizeMode="cover" />
              ) : (
                <View style={[s.cover, { backgroundColor: "#222" }]} />
              )}

              <View style={s.gradient} />

              <View style={s.viewCount}>
                <Ionicons name="play" size={9} color="#fff" />
                <Text style={s.viewCountText}>{formatCount(video.stats?.plays)}</Text>
              </View>

              <View style={s.tikTokBadge}>
                <Text style={s.tikTokBadgeText}>TikTok</Text>
              </View>

              <View style={s.playBtn}>
                <Ionicons name="play" size={18} color="#fff" />
              </View>

              <View style={s.cardFooter}>
                <Text style={s.handle} numberOfLines={1}>
                  @{video.author?.handle || "creator"}
                </Text>
                {!!video.description && (
                  <Text style={s.description} numberOfLines={2}>
                    {video.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  section: {
    borderTopWidth: 1,
    borderTopColor: "#e5eae6",
    paddingTop: 14,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f0",
    paddingHorizontal: 14,
  },
  title: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  badge: { backgroundColor: "#010101", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.4 },
  subtitle: { fontSize: 11, color: "#76889a", marginTop: 2 },
  track: { gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
  card: {
    width: 160,
    height: 285,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cover: { width: "100%", height: "100%", position: "absolute" },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  viewCount: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewCountText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  tikTokBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tikTokBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: -22,
    marginLeft: -22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: { position: "absolute", bottom: 10, left: 8, right: 8 },
  handle: { color: "#fff", fontSize: 11, fontWeight: "700" },
  description: { color: "rgba(255,255,255,0.7)", fontSize: 9, marginTop: 2 },
});
