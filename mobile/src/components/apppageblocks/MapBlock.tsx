import { View, Text, Pressable, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function MapBlock({ block }: { block: any }) {
  const { address, latitude, longitude, buttonText, style } = block.props || {};

  const handlePress = () => {
    const hasCoords = latitude && longitude;
    const query = hasCoords ? `${latitude},${longitude}` : encodeURIComponent(address || "");
    if (!query) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url as string).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)
    );
  };

  return (
    <View style={[{ alignItems: "center", backgroundColor: colors.gray50, padding: 24 }, applyBlockStyle(style)]}>
      <Ionicons name="location" size={28} color={colors.primary} />
      {!!address && <Text style={{ fontSize: 13, color: colors.gray700, marginTop: 8, textAlign: "center" }}>{address}</Text>}
      <Pressable
        onPress={handlePress}
        style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white, paddingVertical: 8, paddingHorizontal: 18 }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray800 }}>{buttonText || "Open in Maps"}</Text>
      </Pressable>
    </View>
  );
}
