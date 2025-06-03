import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import Field from "@/components/Field";
import { ThemedText } from "@/components/ThemedText";
import SaveHeader from "@/components/SaveHeader";
import { Colors } from "@/constants/Colors";
import { createHabit } from "@/api/habits";
import { Habit } from "@/types";
import PickerField from "@/components/PickerField";

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

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const initialValues: Omit<Habit, "created_at" | "streak_count" | "id"> = {
  title: "",
  frequency: "daily",
  tags: [],
};

export default function AddScreen() {
  const colorScheme = useColorScheme();
  const [habit, setHabit] =
    useState<Omit<Habit, "created_at" | "streak_count" | "id">>(initialValues);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const onToggleTag = (tag: string) => {
    setHabit((prevHabit) => {
      const tags = prevHabit.tags.includes(tag)
        ? prevHabit.tags.filter((t) => t !== tag)
        : [...prevHabit.tags, tag];
      return { ...prevHabit, tags };
    });
  };

  const saveToAsyncStorage = async (
    habit: Omit<Habit, "created_at" | "streak_count" | "id">
  ) => {
    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const newHabit = {
        ...habit,
        created_at: new Date().toISOString(),
        streak_count: 0,
        id: habits.length + 1, // Simple ID generation
      };
      habits.push(newHabit);
      await AsyncStorage.setItem("habits", JSON.stringify(habits));
      return newHabit;
    } catch (error) {
      console.log("Failed to save habit to AsyncStorage:", error);
      throw new Error("Failed to save habit");
    }
  };

  const saveToApi = async (
    habit: Omit<Habit, "created_at" | "streak_count" | "id">
  ) => {
    try {
      const data = await createHabit(habit);
      console.log("Habit created successfully:", data);
      return data;
    } catch (error) {
      console.log("Failed to create habit via API:", error);
      throw new Error("Failed to create habit");
    }
  };

  const onSave = async () => {
    setError(null);
    if (!habit.title.trim().length || habit.tags.length === 0) {
      setError("Please enter the habit title and select at least one tag.");
      return;
    }

    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      try {
        const newHabit = await saveToApi(habit);
        console.log("Habit saved successfully:", newHabit);
        Toast.show({
          type: "success",
          text1: "Habit saved successfully!",
          position: "bottom",
          visibilityTime: 2000,
        });
        setHabit(initialValues);
        router.navigate("/?refresh=true"); // Refresh the home screen

        // Optionally navigate back or show success message
      } catch (error) {
        setError(
          "Failed to save habit via API. Saving to local storage instead."
        );
      }
    } else {
      try {
        const newHabit = await saveToAsyncStorage(habit);
        console.log("Habit saved to AsyncStorage:", newHabit);
        // Optionally navigate back or show success message
      } catch (error) {
        setError("Failed to save habit to local storage.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SaveHeader
          title="Add Habit"
          description="Create a new habit to track your progress and improve your life."
          onSave={onSave}
        />
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Field
          label="Habit"
          placeholder="e.g., Drink more water"
          value={habit.title}
          onChangeText={(text) => setHabit({ ...habit, title: text })}
        />
        <PickerField
          label="Frequency"
          options={FREQUENCIES}
          value={habit.frequency}
          onChange={(value) => {
            setHabit({ ...habit, frequency: value });
          }}
        />
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
