import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { applyBlockStyle } from "./applyBlockStyle";

const SHAPES: Record<string, string> = {
  wave: "M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,96C960,107,1056,117,1152,112C1248,107,1344,85,1392,74.7L1440,64L1440,320L0,320Z",
  triangle: "M0,320L720,0L1440,320L1440,320L0,320Z",
  tilt: "M0,160L1440,320L1440,320L0,320Z",
  curve: "M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L0,320Z",
  zigzag: "M0,288L120,256L240,288L360,256L480,288L600,256L720,288L840,256L960,288L1080,256L1200,288L1320,256L1440,288L1440,320L0,320Z",
};

export default function ShapeDividerBlock({ block }: { block: any }) {
  const { shape, color, height, flip, position, style } = block.props || {};
  const path = SHAPES[shape as string] || SHAPES.wave;
  const transform: any[] = [];
  if (flip) transform.push({ scaleX: -1 });
  if (position === "top") transform.push({ scaleY: -1 });

  return (
    <View style={[{ width: "100%", height: height || 60, overflow: "hidden", transform: transform.length ? transform : undefined }, applyBlockStyle(style)]}>
      <Svg width="100%" height="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <Path d={path} fill={color || "#0F604B"} />
      </Svg>
    </View>
  );
}
