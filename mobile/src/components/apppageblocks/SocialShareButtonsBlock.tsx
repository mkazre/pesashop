import { View, Text, Pressable, Share } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

const LABELS: Record<string, string> = {
  facebook: "f",
  twitter: "𝕏",
  linkedin: "in",
  whatsapp: "W",
  email: "✉",
  pinterest: "P",
  reddit: "r",
};

export default function SocialShareButtonsBlock({ block }: { block: any }) {
  const { shareUrl, shareText, platforms, style } = block.props || {};
  const list = Array.isArray(platforms) ? platforms : [];

  const handleShare = () => {
    Share.share({ message: shareText ? `${shareText} ${shareUrl || ""}`.trim() : shareUrl || "" });
  };

  return (
    <View style={[{ flexDirection: "row", gap: 10 }, applyBlockStyle(style)]}>
      {list.map((p: string, i: number) => (
        <Pressable key={i} onPress={handleShare} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{LABELS[p] || p[0]?.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}
