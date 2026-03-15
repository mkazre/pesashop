import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { pagesAPI } from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";
import BottomTabBar from "@/components/BottomTabBar";

/**
 * Renders page builder content on mobile.
 * Craft.js serializes components as a JSON tree. We walk the tree and render
 * native equivalents for the most common nodes (text, image, button, section,
 * columns, divider, video, heading, etc.). Unknown nodes fall back to their
 * children or are skipped.
 */
export default function CustomPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    pagesAPI.getBySlug(slug)
      .then((res) => {
        setPage(res.data?.data || null);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} title="Loading..." />
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Header router={router} title="Page" />
        <View style={s.center}>
          <Ionicons name="document-outline" size={48} color={colors.gray300} />
          <Text style={s.emptyText}>Page not found</Text>
        </View>
      </View>
    );
  }

  const title = page.name || page.seo?.title || "Page";

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <Header router={router} title={title} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {page.components ? (
          <PageContent components={page.components} screenWidth={screenWidth} />
        ) : (
          <View style={s.center}>
            <Text style={s.emptyText}>This page has no content yet.</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

function Header({ router, title }: { router: any; title: string }) {
  return (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.gray800} />
      </Pressable>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

/**
 * Walk the Craft.js component tree and render native elements.
 * The tree is a Record<nodeId, { type, props, nodes, linkedNodes, ... }>.
 * ROOT is always the entry point.
 */
function PageContent({ components, screenWidth }: { components: any; screenWidth: number }) {
  if (!components || typeof components !== "object") return null;

  // Craft.js uses a flat map of nodeId → node. ROOT is the entry.
  const rootId = "ROOT";
  const rootNode = components[rootId];
  if (!rootNode) {
    // Maybe components IS the root node directly (older format)
    return <RenderFallback data={components} screenWidth={screenWidth} />;
  }

  return <RenderNode nodeId={rootId} tree={components} screenWidth={screenWidth} />;
}

function RenderNode({ nodeId, tree, screenWidth }: { nodeId: string; tree: any; screenWidth: number }) {
  const node = tree[nodeId];
  if (!node) return null;

  const resolvedType = node.type?.resolvedName || node.type || node.displayName || "";
  const props = node.props || {};
  const childIds = node.nodes || [];
  const linkedNodeIds = node.linkedNodes ? Object.values(node.linkedNodes) as string[] : [];
  const allChildIds = [...childIds, ...linkedNodeIds];

  // Render children helper
  const renderChildren = () => (
    <>
      {allChildIds.map((cid: string) => (
        <RenderNode key={cid} nodeId={cid} tree={tree} screenWidth={screenWidth} />
      ))}
    </>
  );

  // Map component types to native rendering
  switch (resolvedType) {
    case "Text":
    case "OxyText":
    case "RichText":
    case "Paragraph":
      return (
        <Text style={[s.textBlock, extractTextStyle(props)]}>
          {props.text || props.content || props.children || ""}
        </Text>
      );

    case "Heading":
    case "OxyHeading":
      return (
        <Text style={[s.headingBlock, extractHeadingStyle(props)]}>
          {props.text || props.content || props.children || ""}
        </Text>
      );

    case "Image":
    case "OxyImage":
      const imgSrc = props.src || props.url || props.imageUrl;
      if (!imgSrc) return renderChildren();
      return (
        <View style={s.imageBlock}>
          <Image
            source={{ uri: resolveImageUrl(imgSrc) }}
            style={{ width: screenWidth - 32, height: (screenWidth - 32) * 0.56, borderRadius: parsePxNum(props.borderRadius, 0) }}
            contentFit="cover"
          />
        </View>
      );

    case "Button":
    case "OxyButton":
      const link = props.link || props.href || "";
      return (
        <Pressable
          onPress={() => { if (link) Linking.openURL(link).catch(() => {}); }}
          style={[s.buttonBlock, { backgroundColor: props.backgroundColor || colors.primary }]}
        >
          <Text style={[s.buttonText, { color: props.color || "#fff" }]}>
            {props.text || props.label || props.children || "Button"}
          </Text>
        </Pressable>
      );

    case "Divider":
    case "OxyDivider":
      return <View style={s.divider} />;

    case "Spacer":
    case "OxySpacer":
      return <View style={{ height: parsePxNum(props.height, 24) }} />;

    case "Video":
    case "OxyVideo":
      const videoUrl = props.url || props.src || "";
      return (
        <Pressable onPress={() => { if (videoUrl) Linking.openURL(videoUrl).catch(() => {}); }} style={s.videoPlaceholder}>
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={s.videoText}>Watch Video</Text>
        </Pressable>
      );

    // Layout containers — just render children
    case "Container":
    case "Section":
    case "OxySection":
    case "Row":
    case "Column":
    case "OxyColumns":
    case "OxyColumn":
    case "Div":
    case "Root":
    case "Canvas":
    default:
      // Render children for any container or unknown type
      if (allChildIds.length > 0) {
        return <View style={extractContainerStyle(props)}>{renderChildren()}</View>;
      }
      // If there's text content in props, render it
      if (props.text || props.content) {
        return <Text style={s.textBlock}>{props.text || props.content}</Text>;
      }
      return null;
  }
}

function RenderFallback({ data, screenWidth }: { data: any; screenWidth: number }) {
  if (!data || typeof data !== "object") return null;
  // Try to render top-level text
  if (data.text || data.content) {
    return <Text style={s.textBlock}>{data.text || data.content}</Text>;
  }
  return null;
}

function parsePxNum(val: any, fallback: number): number {
  if (!val) return fallback;
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

function extractTextStyle(props: any) {
  const style: any = { paddingHorizontal: 16, marginBottom: 8 };
  if (props.fontSize) style.fontSize = parsePxNum(props.fontSize, 14);
  if (props.color) style.color = props.color;
  if (props.fontWeight) style.fontWeight = props.fontWeight;
  if (props.textAlign) style.textAlign = props.textAlign;
  return style;
}

function extractHeadingStyle(props: any) {
  const level = props.level || props.tag || "h2";
  const sizeMap: Record<string, number> = { h1: 28, h2: 22, h3: 18, h4: 16, h5: 14, h6: 13 };
  const size = sizeMap[level] || parsePxNum(props.fontSize, 22);
  const style: any = { fontSize: size, paddingHorizontal: 16, marginBottom: 8 };
  if (props.color) style.color = props.color;
  if (props.textAlign) style.textAlign = props.textAlign;
  return style;
}

function extractContainerStyle(props: any) {
  const style: any = {};
  if (props.flexDirection === "row") style.flexDirection = "row";
  if (props.backgroundColor) style.backgroundColor = props.backgroundColor;
  if (props.padding) style.padding = parsePxNum(props.padding, 0);
  return style;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyText: { fontSize: 14, color: colors.gray400, marginTop: 12 },
  textBlock: { fontSize: 14, color: colors.gray700, lineHeight: 22, paddingHorizontal: 16, marginBottom: 8 },
  headingBlock: { fontSize: 22, fontWeight: "700", color: colors.gray900, lineHeight: 30, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  imageBlock: { paddingHorizontal: 16, marginBottom: 12 },
  buttonBlock: { marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center", marginBottom: 12 },
  buttonText: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.gray200, marginHorizontal: 16, marginVertical: 12 },
  videoPlaceholder: { marginHorizontal: 16, height: 200, backgroundColor: colors.gray900, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  videoText: { color: "#fff", fontSize: 13, marginTop: 4 },
});
