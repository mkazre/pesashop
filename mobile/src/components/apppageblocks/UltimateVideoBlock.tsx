import { View, Pressable, Linking } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

// YouTube/Vimeo embeds need either a WebView or an iframe player — neither
// fits this app's "100% native, no WebView" rendering. Self-hosted files
// play inline via expo-video (matching VideoBlock); YouTube/Vimeo instead
// show a poster with a play button that opens the video in the device's
// browser/YouTube app, the same externally-delegated pattern used by Map.
export default function UltimateVideoBlock({ block }: { block: any }) {
  const { type, src, youtubeId, vimeoId, poster, autoplay, loop, muted, controls, style } = block.props || {};
  const posterUri = resolveImageUrl(poster);
  const selfUri = resolveImageUrl(src);

  const player = useVideoPlayer(type === "self" && selfUri ? selfUri : "", (p) => {
    p.loop = !!loop;
    p.muted = !!muted;
    if (autoplay) p.play();
  });

  if (type === "self") {
    if (!selfUri) return <View style={[{ height: 200, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />;
    return (
      <VideoView player={player} style={[{ width: "100%", height: 200 }, applyBlockStyle(style)]} nativeControls={controls !== false} contentFit="contain" />
    );
  }

  const externalUrl =
    type === "youtube" && youtubeId
      ? `https://www.youtube.com/watch?v=${youtubeId}`
      : type === "vimeo" && vimeoId
      ? `https://vimeo.com/${vimeoId}`
      : null;

  return (
    <Pressable
      onPress={() => externalUrl && Linking.openURL(externalUrl)}
      style={[{ height: 200, backgroundColor: "#1f2937", alignItems: "center", justifyContent: "center", overflow: "hidden" }, applyBlockStyle(style)]}
    >
      {posterUri && <Image source={{ uri: posterUri }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />}
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="play" size={26} color={colors.gray900} />
      </View>
    </Pressable>
  );
}
