import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "@/components/ProductCard";
import { colors } from "@/theme";
import { visualSearchAPI } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VisualSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runTextSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setDescription("");
    try {
      const res = await visualSearchAPI.byText(query.trim());
      setResults(res.data?.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runImageSearch = async (asset: ImagePicker.ImagePickerAsset) => {
    setLoading(true);
    setHasSearched(true);
    setQuery("");
    try {
      let fileUri = asset.uri;
      if (Platform.OS === "ios" && !fileUri.startsWith("file://")) {
        fileUri = "file://" + fileUri;
      }
      const mime = asset.mimeType || "image/jpeg";
      const fileName = asset.fileName || `photo.${mime.split("/")[1] || "jpg"}`;

      const formData = new FormData();
      formData.append("image", { uri: fileUri, name: fileName, type: mime } as any);

      const res = await visualSearchAPI.byImage(formData);
      setDescription(res.data?.data?.description || "");
      setResults(res.data?.data?.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ["images"] });
    if (!result.canceled && result.assets?.[0]) runImageSearch(result.assets[0]);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"] });
    if (!result.canceled && result.assets?.[0]) runImageSearch(result.assets[0]);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray700} />
        </Pressable>
        <Text style={s.headerTitle}>Search by photo</Text>
      </View>

      <View style={s.body}>
        <View style={s.searchRow}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Describe what you're looking for..."
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runTextSearch}
            returnKeyType="search"
          />
          <Pressable onPress={runTextSearch} style={s.searchBtn}>
            <Text style={s.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        <Text style={s.orText}>or</Text>

        <View style={s.photoRow}>
          <Pressable onPress={takePhoto} style={s.photoTile}>
            <Ionicons name="camera-outline" size={26} color={colors.primary} />
            <Text style={s.photoTileText}>Take Photo</Text>
          </Pressable>
          <Pressable onPress={pickPhoto} style={s.photoTile}>
            <Ionicons name="images-outline" size={26} color={colors.primary} />
            <Text style={s.photoTileText}>Choose from Gallery</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && description ? (
          <View style={s.descBanner}>
            <Text style={s.descText}>
              <Text style={{ fontWeight: "700" }}>We see: </Text>
              {description}
            </Text>
          </View>
        ) : null}

        {!loading && hasSearched && results.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No matching products yet</Text>
            <Text style={s.emptySub}>
              We're still indexing the catalogue. Try again in a few minutes, or use the regular search.
            </Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item: any) => item._id}
            numColumns={2}
            columnWrapperStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 12 }}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
            renderItem={({ item }: any) => (
              <View style={{ width: (SCREEN_WIDTH - 44) / 2 }}>
                <ProductCard product={item} />
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  body: { flex: 1 },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.gray800 },
  searchBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  searchBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  orText: { textAlign: "center", color: colors.gray400, fontSize: 12, marginTop: 12 },
  photoRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 12 },
  photoTile: { flex: 1, borderWidth: 2, borderStyle: "dashed", borderColor: colors.gray200, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 6 },
  photoTileText: { fontSize: 12, color: colors.gray500, fontWeight: "500" },
  loadingWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 32 },
  loadingText: { marginTop: 8, fontSize: 13, color: colors.gray500 },
  descBanner: { marginHorizontal: 16, marginTop: 16, padding: 10, backgroundColor: colors.primaryLight },
  descText: { fontSize: 13, color: colors.primary },
  emptyWrap: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.gray700 },
  emptySub: { fontSize: 12, color: colors.gray400, textAlign: "center", marginTop: 4 },
});
