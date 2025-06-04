import React from "react";
import { View, StyleSheet, Pressable, useColorScheme } from "react-native";
import { ThemedText } from "./ThemedText";
import Field from "./Field";
import PickerField from "./PickerField";
import { Colors } from "@/constants/Colors";
import { FREQUENCIES, HabitFormValues, TAGS } from "@/utils";

interface HabitFormProps {
  value: HabitFormValues;
  onChange: (val: HabitFormValues) => void;
  error?: string | null;
}

export default function HabitForm({ value, onChange, error }: HabitFormProps) {
  const colorScheme = useColorScheme();

  const onToggleTag = (tag: string) => {
    const tags = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags });
  };

  return (
    <>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      <Field
        label="Habit"
        placeholder="e.g., Drink more water"
        value={value.title}
        onChangeText={(text) => onChange({ ...value, title: text })}
      />
      <PickerField
        label="Frequency"
        options={FREQUENCIES}
        value={value.frequency}
        onChange={(freq) => onChange({ ...value, frequency: freq })}
      />
      <ThemedText type="defaultSemiBold">Tags</ThemedText>
      <View style={styles.tagsContainer}>
        {TAGS.map((tag) => (
          <Pressable key={tag} onPress={() => onToggleTag(tag)}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor: value.tags.includes(tag)
                    ? Colors[colorScheme ?? "light"].tint
                    : "#fff",
                  borderColor: value.tags.includes(tag)
                    ? Colors[colorScheme ?? "light"].tint
                    : "#ccc",
                },
              ]}
            >
              <ThemedText
                style={{ color: value.tags.includes(tag) ? "#fff" : "#000" }}
              >
                {tag}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    color: "red",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#ffe6e6",
    fontSize: 14,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
