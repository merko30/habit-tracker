import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import { ThemedText } from "@/components/ThemedText";
import { getHabits } from "@/api/habits";
import { Habit } from "@/types";

const HABITS_STORAGE_KEY = "habits";

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabitsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (e) {
      setError("Failed to load habits from storage");
    } finally {
      setLoading(false);
    }
  };

  const loadHabitsFromApi = async () => {
    try {
      const data = await getHabits();
      console.log("Fetched habits from API:", data);
      setHabits(data);
      // Cache to storage for offline use
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      setError("Failed to load habits from API");
      // fallback to storage if API fails
      await loadHabitsFromStorage();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnectionAndLoad = async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        console.log("Network is connected, loading habits from API");
        loadHabitsFromApi();
      } else {
        console.log("Network is offline, loading habits from storage");
        loadHabitsFromStorage();
      }
    };

    checkConnectionAndLoad();
  }, []);

  console.log("Loaded habits:", habits);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title">Hello, John Doe!</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
