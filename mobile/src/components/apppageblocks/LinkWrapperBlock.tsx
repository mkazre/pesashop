import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { resolveMenuLink } from "@/utils/resolveLink";
import { applyBlockStyle } from "./applyBlockStyle";
import { BLOCK_COMPONENTS } from "./blockComponents";

// One level of nesting only, same as ContainerBlock — the whole wrapped
// area navigates on press.
export default function LinkWrapperBlock({ block }: { block: any }) {
  const router = useRouter();
  const { linkType, link, style } = block.props || {};
  const children = Array.isArray(block.children) ? block.children : [];

  const handlePress = () => {
    const dest = resolveMenuLink({ linkType, link });
    if (dest) router.push(dest as any);
  };

  return (
    <Pressable onPress={handlePress} style={applyBlockStyle(style)}>
      {children.filter((c: any) => c.enabled !== false).map((child: any, i: number) => {
        const Component = BLOCK_COMPONENTS[child.blockType];
        if (!Component) return null;
        return <Component key={child._id || `child-${i}`} block={child} />;
      })}
    </Pressable>
  );
}
