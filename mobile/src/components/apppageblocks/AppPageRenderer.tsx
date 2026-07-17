import { View, StyleSheet } from "react-native";
import { BLOCK_COMPONENTS } from "./blockComponents";

interface AppPageRendererProps {
  blocks: any[];
}

// Structural twin of homeblocks/HomePageRenderer.tsx's BLOCK_COMPONENTS
// pattern, applied to app-page content instead of the home page config.
// Unlike the home page, blocks are passed in directly (already fetched by
// the screen for a specific slug) rather than fetched here.
export default function AppPageRenderer({ blocks }: AppPageRendererProps) {
  const visible = (blocks || []).filter((b) => b.enabled !== false);
  if (!visible.length) return null;

  return (
    <View style={s.container}>
      {visible.map((block, i) => {
        const Component = BLOCK_COMPONENTS[block.blockType];
        if (!Component) return null;
        return <Component key={block._id || `block-${i}`} block={block} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 12 },
});
