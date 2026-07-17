import { View, Text, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function GalleryBlock({ block }: { block: any }) {
  const { images, columns, style } = block.props || {};
  const { width: screenWidth } = useWindowDimensions();
  const list = Array.isArray(images) ? images : [];
  const cols = columns || 2;
  const gap = 8;
  // Page content renders inside a 16px-padded ScrollView (see
  // app-page/[slug].tsx), so the available width is screen minus that.
  const tileWidth = (screenWidth - 32 - gap * (cols - 1)) / cols;

  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap", gap }, applyBlockStyle(style)]}>
      {list.map((item: any, i: number) => {
        const uri = resolveImageUrl(item.src);
        return (
          <View key={i} style={{ width: tileWidth }}>
            {uri ? (
              <Image source={{ uri }} style={{ width: "100%", aspectRatio: 1, borderRadius: style?.borderRadius ?? 0 }} contentFit="cover" />
            ) : (
              <View style={{ width: "100%", aspectRatio: 1, backgroundColor: colors.gray100 }} />
            )}
            {!!item.caption && <Text style={{ fontSize: 11, color: colors.gray500, marginTop: 4 }}>{item.caption}</Text>}
          </View>
        );
      })}
    </View>
  );
}
