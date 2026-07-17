import { View, Text, Pressable } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function MediaPlayerBlock({ block }: { block: any }) {
  const { type, src, poster, controls, loop, muted, style } = block.props || {};
  const uri = resolveImageUrl(src);

  const player = useVideoPlayer(uri || "", (p) => {
    p.loop = !!loop;
    p.muted = !!muted;
  });

  if (!uri) return <View style={[{ height: 80, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />;

  if (type === "audio") {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.gray50, padding: 12, borderRadius: 8 }, applyBlockStyle(style)]}>
        <Ionicons name="musical-notes" size={20} color={colors.primary} />
        <Text style={{ fontSize: 13, color: colors.gray600, flex: 1 }}>Audio</Text>
        <VideoView player={player} style={{ width: 1, height: 1, opacity: 0 }} nativeControls={false} />
        <Pressable onPress={() => player.play()}>
          <Ionicons name="play-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={[{ width: "100%", height: 200 }, applyBlockStyle(style)]}
      nativeControls={controls !== false}
      contentFit="contain"
    />
  );
}
