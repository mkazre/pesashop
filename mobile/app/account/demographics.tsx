import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput, Switch,
  ActivityIndicator, StyleSheet, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { demographicsAPI } from "@/services/api";
import { useAuthStore } from "@/store";
import { colors } from "@/theme";

const HOBBIES = [
  "Cooking", "Baking", "Gardening", "Fitness", "Running", "Cycling",
  "Hiking", "Swimming", "Photography", "Reading", "Music", "Gaming",
  "DIY/Home Improvement", "Fashion", "Beauty", "Travel", "Fishing",
  "Arts & Crafts", "Sports", "Yoga", "Technology", "Cars", "Pets",
];

const SA_PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

export default function DemographicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setAuth } = useAuthStore();

  const [form, setForm] = useState({
    gender: user?.gender || "",
    maritalStatus: user?.maritalStatus || "",
    householdSize: user?.householdSize ? String(user.householdSize) : "",
    employmentStatus: user?.employmentStatus || "",
    incomeRange: user?.incomeRange || "",
    province: user?.province || "",
    suburb: user?.suburb || "",
    lifeStage: user?.lifeStage || "",
    hobbies: user?.hobbies || [],
    marketingOptIn: user?.marketingOptIn ?? false,
    demographicsConsentGiven: user?.demographicsConsentGiven ?? false,
  });

  const { data: completionData } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: () => demographicsAPI.getProfileCompletion(),
    staleTime: 60000,
  });
  const completion = completionData?.data?.data || {};

  const saveMutation = useMutation({
    mutationFn: (data: any) => demographicsAPI.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["profile-completion"] });
      Toast.show({ type: "success", text1: "Profile saved!" });
    },
    onError: (e: any) => {
      Toast.show({ type: "error", text1: e.response?.data?.message || "Save failed" });
    },
  });

  const toggleHobby = useCallback((hobby: string) => {
    setForm(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter((h: string) => h !== hobby)
        : [...prev.hobbies, hobby],
    }));
  }, []);

  const handleSave = () => {
    saveMutation.mutate({ ...form, householdSize: form.householdSize ? parseInt(form.householdSize) : undefined });
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray800} />
        </Pressable>
        <Text style={s.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile completion bar */}
        {completion.score !== undefined && completion.score < 100 && (
          <View style={s.completionBanner}>
            <Text style={s.completionTitle}>Complete your profile — earn {completion.rewardPoints || 100} PESA Coins</Text>
            <View style={s.progressTrack}>
              <View style={[s.progressBar, { width: `${completion.score}%` as any }]} />
            </View>
            <Text style={s.completionPct}>{completion.score}% complete</Text>
          </View>
        )}

        {/* Gender */}
        <SectionLabel label="Gender" />
        <ChipRow
          options={["male", "female", "non-binary", "prefer_not_to_say"]}
          labels={["Male", "Female", "Non-binary", "Prefer not to say"]}
          selected={form.gender}
          onSelect={(v) => setForm(p => ({ ...p, gender: v }))}
        />

        {/* Marital Status */}
        <SectionLabel label="Marital Status" />
        <ChipRow
          options={["single", "married", "divorced", "widowed", "prefer_not_to_say"]}
          labels={["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]}
          selected={form.maritalStatus}
          onSelect={(v) => setForm(p => ({ ...p, maritalStatus: v }))}
          wrap
        />

        {/* Employment Status */}
        <SectionLabel label="Employment Status" />
        <ChipRow
          options={["employed", "self_employed", "student", "retired", "unemployed", "prefer_not_to_say"]}
          labels={["Employed", "Self-Employed", "Student", "Retired", "Unemployed", "Prefer not to say"]}
          selected={form.employmentStatus}
          onSelect={(v) => setForm(p => ({ ...p, employmentStatus: v }))}
          wrap
        />

        {/* Income Range */}
        <SectionLabel label="Monthly Income Range" />
        <ChipRow
          options={["<15k", "15k-30k", "30k-60k", "60k-120k", ">120k", "prefer_not_to_say"]}
          labels={["< R15k", "R15k–30k", "R30k–60k", "R60k–120k", "> R120k", "Prefer not to say"]}
          selected={form.incomeRange}
          onSelect={(v) => setForm(p => ({ ...p, incomeRange: v }))}
          wrap
        />

        {/* Province */}
        <SectionLabel label="Province" />
        <ChipRow
          options={SA_PROVINCES}
          labels={SA_PROVINCES}
          selected={form.province}
          onSelect={(v) => setForm(p => ({ ...p, province: v }))}
          wrap
        />

        {/* Suburb */}
        <View style={s.field}>
          <Text style={s.fieldLabel}>Suburb / Area</Text>
          <TextInput
            value={form.suburb}
            onChangeText={(v) => setForm(p => ({ ...p, suburb: v }))}
            placeholder="e.g. Sandton"
            style={s.input}
          />
        </View>

        {/* Household size */}
        <View style={s.field}>
          <Text style={s.fieldLabel}>Household Size</Text>
          <TextInput
            value={form.householdSize}
            onChangeText={(v) => setForm(p => ({ ...p, householdSize: v }))}
            keyboardType="numeric"
            placeholder="e.g. 4"
            style={[s.input, { width: 80 }]}
          />
        </View>

        {/* Life Stage */}
        <SectionLabel label="Life Stage" />
        <ChipRow
          options={["student", "young_professional", "new_parent", "established_family", "empty_nester", "retiree"]}
          labels={["Student", "Young Professional", "New Parent", "Established Family", "Empty Nester", "Retiree"]}
          selected={form.lifeStage}
          onSelect={(v) => setForm(p => ({ ...p, lifeStage: v }))}
          wrap
        />

        {/* Hobbies */}
        <SectionLabel label="Hobbies & Interests" />
        <View style={s.chipWrap}>
          {HOBBIES.map(hobby => {
            const active = form.hobbies.includes(hobby);
            return (
              <Pressable
                key={hobby}
                onPress={() => toggleHobby(hobby)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{hobby}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Consent toggles */}
        <View style={[s.field, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Marketing Emails</Text>
            <Text style={s.fieldHint}>Receive personalised offers and deals</Text>
          </View>
          <Switch
            value={form.marketingOptIn}
            onValueChange={(v) => setForm(p => ({ ...p, marketingOptIn: v }))}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={[s.field, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Personalisation Consent</Text>
            <Text style={s.fieldHint}>Use my data to personalise my experience</Text>
          </View>
          <Switch
            value={form.demographicsConsentGiven}
            onValueChange={(v) => setForm(p => ({ ...p, demographicsConsentGiven: v }))}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {/* Save button */}
        <Pressable style={s.saveBtn} onPress={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>Save Profile</Text>
          )}
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray600 }}>{label}</Text>
    </View>
  );
}

function ChipRow({
  options, labels, selected, onSelect, wrap = false
}: {
  options: string[];
  labels: string[];
  selected: string;
  onSelect: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <View style={[{ paddingHorizontal: 12, paddingBottom: 4 }, wrap && s.chipWrap]}>
      {options.map((opt, i) => {
        const active = selected === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={[s.chip, active && s.chipActive, !wrap && { marginRight: 6, marginBottom: 6 }]}
          >
            <Text style={[s.chipText, active && s.chipTextActive]}>{labels[i]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  completionBanner: { backgroundColor: "#fffbeb", borderBottomWidth: 1, borderBottomColor: "#fde68a", padding: 14 },
  completionTitle: { fontSize: 13, fontWeight: "600", color: "#92400e", marginBottom: 8 },
  progressTrack: { height: 6, backgroundColor: "#fde68a", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: "#f59e0b", borderRadius: 3 },
  completionPct: { fontSize: 11, color: "#b45309" },
  field: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 6 },
  fieldHint: { fontSize: 11, color: colors.gray400, marginTop: 1 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.gray800, borderRadius: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 6, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white, marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: colors.gray900, borderColor: colors.gray900 },
  chipText: { fontSize: 12, color: colors.gray700 },
  chipTextActive: { color: colors.white, fontWeight: "600" },
  saveBtn: { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 20, paddingVertical: 14, alignItems: "center", borderRadius: 10 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
