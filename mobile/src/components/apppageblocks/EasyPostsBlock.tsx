import { View, Text } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl, colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function EasyPostsBlock({ block }: { block: any }) {
  const { posts, columns, style } = block.props || {};
  const list = Array.isArray(posts) ? posts : [];
  const cols = columns || 1;

  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap" }, applyBlockStyle(style)]}>
      {list.map((post: any, i: number) => {
        const uri = resolveImageUrl(post.image);
        return (
          <View key={i} style={{ width: `${100 / cols}%`, padding: 4 }}>
            <View style={{ borderWidth: 1, borderColor: colors.gray200, overflow: "hidden" }}>
              {uri ? (
                <Image source={{ uri }} style={{ width: "100%", height: 130 }} contentFit="cover" />
              ) : (
                <View style={{ width: "100%", height: 130, backgroundColor: colors.gray100 }} />
              )}
              <View style={{ padding: 12 }}>
                {!!post.title && <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gray900 }}>{post.title}</Text>}
                {!!post.date && <Text style={{ fontSize: 11, color: colors.gray400, marginTop: 4 }}>{post.date}</Text>}
                {!!post.excerpt && <Text style={{ fontSize: 12, color: colors.gray600, marginTop: 6, lineHeight: 17 }} numberOfLines={3}>{post.excerpt}</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
