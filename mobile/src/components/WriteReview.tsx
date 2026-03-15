import { useState } from "react";
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
import { reviewsAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

interface WriteReviewProps {
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

export default function WriteReview({ productId, productName, onReviewSubmitted }: WriteReviewProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={s.loginPrompt}>
        <Ionicons name="person-outline" size={16} color={colors.gray500} />
        <Text style={s.loginText}>Sign in to write a review</Text>
      </View>
    );
  }

  if (!expanded) {
    return (
      <Pressable onPress={() => setExpanded(true)} style={s.expandBtn}>
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={s.expandText}>Write a Review</Text>
      </Pressable>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: "error", text1: "Please select a rating" });
      return;
    }
    if (!comment.trim()) {
      Toast.show({ type: "error", text1: "Please write a comment" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("product", productId);
      formData.append("rating", String(rating));
      if (title.trim()) formData.append("title", title.trim());
      formData.append("content", comment.trim());
      await reviewsAPI.create(formData);
      Toast.show({ type: "success", text1: "Review submitted!", text2: "Thank you for your feedback" });
      setExpanded(false);
      setRating(0);
      setTitle("");
      setComment("");
      onReviewSubmitted?.();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to submit", text2: err.response?.data?.message || "Please try again" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.form}>
      <Text style={s.formTitle}>Write a Review</Text>

      <Text style={s.label}>Rating</Text>
      <View style={s.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={28}
              color={star <= rating ? colors.amber500 : colors.gray300}
            />
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Title (optional)</Text>
      <TextInput
        style={s.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Summarize your experience"
        placeholderTextColor={colors.gray400}
      />

      <Text style={s.label}>Your Review</Text>
      <TextInput
        style={[s.input, s.textArea]}
        value={comment}
        onChangeText={setComment}
        placeholder="What did you like or dislike?"
        placeholderTextColor={colors.gray400}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={s.btnRow}>
        <Pressable onPress={() => setExpanded(false)} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} style={[s.submitBtn, submitting && { opacity: 0.6 }]} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.submitText}>Submit Review</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  loginPrompt: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  loginText: { fontSize: 13, color: colors.gray500 },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 },
  expandText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  form: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray100 },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: colors.gray500, marginBottom: 6, marginTop: 12 },
  starRow: { flexDirection: "row", gap: 4 },
  input: { borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.gray800, backgroundColor: colors.gray50 },
  textArea: { minHeight: 100 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.gray200 },
  cancelText: { fontSize: 14, fontWeight: "600", color: colors.gray600 },
  submitBtn: { flex: 2, paddingVertical: 12, alignItems: "center", backgroundColor: colors.primary },
  submitText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
