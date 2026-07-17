import { View, Text } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function AuthorBoxBlock({ block }: { block: any }) {
  const { name, bio, avatar, style } = block.props || {};
  const uri = resolveImageUrl(avatar);

  return (
    <View style={[{ flexDirection: "row", gap: 12, backgroundColor: colors.gray50, padding: 16, borderRadius: 12 }, applyBlockStyle(style)]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
      ) : (
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.gray200, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontWeight: "700", color: colors.gray500 }}>{(name || "A").charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        {!!name && <Text style={{ fontWeight: "700", fontSize: 14, color: colors.gray900 }}>{name}</Text>}
        {!!bio && <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 2, lineHeight: 17 }}>{bio}</Text>}
      </View>
    </View>
  );
}
