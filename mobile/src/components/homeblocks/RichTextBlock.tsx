import { View, Text, StyleSheet } from "react-native";
import BlockWrapper from "./BlockWrapper";

export default function RichTextBlock({ block }: { block: any }) {
  const html = block.content || "";
  // Simple text rendering — strip basic HTML tags for mobile
  const plainText = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  if (!plainText) return null;

  return (
    <BlockWrapper block={block}>
      <Text style={s.text}>{plainText}</Text>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  text: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
});
