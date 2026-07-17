import { useState } from "react";
import { Text, Pressable, View } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";

export default function ShowMoreLessBlock({ block }: { block: any }) {
  const { content, collapsedLines, moreText, lessText, style } = block.props || {};
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Text style={[{ fontSize: 14, color: colors.gray700, lineHeight: 20 }, applyBlockStyle(style)]} numberOfLines={expanded ? undefined : (collapsedLines || 3)}>
        {content}
      </Text>
      <Pressable onPress={() => setExpanded((v) => !v)} style={{ marginTop: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, textAlign: "center" }}>
          {expanded ? (lessText || "Show Less") : (moreText || "Show More")}
        </Text>
      </Pressable>
    </View>
  );
}
