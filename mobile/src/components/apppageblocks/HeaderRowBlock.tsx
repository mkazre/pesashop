import { View } from "react-native";
import { BLOCK_COMPONENTS } from "./blockComponents";
import { applyBlockStyle } from "./applyBlockStyle";

export default function HeaderRowBlock({ block }: { block: any }) {
  const { layout, alignItems, gap, style } = block.props || {};
  const children = Array.isArray(block.children) ? block.children : [];

  return (
    <View
      style={[
        { flexDirection: "row", justifyContent: (layout as any) || "space-between", alignItems: (alignItems as any) || "center", gap: gap ?? 12 },
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
