import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import Field from "@/components/Field";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Habit } from "@/types";

const TAGS = [
  "Health",
  "Fitness",
  "Productivity",
  "Mental Health",
  "Learning",
  "Personal Growth",
  "Social",
  "Financial",
  "Creative",
];

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly", "custom"];

export default function AddScreen() {
  const colorScheme = useColorScheme();
  const [habit, setHabit] = useState<
    Omit<Habit, "created_at" | "streak_count" | "id">
  >({
    title: "",
    frequency: "daily",
    tags: [],
  });
  const [error, setError] = useState<string | null>(null);

  const onToggleTag = (tag: string) => {
    setHabit((prevHabit) => {
      const tags = prevHabit.tags.includes(tag)
        ? prevHabit.tags.filter((t) => t !== tag)
        : [...prevHabit.tags, tag];
      return { ...prevHabit, tags };
    });
  };

  const onSave = () => {
    setError(null);
    if (!habit.title.trim().length || habit.tags.length === 0) {
      setError("Please enter the habit title and select at least one tag.");
      return;
    }

    console.log("Habit saved:", habit);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.header]}>
          <View style={styles.titleContainer}>
            <ThemedText type="title">Add your habit</ThemedText>
            <ThemedText type="default" style={styles.description}>
              This is where you can add a new habit. Use the form below to enter
              the details of your habit.
            </ThemedText>
          </View>
          <Pressable
            onPress={onSave}
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme ?? "light"].tint },
            ]}
          >
            <MaterialIcons name="check" size={24} color="#fff" />
          </Pressable>
        </View>
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Field
          label="Habit"
          placeholder="e.g., Drink more water"
          value={habit.title}
          onChangeText={(text) => setHabit({ ...habit, title: text })}
        />
        <View>
          <ThemedText type="defaultSemiBold">Frequency</ThemedText>
          <Picker
            selectedValue={habit.frequency}
            onValueChange={(itemValue) =>
              setHabit({ ...habit, frequency: itemValue })
            }
            style={styles.picker}
          >
            {FREQUENCIES.map((freq) => (
              <Picker.Item
                key={freq}
                label={freq.charAt(0).toUpperCase() + freq.slice(1)}
                value={freq}
              />
            ))}
          </Picker>
        </View>
        <ThemedText type="defaultSemiBold">Tags</ThemedText>
        <View style={styles.tagsContainer}>
          {TAGS.map((tag) => (
            <Pressable key={tag} onPress={() => onToggleTag(tag)}>
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: habit.tags.includes(tag)
                      ? Colors[colorScheme ?? "light"].tint
                      : "#fff",
                    borderColor: habit.tags.includes(tag)
                      ? Colors[colorScheme ?? "light"].tint
                      : "#ccc",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: habit.tags.includes(tag) ? "#fff" : "#000",
                  }}
                >
                  {tag}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
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
  description: {
    marginBottom: 16,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 9999,
  },
});
