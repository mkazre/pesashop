import { View } from "react-native";
import { BLOCK_COMPONENTS } from "./blockComponents";
import { applyBlockStyle } from "./applyBlockStyle";

// One level of nesting only (matches the admin builder's data model —
// a container's children can't themselves be containers).
export default function ContainerBlock({ block }: { block: any }) {
  const { direction, gap, style } = block.props || {};
  const children = Array.isArray(block.children) ? block.children : [];

  return (
    <View
      style={[
        { flexDirection: direction === "row" ? "row" : "column", gap: gap ?? 8 },
        applyBlockStyle(style),
      ]}
    >
      {children.filter((c: any) => c.enabled !== false).map((child: any, i: number) => {
        const Component = BLOCK_COMPONENTS[child.blockType];
        if (!Component) return null;
        return <Component key={child._id || `child-${i}`} block={child} />;
      })}
    </View>
  );
}
