import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

import HabitForm from "@/components/HabitForm";
import SaveHeader from "@/components/SaveHeader";
import { createHabit } from "@/api/habits";
import { Habit } from "@/types";
import { HabitFormValues, initialValues, normalize } from "@/utils";
import { PADDING_TOP } from "@/constants/styles";

export default function AddScreen() {
  const [habit, setHabit] = useState<HabitFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const resetAndNavigate = () => {
    setHabit(initialValues);
    router.navigate(`/list?refresh=${Date.now()}`);
  };

  const saveToAsyncStorage = async (habit: Partial<Habit>) => {
    try {
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const newHabit = {
        ...habit,
        streak_count: 0,
        completed_today: false,
        ...(!habit.id
          ? {
              id: `offline-${Date.now()}`,
              created_at: new Date().toISOString(),
            }
          : {}),
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
    try {
      // Check for duplicate title offline before saving
      const existingHabits = await AsyncStorage.getItem("habits");
      const habits = existingHabits ? JSON.parse(existingHabits) : [];
      const habitExists = habits.some(
        (h: Habit) => normalize(h.title) === normalize(habit.title)
      );
      if (habitExists) {
        setError("A habit with this title already exists.");
        return;
      }
      const newHabit = await saveToApi(habit);
      await saveToAsyncStorage(newHabit ?? habit);
      Toast.show({
        type: "success",
        text1: "Habit saved successfully!",
        position: "bottom",
        visibilityTime: 2000,
      });
      resetAndNavigate();
    } catch (error) {
      console.log(error);
      // Only check for duplicate again if not already checked
      await saveToAsyncStorage(habit);
      setHabit(initialValues);
      router.navigate(`/list?refresh=${Date.now()}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <SaveHeader
          title="Add Habit"
          description="Create a new habit to track your progress and improve your life."
          onSave={onSave}
        />
        <HabitForm value={habit} onChange={setHabit} error={error} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: PADDING_TOP,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
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
