import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { aiAPI } from "@/services/api";
import { colors } from "@/theme";

interface ProductAIAssistantProps {
  product: any;
}

interface Message {
  type: "user" | "ai";
  text: string;
}

export default function ProductAIAssistant({ product }: ProductAIAssistantProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Pressable onPress={() => setExpanded(true)} style={s.collapsedCard}>
        <View style={s.collapsedRow}>
          <View style={s.aiIcon}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.collapsedTitle}>Ask PESA AI</Text>
            <Text style={s.collapsedSub}>Get instant answers about this product</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </View>
      </Pressable>
    );
  }

  const handleSubmit = async () => {
    if (!question.trim()) {
      Toast.show({ type: "error", text1: "Please enter a question" });
      return;
    }
    const q = question.trim();
    setQuestion("");
    setConversation((prev) => [...prev, { type: "user", text: q }]);
    setLoading(true);

    try {
      const res = await aiAPI.askProductAssistant({
        question: q,
        productId: product._id,
        productName: product.name,
        productDescription: product.description || "",
      });
      const answer = res.data?.data?.answer || res.data?.answer || "No response received.";
      setConversation((prev) => [...prev, { type: "ai", text: answer }]);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to get response. Please try again.";
      setConversation((prev) => [...prev, { type: "ai", text: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.aiIcon}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <Text style={s.headerTitle}>Ask PESA AI</Text>
        </View>
        <Pressable onPress={() => setExpanded(false)}>
          <Ionicons name="chevron-down" size={20} color={colors.gray500} />
        </Pressable>
      </View>

      <Text style={s.subtitle}>
        Get instant answers about specifications, compatibility, usage tips, and more.
      </Text>

      {conversation.length > 0 && (
        <ScrollView style={s.chatArea} nestedScrollEnabled>
          {conversation.map((msg, i) => (
            <View
              key={i}
              style={[
                s.bubble,
                msg.type === "user" ? s.userBubble : s.aiBubble,
              ]}
            >
              <Text style={s.bubbleLabel}>{msg.type === "user" ? "You" : "PESA AI"}</Text>
              <Text style={[s.bubbleText, msg.type === "user" ? s.userText : s.aiText]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={[s.bubble, s.aiBubble]}>
              <Text style={s.bubbleLabel}>PESA AI</Text>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </ScrollView>
      )}

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about this product..."
          placeholderTextColor={colors.gray400}
          editable={!loading}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSubmit}
          disabled={loading || !question.trim()}
          style={[s.sendBtn, (!question.trim() || loading) && { opacity: 0.5 }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  collapsedCard: { backgroundColor: colors.gray50, padding: 14, borderWidth: 1, borderColor: colors.gray100 },
  collapsedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  collapsedTitle: { fontSize: 14, fontWeight: "700", color: colors.gray900 },
  collapsedSub: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  aiIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: 12, color: colors.gray500, lineHeight: 18, marginBottom: 12 },
  chatArea: { maxHeight: 200, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.gray100, paddingVertical: 8 },
  bubble: { marginBottom: 8, padding: 10, borderRadius: 8 },
  userBubble: { backgroundColor: colors.primary, alignSelf: "flex-end", maxWidth: "85%" },
  aiBubble: { backgroundColor: colors.gray50, alignSelf: "flex-start", maxWidth: "85%" },
  bubbleLabel: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", marginBottom: 3, opacity: 0.7 },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  userText: { color: "#fff" },
  aiText: { color: colors.gray800 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray800, backgroundColor: colors.gray50 },
  sendBtn: { width: 44, height: 44, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
