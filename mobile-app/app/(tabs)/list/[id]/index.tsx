import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useRouter, useLocalSearchParams } from "expo-router";
// Use Link from react-native for now as a fallback

import HabitForm from "@/components/HabitForm";
import SaveHeader from "@/components/SaveHeader";
import { getHabit, updateHabit } from "@/api/habits";
import { Habit } from "@/types";
import { initialValues } from "@/utils";
import { Colors } from "@/constants/Colors";
import { HABITS_STORAGE_KEY } from "@/constants";

export default function HabitEditScreen() {
  const { id: idRaw } = useLocalSearchParams<{ id: string }>();
  const id = idRaw; // treat id as string

  const [habit, setHabit] = useState<Partial<Habit>>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHabit = async () => {
      try {
        // load from api first
        const habit = await getHabit(parseInt(id));
        if (habit) {
          setHabit({
            title: habit.title,
            frequency: habit.frequency,
            tags: Array.isArray(habit.tags)
              ? habit.tags
              : typeof habit.tags === "string"
              ? (() => {
                  try {
                    return JSON.parse(habit.tags);
                  } catch {
                    return [];
                  }
                })()
              : [],
          });
        }
      } catch {
        // locally find
        const existingRaw = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
        const localHabits: Habit[] = existingRaw ? JSON.parse(existingRaw) : [];
        const localHabit = localHabits.find((h) => String(h.id) === String(id));

        if (localHabit) {
          setHabit({
            ...localHabit,
            tags: Array.isArray(localHabit.tags)
              ? localHabit.tags
              : typeof localHabit.tags === "string"
              ? (() => {
                  try {
                    return JSON.parse(localHabit.tags);
                  } catch {
                    return [];
                  }
                })()
              : [],
          });
        }
      }
      // console.error("Failed to load habit from storage:", error);
    };

    fetchHabit();
  }, [id]);

  const saveToAsyncStorage = async (habit: Partial<Habit>) => {
    const existingRaw = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
    const localHabits: Habit[] = existingRaw ? JSON.parse(existingRaw) : [];

    await AsyncStorage.setItem(
      HABITS_STORAGE_KEY,
      JSON.stringify(
        localHabits.map((h) =>
          String(h.id) === String(habit.id) ? { ...habit, updated: true } : h
        )
      )
    );
  };

  const saveToApi = async (habit: Partial<Habit>) => {
    try {
      const data = await updateHabit(parseInt(id), habit);
      console.log("Habit updated successfully:", data);
      return data;
    } catch (error) {
      console.log("Failed to update habit via API:", error);
      throw new Error("Failed to update habit");
    }
  };

  const onSave = async () => {
    setError(null);
    if (!habit.title!.trim().length || habit.tags!.length === 0) {
      setError("Please enter the habit title and select at least one tag.");
      return;
    }
    // Duplicate title validation (exclude current habit)
    const existingRaw = await AsyncStorage.getItem("habits");
    const localHabits: Habit[] = existingRaw ? JSON.parse(existingRaw) : [];
    const normalize = (str: string) => str.trim().toLowerCase();
    const duplicate = localHabits.some(
      (h) =>
        normalize(h.title) === normalize(habit.title!) &&
        String(h.id) !== String(id)
    );
    if (duplicate) {
      setError("A habit with this title already exists.");
      return;
    }
    try {
      const newHabit = await saveToApi(habit);
      await saveToAsyncStorage(newHabit);
      Toast.show({
        type: "success",
        text1: "Habit saved successfully!",
        position: "bottom",
        visibilityTime: 2000,
      });
      router.push({
        pathname: "/list",
        params: { refresh: Date.now().toString() },
      });
    } catch {
      // Mark as updated if offline
      await saveToAsyncStorage({ ...habit, id: parseInt(id), updated: true });
      Toast.show({
        type: "info",
        text1: "Saved offline",
        text2: "Your changes will sync when you are online.",
        position: "bottom",
        visibilityTime: 2000,
      });
      router.push({
        pathname: "/list",
        params: { refresh: Date.now().toString() },
      });
    }
  };

  console.log("Editing habit:", habit);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <SaveHeader
          title="Edit Habit"
          description="Make changes to your habit"
          onSave={onSave}
        />
        {!id.toString().includes("offline") && (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/list/[id]/stats", params: { id } })
            }
            style={[
              styles.link,
              {
                backgroundColor: Colors.light.tint,
              },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Statistics</Text>
          </Pressable>
        )}
        <HabitForm value={habit} onChange={setHabit} error={error} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  link: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
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
