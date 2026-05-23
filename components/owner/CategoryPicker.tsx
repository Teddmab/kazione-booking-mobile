import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  value: string;
  onChange: (category: string) => void;
  suggestions: string[];
}

export function CategoryPicker({ value, onChange, suggestions }: Props) {
  const [focused, setFocused] = useState(false);
  const filtered = suggestions.filter(
    (s) => !value.trim() || s.toLowerCase().includes(value.trim().toLowerCase()),
  );

  return (
    <View>
      <Text style={styles.label}>Catégorie</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Ex. Coiffure, Tresses…"
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {focused && filtered.length > 0 ? (
        <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {filtered.map((s) => (
            <Pressable
              key={s}
              style={styles.suggestionRow}
              onPress={() => {
                onChange(s);
                setFocused(false);
              }}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: ownerColors.textDim, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: ownerColors.card,
  },
  suggestions: {
    maxHeight: 120,
    marginTop: 6,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    backgroundColor: ownerColors.card,
  },
  suggestionRow: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ownerColors.border },
  suggestionText: { fontSize: 15, color: ownerColors.text },
});
