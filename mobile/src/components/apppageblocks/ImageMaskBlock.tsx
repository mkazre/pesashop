import { View } from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, ClipPath, Path, Image as SvgImage } from "react-native-svg";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const CLIP_PATHS: Record<string, string> = {
  diamond: "M50,0 L100,50 L50,100 L0,50 Z",
  hexagon: "M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z",
  star: "M50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35 Z",
};

export default function ImageMaskBlock({ block }: { block: any }) {
  const { src, maskShape, size, style } = block.props || {};
  const uri = resolveImageUrl(src);
  const s = size || 220;

  if (!uri) return <View style={[{ width: s, height: s, backgroundColor: colors.gray100 }, applyBlockStyle(style)]} />;

  if (maskShape === "circle") {
    return <Image source={{ uri }} style={[{ width: s, height: s, borderRadius: s / 2 }, applyBlockStyle(style)]} contentFit="cover" />;
  }
  if (maskShape === "rounded" || !maskShape) {
    return <Image source={{ uri }} style={[{ width: s, height: s, borderRadius: 20 }, applyBlockStyle(style)]} contentFit="cover" />;
  }

  const path = CLIP_PATHS[maskShape as string] || CLIP_PATHS.diamond;
  return (
    <Svg width={s} height={s} viewBox="0 0 100 100" style={applyBlockStyle(style)}>
      <Defs>
        <ClipPath id="mask">
          <Path d={path} />
        </ClipPath>
      </Defs>
      <SvgImage href={{ uri }} width={100} height={100} preserveAspectRatio="xMidYMid slice" clipPath="url(#mask)" />
    </Svg>
  );
}
