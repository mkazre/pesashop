import { View } from "react-native";
import { BLOCK_COMPONENTS } from "./blockComponents";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ColumnsBlock({ block }: { block: any }) {
  const { gap, style } = block.props || {};
  const children = Array.isArray(block.children) ? block.children : [];

  return (
    <View style={[{ flexDirection: "row", gap: gap ?? 12 }, applyBlockStyle(style)]}>
      {children.filter((c: any) => c.enabled !== false).map((child: any, i: number) => {
        const Component = BLOCK_COMPONENTS[child.blockType];
        if (!Component) return null;
        return (
          <View key={child._id || `child-${i}`} style={{ flex: 1 }}>
            <Component block={child} />
          </View>
        );
      })}
    </View>
  );
}
