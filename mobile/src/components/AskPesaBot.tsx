import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { aiAPI } from "@/services/api";
import { colors } from "@/theme";

interface BotMessage {
  role: "user" | "bot";
  text: string;
  isError?: boolean;
}

export default function AskPesaBot({ primaryColor }: { primaryColor: string }) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList<BotMessage>>(null);

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const res = await aiAPI.askAssistant(trimmed);
      const answer = res.data?.data?.answer || t("chat.askBot.errorGeneric");
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: t("chat.askBot.errorGeneric"), isError: true }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={bs.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={bs.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={bs.emptyText}>{t("chat.askBot.title")}</Text>}
        renderItem={({ item }) => (
          <View style={[bs.msgRow, item.role === "user" ? bs.msgRowRight : bs.msgRowLeft]}>
            <View
              style={[
                bs.bubble,
                item.role === "user" ? { backgroundColor: primaryColor } : item.isError ? bs.bubbleError : bs.bubbleBot,
              ]}
            >
              <Text style={[bs.bubbleText, item.role === "user" && { color: "#fff" }]}>{item.text}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isLoading ? (
            <View style={bs.loadingRow}>
              <ActivityIndicator size="small" color={primaryColor} />
            </View>
          ) : null
        }
      />
      <View style={bs.inputRow}>
        <TextInput
          style={bs.textInput}
          value={question}
          onChangeText={setQuestion}
          placeholder={t("chat.askBot.placeholder")}
          placeholderTextColor={colors.gray400}
          maxLength={1000}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!question.trim() || isLoading}
          style={[bs.sendBtn, { backgroundColor: primaryColor }, (!question.trim() || isLoading) && { opacity: 0.4 }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const bs = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: 16, flexGrow: 1 },
  emptyText: { fontSize: 13, color: colors.gray400, textAlign: "center", marginTop: 20 },
  msgRow: { marginBottom: 8 },
  msgRowLeft: { alignItems: "flex-start" },
  msgRowRight: { alignItems: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200 },
  bubbleError: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  bubbleText: { fontSize: 14, color: colors.gray900, lineHeight: 20 },
  loadingRow: { paddingVertical: 8, alignItems: "flex-start", paddingLeft: 4 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.white, gap: 8 },
  textInput: { flex: 1, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.gray900, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
