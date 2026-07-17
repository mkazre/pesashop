import { SvgXml } from "react-native-svg";
import { View } from "react-native";
import { colors } from "@/theme";

export default function SvgIconBlock({ block }: { block: any }) {
  const { svg, size } = block.props || {};
  if (!svg) return <View style={{ width: 32, height: 32, backgroundColor: colors.gray100 }} />;
  return <SvgXml xml={svg} width={size || 32} height={size || 32} />;
}
