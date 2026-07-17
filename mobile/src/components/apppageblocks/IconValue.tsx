import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { resolveImageUrl } from "@/theme";

// Renders an icon value in the {type: 'emoji'|'icon'|'image', value} shape
// produced by the admin's IconPicker (admin-panel/src/components/common/
// IconPicker.jsx). The 'icon' type stores a react-icons/io5 name (e.g.
// 'cart'), which maps directly onto @expo/vector-icons' Ionicons — both
// wrap the same underlying Ionicons set. Shared by AppDrawer and any
// Page Builder block with an icon field, rather than reimplementing this
// per call site.
export default function IconValue({ icon, size = 20, color = "#111827", fallback }: { icon: any; size?: number; color?: string; fallback?: keyof typeof Ionicons.glyphMap }) {
  const normalized = typeof icon === "string" ? (icon ? { type: "emoji", value: icon } : null) : icon;

  if (normalized?.type === "emoji" && normalized.value) {
    return <Text style={{ fontSize: size, width: size, textAlign: "center" }}>{normalized.value}</Text>;
  }
  if (normalized?.type === "icon" && normalized.value) {
    return <Ionicons name={normalized.value as any} size={size} color={color} />;
  }
  if (normalized?.type === "image" && normalized.value) {
    const uri = resolveImageUrl(normalized.value);
    if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 3 }} contentFit="contain" />;
  }
  if (fallback) return <Ionicons name={fallback} size={size} color={color} />;
  return null;
}
