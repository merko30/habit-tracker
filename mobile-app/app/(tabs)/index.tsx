import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { getHabits } from "@/api/habits";
import { Habit } from "@/types";
import HabitItem from "@/components/HabitItem";
import { ThemedView } from "@/components/ThemedView";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const HABITS_STORAGE_KEY = "habits";

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { refresh } = useLocalSearchParams();

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
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.headerContent}>
          <ThemedText type="title">Hello, John Doe!</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Your Habits
          </ThemedText>
        </View>
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HabitItem habit={item} />}
          ListEmptyComponent={
            loading ? (
              <ThemedText>Loading habits...</ThemedText>
            ) : (
              <ThemedView style={styles.placeholder}>
                <MaterialIcons name="search" size={48} color="lightgray" />
                <ThemedText type="subtitle" style={styles.placeholderText}>
                  No habits found
                </ThemedText>
              </ThemedView>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  subtitle: {
    marginBottom: 16,
  },
  placeholder: {
    flex: 1,
    paddingTop: "50%",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    color: "lightgray",
    fontSize: 32,
    fontWeight: "700",
  },
});
