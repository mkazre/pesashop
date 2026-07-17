import { View } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const ASPECT_RATIOS: Record<string, number> = { "1:1": 1, "4:3": 4 / 3, "16:9": 16 / 9 };

export default function ImageBlock({ block }: { block: any }) {
  const { src, alt, aspectRatio, style } = block.props || {};
  const uri = resolveImageUrl(src);
  const ratio = ASPECT_RATIOS[aspectRatio];

  if (!uri) {
    return <View style={[{ height: 120, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />;
  }

  return (
    <Image
      source={{ uri }}
      accessibilityLabel={alt || undefined}
      style={[
        { width: "100%", height: ratio ? undefined : 200, aspectRatio: ratio },
        applyBlockStyle(style),
      ]}
      contentFit="cover"
    />
  );
}
