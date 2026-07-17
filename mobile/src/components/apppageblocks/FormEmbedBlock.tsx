import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { formsAPI } from "@/services/api";
import { applyBlockStyle } from "./applyBlockStyle";

export default function FormEmbedBlock({ block }: { block: any }) {
  const { formId, showTitle, style } = block.props || {};
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      return;
    }
    formsAPI
      .getPublic(formId)
      .then((res) => setForm(res.data?.data || null))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [formId]);

  if (!formId) return null;
  if (loading) {
    return (
      <View style={{ paddingVertical: 24 }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!form) return null;

  const setValue = (fieldId: string, value: any) => setValues((v) => ({ ...v, [fieldId]: value }));

  const pickFile = async (fieldId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setFiles((f) => ({ ...f, [fieldId]: result.assets[0] }));
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not pick file" });
    }
  };

  const handleSubmit = async () => {
    const missing = (form.fields || []).filter(
      (f: any) => f.required && f.fieldType !== "section-break" && !values[f._id] && !files[f._id]
    );
    if (missing.length > 0) {
      Toast.show({ type: "error", text1: `Please fill in: ${missing.map((f: any) => f.label).join(", ")}` });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify(values));

      Object.entries(files).forEach(([fieldId, asset]: [string, any]) => {
        let fileUri = asset.uri;
        if (Platform.OS === "ios" && !fileUri.startsWith("file://")) fileUri = "file://" + fileUri;
        fd.append(fieldId, {
          uri: fileUri,
          name: asset.name || "upload",
          type: asset.mimeType || "application/octet-stream",
        } as any);
      });

      await formsAPI.submit(formId, fd);
      setSubmitted(true);
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "Failed to submit" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[{ padding: 20, alignItems: "center" }, applyBlockStyle(style)]}>
        <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
        <Text style={{ fontSize: 14, color: colors.gray700, textAlign: "center", marginTop: 10 }}>
          {form.successMessage || "Thank you! Your submission has been received."}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ gap: 14 }, applyBlockStyle(style)]}>
      {showTitle !== false && !!form.title && <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray900 }}>{form.title}</Text>}
      {!!form.description && <Text style={{ fontSize: 13, color: colors.gray500 }}>{form.description}</Text>}

      {(form.fields || []).map((field: any) => (
        <FormFieldInput
          key={field._id}
          field={field}
          value={values[field._id]}
          file={files[field._id]}
          onChange={(v: any) => setValue(field._id, v)}
          onPickFile={() => pickFile(field._id)}
        />
      ))}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={{ backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : (
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{form.submitButtonText || "Submit"}</Text>
        )}
      </Pressable>
    </View>
  );
}

function FormFieldInput({ field, value, file, onChange, onPickFile }: any) {
  if (field.fieldType === "section-break") {
    return (
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.gray700, borderBottomWidth: 1, borderBottomColor: colors.gray200, paddingBottom: 6 }}>
        {field.label}
      </Text>
    );
  }
  if (field.fieldType === "hidden") return null;

  const label = (
    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray700, marginBottom: 6 }}>
      {field.label}{field.required ? " *" : ""}
    </Text>
  );

  if (field.fieldType === "textarea") {
    return (
      <View>
        {label}
        <TextInput
          value={value || ""}
          onChangeText={onChange}
          placeholder={field.placeholder}
          multiline
          numberOfLines={4}
          style={{ borderWidth: 1, borderColor: colors.gray200, padding: 10, fontSize: 14, minHeight: 90, textAlignVertical: "top" }}
        />
      </View>
    );
  }

  if (field.fieldType === "select" || field.fieldType === "radio") {
    return (
      <View>
        {label}
        <View style={{ gap: 6 }}>
          {(field.options || []).map((opt: string, i: number) => (
            <Pressable key={i} onPress={() => onChange(opt)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name={value === opt ? "radio-button-on" : "radio-button-off"} size={16} color={value === opt ? colors.primary : colors.gray400} />
              <Text style={{ fontSize: 13, color: colors.gray700 }}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (field.fieldType === "checkbox") {
    const selected: string[] = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
    };
    return (
      <View>
        {label}
        <View style={{ gap: 6 }}>
          {(field.options || []).map((opt: string, i: number) => (
            <Pressable key={i} onPress={() => toggle(opt)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name={selected.includes(opt) ? "checkbox" : "square-outline"} size={16} color={selected.includes(opt) ? colors.primary : colors.gray400} />
              <Text style={{ fontSize: 13, color: colors.gray700 }}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (field.fieldType === "file") {
    return (
      <View>
        {label}
        <Pressable onPress={onPickFile} style={{ borderWidth: 1, borderColor: colors.gray200, borderStyle: "dashed", padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: file ? colors.gray700 : colors.gray400 }}>{file?.name || "Tap to choose a file"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {label}
      <TextInput
        value={value || ""}
        onChangeText={onChange}
        placeholder={field.placeholder}
        keyboardType={field.fieldType === "email" ? "email-address" : field.fieldType === "phone" ? "phone-pad" : "default"}
        autoCapitalize={field.fieldType === "email" ? "none" : "sentences"}
        style={{ borderWidth: 1, borderColor: colors.gray200, padding: 10, fontSize: 14 }}
      />
    </View>
  );
}
