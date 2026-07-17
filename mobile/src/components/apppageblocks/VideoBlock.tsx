import { View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function VideoBlock({ block }: { block: any }) {
  const { src, autoplay, loop, muted, controls, style } = block.props || {};
  const uri = resolveImageUrl(src);

  const player = useVideoPlayer(uri || "", (p) => {
    p.loop = !!loop;
    p.muted = !!muted;
    if (autoplay) p.play();
  });

  if (!uri) {
    return <View style={[{ height: 180, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />;
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
