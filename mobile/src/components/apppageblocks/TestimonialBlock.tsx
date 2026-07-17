import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function TestimonialBlock({ block }: { block: any }) {
  const { quote, author, role, avatar, rating, style } = block.props || {};
  const avatarUri = resolveImageUrl(avatar);
  const stars = Math.max(0, Math.min(5, rating ?? 0));

  return (
    <View style={[{ backgroundColor: colors.gray50, padding: 20 }, applyBlockStyle(style)]}>
      {stars > 0 && (
        <View style={{ flexDirection: "row", gap: 2, marginBottom: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name={i < stars ? "star" : "star-outline"} size={14} color="#f59e0b" />
          ))}
        </View>
      )}
      {!!quote && <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 20, fontStyle: "italic" }}>"{quote}"</Text>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" />
        ) : (
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>{(author || "U").charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View>
          {!!author && <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray900 }}>{author}</Text>}
          {!!role && <Text style={{ fontSize: 11, color: colors.gray400 }}>{role}</Text>}
        </View>
      </View>
    </View>
  );
}
