import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/theme";

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search products...",
  autoFocus = false,
  editable = true,
}: SearchBarProps) {
  const router = useRouter();

  const handlePress = () => {
    if (!editable) {
      router.push("/search");
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={s.container}>
        <Ionicons name="search" size={18} color={colors.gray400} />
        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          editable={editable}
          pointerEvents={editable ? "auto" : "none"}
        />
        {value && value.length > 0 && (
          <Pressable onPress={() => onChangeText?.("")}>
            <Ionicons name="close-circle" size={18} color={colors.gray400} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", backgroundColor: colors.gray100, borderRadius: 0, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.gray800 },
});
