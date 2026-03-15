import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import BlockWrapper from "./BlockWrapper";
import { resolveImageUrl } from "@/theme";

export default function FeatureIconsRow({ block }: { block: any }) {
  const features = block.features || [];
  if (!features.length) return null;

  return (
    <BlockWrapper block={block}>
      <View style={s.grid}>
        {features.map((f: any, i: number) => {
          const iconColor = f.color || "#1b5e35";
          const imgUrl = f.iconImage ? resolveImageUrl(f.iconImage) : null;
          return (
            <View key={i} style={s.item}>
              <View
                style={[
                  s.iconCircle,
                  { backgroundColor: `${iconColor}15` },
                ]}
              >
                {imgUrl ? (
                  <Image
                    source={{ uri: imgUrl }}
                    style={s.iconImg}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={s.iconEmoji}>{f.icon || "⭐"}</Text>
                )}
              </View>
              <Text style={[s.featureTitle, { color: iconColor }]}>
                {f.title}
              </Text>
              {f.subtitle ? (
                <Text style={s.featureSub}>{f.subtitle}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  item: {
    alignItems: "center",
    width: "30%",
    padding: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 0,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconImg: { width: 28, height: 28 },
  iconEmoji: { fontSize: 20 },
  featureTitle: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  featureSub: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "center",
  },
});
