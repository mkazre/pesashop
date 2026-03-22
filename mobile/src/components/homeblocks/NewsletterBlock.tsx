import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageUrl } from "@/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function NewsletterBlock({ block }: { block: any }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        Alert.alert("Success", "Subscribed successfully!");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Error", data.message || "Subscription failed");
      }
    } catch {
      Alert.alert("Error", "Subscription failed");
    } finally {
      setSubmitting(false);
    }
  };

  const bgImg = resolveImageUrl(block.bgImage);

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: block.bgColor || "#0F604B",
          paddingVertical: parseInt(block.paddingTop) || 40,
        },
      ]}
    >
      {bgImg ? (
        <>
          <Image
            source={{ uri: bgImg }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
        </>
      ) : null}
      <View style={s.inner}>
        {block.showIcon !== false && (
          <Ionicons
            name="mail-outline"
            size={36}
            color={block.textColor || "#fff"}
            style={{ alignSelf: "center", marginBottom: 10 }}
          />
        )}
        {block.heading ? (
          <Text
            style={[s.heading, { color: block.textColor || "#fff" }]}
          >
            {block.heading}
          </Text>
        ) : null}
        {block.subtitle ? (
          <Text style={[s.subtitle, { color: block.textColor || "#fff" }]}>
            {block.subtitle}
          </Text>
        ) : null}
        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder={block.placeholder || "Enter your email address"}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              s.button,
              {
                backgroundColor: block.buttonBgColor || "#f7bd20",
                opacity: submitting ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[s.buttonText, { color: block.buttonTextColor || "#333" }]}
            >
              {submitting ? "..." : block.buttonText || "Subscribe"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  inner: {
    position: "relative",
    zIndex: 10,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.9,
    marginBottom: 16,
  },
  form: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 400,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
