import { Text } from "react-native";
import { applyBlockStyle } from "./applyBlockStyle";

export default function CopyrightYearBlock({ block }: { block: any }) {
  const { text, style } = block.props || {};
  const display = (text || "© {year} Your Company. All rights reserved.").replace("{year}", String(new Date().getFullYear()));

  return <Text style={[{ fontSize: 13, color: "#6b7280", textAlign: "center" }, applyBlockStyle(style)]}>{display}</Text>;
}
