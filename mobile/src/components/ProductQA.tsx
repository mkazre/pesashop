import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { questionsAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

interface ProductQAProps {
  productId: string;
}

export default function ProductQA({ productId }: ProductQAProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    questionsAPI.getForProduct(productId, { limit: 10 })
      .then((res) => setQuestions(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async () => {
    if (!newQuestion.trim()) {
      Toast.show({ type: "error", text1: "Please enter a question" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await questionsAPI.ask({ productId, question: newQuestion.trim() });
      setQuestions((prev) => [res.data?.data || { question: newQuestion, createdAt: new Date() }, ...prev]);
      setNewQuestion("");
      setShowForm(false);
      Toast.show({ type: "success", text1: "Question submitted!", text2: "You'll be notified when answered" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to submit", text2: err.response?.data?.message || "Please try again" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 20 }} />;
  }

  return (
    <View>
      {questions.length === 0 && !showForm && (
        <Text style={s.emptyText}>No questions yet. Be the first to ask!</Text>
      )}

      {questions.map((q: any, i: number) => (
        <View key={q._id || i} style={[s.qaItem, i < questions.length - 1 && s.qaItemBorder]}>
          <View style={s.qRow}>
            <Text style={s.qLabel}>Q</Text>
            <Text style={s.qText}>{q.question}</Text>
          </View>
          {q.answers && q.answers.length > 0 ? (
            q.answers.map((a: any, ai: number) => (
              <View key={a._id || ai} style={s.aRow}>
                <Text style={s.aLabel}>A</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.aText}>{a.content}</Text>
                  {a.user && (
                    <Text style={s.aBy}>
                      — {a.isAdminAnswer ? "Store" : `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() || "User"}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={s.pendingText}>Awaiting answer...</Text>
          )}
          <Text style={s.dateText}>{new Date(q.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}

      {isAuthenticated ? (
        showForm ? (
          <View style={s.form}>
            <TextInput
              style={s.input}
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Type your question..."
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={s.btnRow}>
              <Pressable onPress={() => setShowForm(false)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSubmit} style={[s.submitBtn, submitting && { opacity: 0.6 }]} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.submitText}>Ask Question</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setShowForm(true)} style={s.askBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
            <Text style={s.askText}>Ask a Question</Text>
          </Pressable>
        )
      ) : (
        <View style={s.loginPrompt}>
          <Ionicons name="person-outline" size={14} color={colors.gray500} />
          <Text style={s.loginText}>Sign in to ask a question</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  emptyText: { fontSize: 13, color: colors.gray400, paddingVertical: 12, fontStyle: "italic" },
  qaItem: { paddingVertical: 12 },
  qaItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  qRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  qLabel: { fontSize: 13, fontWeight: "800", color: colors.primary, width: 18 },
  qText: { fontSize: 13, fontWeight: "600", color: colors.gray900, flex: 1 },
  aRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  aLabel: { fontSize: 13, fontWeight: "800", color: colors.gray500, width: 18 },
  aText: { fontSize: 13, color: colors.gray700, flex: 1, lineHeight: 20 },
  aBy: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  pendingText: { fontSize: 12, color: colors.gray400, fontStyle: "italic", marginLeft: 26, marginTop: 4 },
  dateText: { fontSize: 10, color: colors.gray400, marginTop: 4, marginLeft: 26 },
  form: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100, paddingTop: 12 },
  input: { borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray800, backgroundColor: colors.gray50, minHeight: 80 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: colors.gray200 },
  cancelText: { fontSize: 14, fontWeight: "600", color: colors.gray600 },
  submitBtn: { flex: 2, paddingVertical: 10, alignItems: "center", backgroundColor: colors.primary },
  submitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  askBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 },
  askText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  loginPrompt: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  loginText: { fontSize: 12, color: colors.gray500 },
});
