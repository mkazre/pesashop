import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface BlockWrapperProps {
  block: any;
  children: React.ReactNode;
}

export default function BlockWrapper({ block, children }: BlockWrapperProps) {
  const router = useRouter();
  const style: any = {
    backgroundColor: block.backgroundColor || undefined,
    paddingTop: parseInt(block.paddingTop) || 24,
    paddingBottom: parseInt(block.paddingBottom) || 24,
  };

  return (
    <View style={style}>
      <View style={block.containerWidth === "full" ? undefined : s.container}>
        {block.showSectionTitle && block.sectionTitle ? (
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.title,
                  {
                    fontSize: parseInt(block.sectionTitleSize) || 20,
                    color: block.sectionTitleColor || colors.gray900,
                  },
                ]}
              >
                {block.sectionTitle}
              </Text>
              {block.sectionSubtitle ? (
                <Text
                  style={[
                    s.subtitle,
                    {
                      fontSize: parseInt(block.sectionSubtitleSize) || 13,
                      color: block.sectionSubtitleColor || colors.gray500,
                    },
                  ]}
                >
                  {block.sectionSubtitle}
                </Text>
              ) : null}
            </View>
            {block.showViewAll && block.viewAllLink ? (
              <Pressable
                onPress={() => router.push(block.viewAllLink as any)}
                style={s.viewAll}
              >
                <Text
                  style={[
                    s.viewAllText,
                    { color: block.linkColor || block.primaryColor || colors.primary },
                  ]}
                >
                  {block.viewAllText || "View All"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={block.linkColor || block.primaryColor || colors.primary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontWeight: "700" },
  subtitle: { marginTop: 2 },
  viewAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
});
