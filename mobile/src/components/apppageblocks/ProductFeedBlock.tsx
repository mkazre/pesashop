import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { resolveImageUrl, colors } from "@/theme";
import { useBlockProducts } from "@/components/homeblocks/useBlockProducts";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ProductFeedBlock({ block }: { block: any }) {
  const router = useRouter();
  const { source, limit, columns, style } = block.props || {};
  const { data: products, isLoading } = useBlockProducts(source || "featured", { limit: limit || 6 });
  const cols = columns || 2;

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 24 }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!products.length) return null;

  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap" }, applyBlockStyle(style)]}>
      {products.map((p: any) => {
        const uri = resolveImageUrl(p.images?.[0]?.url || p.image || p.thumbnail);
        const price = p.salePrice || p.regularPrice || 0;
        return (
          <Pressable
            key={p._id}
            onPress={() => router.push(`/product/${p.slug || p._id}` as any)}
            style={{ width: `${100 / cols}%`, padding: 6 }}
          >
            {uri ? (
              <Image source={{ uri }} style={{ width: "100%", aspectRatio: 1, borderRadius: 6 }} contentFit="cover" />
            ) : (
              <View style={{ width: "100%", aspectRatio: 1, borderRadius: 6, backgroundColor: colors.gray100 }} />
            )}
            <Text numberOfLines={2} style={{ fontSize: 12, color: colors.gray700, marginTop: 6 }}>{p.name}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginTop: 2 }}>R {Number(price).toFixed(2)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
