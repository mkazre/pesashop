import { View } from "react-native";
import { BLOCK_COMPONENTS } from "./blockComponents";
import { applyBlockStyle } from "./applyBlockStyle";

export default function CSSGridBlock({ block }: { block: any }) {
  const { columns, gap, style } = block.props || {};
  const cols = columns || 2;
  const children = Array.isArray(block.children) ? block.children : [];

  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap" }, applyBlockStyle(style)]}>
      {children.filter((c: any) => c.enabled !== false).map((child: any, i: number) => {
        const Component = BLOCK_COMPONENTS[child.blockType];
        if (!Component) return null;
        return (
          <View key={child._id || `child-${i}`} style={{ width: `${100 / cols}%`, padding: (gap ?? 12) / 2 }}>
            <Component block={child} />
          </View>
        );
      })}
    </View>
  );
}
