import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BlockWrapper from "./BlockWrapper";
import { resolveImageUrl, colors } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ImageTextCta({ block }: { block: any }) {
  const router = useRouter();
  const mainImg = resolveImageUrl(block.mainImage);
  const sideImg = resolveImageUrl(block.sideImage);
  const isFullWidth = block.layout === "full";
  const textColor = block.textColor || "#333";
  const primaryColor = block.primaryColor || colors.primary;

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      {/* Main image with text overlay */}
      <View style={s.mainCard}>
        {mainImg ? (
          <Image
            source={{ uri: mainImg }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#f3f4f6" }]} />
        )}
        <View
          style={[
            s.overlay,
            block.textPosition === "center"
              ? { alignItems: "center" }
              : block.textPosition === "left"
              ? { alignItems: "flex-start" }
              : { alignItems: "flex-end" },
          ]}
        >
          {block.heading ? (
            <Text style={[s.heading, { color: textColor }]}>{block.heading}</Text>
          ) : null}
          {block.description ? (
            <Text style={[s.desc, { color: textColor }]}>{block.description}</Text>
          ) : null}
          {block.bulletPoints?.length > 0 && (
            <View style={s.bullets}>
              {block.bulletPoints.map((point: string, i: number) => (
                <View key={i} style={s.bulletRow}>
                  <View style={[s.bulletDot, { backgroundColor: primaryColor }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                  <Text style={[s.bulletText, { color: textColor }]}>{point}</Text>
                </View>
              ))}
            </View>
          )}
          {block.buttonText && block.buttonLink ? (
            <Pressable
              onPress={() => router.push(block.buttonLink as any)}
              style={[
                s.button,
                {
                  backgroundColor:
                    block.buttonBgColor || primaryColor,
                },
              ]}
            >
              <Text style={s.buttonText}>{block.buttonText}</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Side image (shown below on mobile) */}
      {!isFullWidth && sideImg ? (
        <View style={s.sideCard}>
          <Image
            source={{ uri: sideImg }}
            style={{ width: "100%", height: 160, borderRadius: 12 }}
            contentFit="cover"
            transition={200}
          />
        </View>
      ) : null}
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  mainCard: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 260,
    position: "relative",
  },
  overlay: {
    position: "relative",
    zIndex: 10,
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 10,
  },
  bullets: {
    marginBottom: 14,
    gap: 6,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    fontSize: 13,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  sideCard: {
    marginTop: 10,
  },
});
