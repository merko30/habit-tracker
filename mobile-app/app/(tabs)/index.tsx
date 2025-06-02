import { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import { ThemedText } from "@/components/ThemedText";
import { getHabits } from "@/api/habits";
import { Habit } from "@/types";
import { Colors } from "@/constants/Colors";

const HABITS_STORAGE_KEY = "habits";

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

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
      <ScrollView>
        <View style={styles.headerContent}>
          <ThemedText type="title">Hello, John Doe!</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Your Habits
          </ThemedText>
        </View>
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
              <View
                style={[
                  styles.count,
                  { backgroundColor: Colors[colorScheme ?? "light"].tint },
                ]}
              >
                <ThemedText style={styles.streakCount}>
                  {item.streak_count}
                </ThemedText>
              </View>
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <ThemedText>Loading habits...</ThemedText>
            ) : (
              <ThemedText>No habits found</ThemedText>
            )
          }
        />
      </ScrollView>
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
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 4,
  },
  itemTitle: {
    fontWeight: "500",
  },
  count: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  streakCount: {
    color: "white",
  },
});
