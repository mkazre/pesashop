import { useEffect, useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import { usePageScroll } from "./PageScrollContext";

export default function BackToTopBlock({ block }: { block: any }) {
  const { scrollThreshold, style } = block.props || {};
  const pageScroll = usePageScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pageScroll) return;
    const id = pageScroll.scrollY.addListener(({ value }) => {
      setVisible(value > (scrollThreshold ?? 300));
    });
    return () => pageScroll.scrollY.removeListener(id);
  }, [pageScroll, scrollThreshold]);

  if (!pageScroll || !visible) return null;

  return (
    <Pressable
      onPress={pageScroll.scrollToTop}
      style={[
        { position: "absolute", bottom: 24, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", zIndex: 20, elevation: 4 },
        applyBlockStyle(style),
      ]}
    >
      <Ionicons name="arrow-up" size={20} color={style?.color || "#fff"} />
    </Pressable>
  );
}
