import { View, Text, StyleSheet } from "react-native";
import BlockWrapper from "./BlockWrapper";

/**
 * CustomHtmlBlock — renders a placeholder on mobile since WebView
 * requires react-native-webview. Rich HTML content is best viewed
 * on the web app. For simple text blocks, the content is shown as
 * plain text (HTML tags stripped).
 */
export default function CustomHtmlBlock({ block }: { block: any }) {
  const html = block.content || "";
  if (!html.trim()) return null;

  // Strip HTML tags for a plain-text preview
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return (
    <BlockWrapper block={{ ...block, showSectionTitle: false }}>
      <View style={s.container}>
        {plainText ? (
          <Text style={s.text}>{plainText}</Text>
        ) : (
          <Text style={s.placeholder}>Custom HTML Block</Text>
        )}
      </View>
    </BlockWrapper>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    minHeight: 40,
  },
  text: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
});
