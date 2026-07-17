import { View, Text } from "react-native";
import { colors } from "@/theme";
import { applyBlockStyle } from "./applyBlockStyle";
import { parseSimpleHtml } from "@/utils/simpleHtml";

export default function RichTextBlock({ block }: { block: any }) {
  const { html, style } = block.props || {};
  const computed = applyBlockStyle(style);
  const paragraphs = parseSimpleHtml(html || "");

  return (
    <View style={{ gap: 8 }}>
      {paragraphs.map((runs, i) => (
        <Text key={i} style={[{ fontSize: 14, color: colors.gray700, lineHeight: 20 }, computed]}>
          {runs.map((run, j) => (
            <Text
              key={j}
              style={{
                fontWeight: run.bold ? "700" : undefined,
                fontStyle: run.italic ? "italic" : undefined,
                textDecorationLine: run.underline ? "underline" : undefined,
              }}
            >
              {run.text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}
