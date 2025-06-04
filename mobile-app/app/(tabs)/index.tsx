import { useEffect, useState, useCallback, useRef } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/ThemedText";
import { getHabits } from "@/api/habits";
import { Habit } from "@/types";
import HabitItem from "@/components/HabitItem";
import { ThemedView } from "@/components/ThemedView";

import { HABITS_STORAGE_KEY } from "@/constants";

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const { refresh } = useLocalSearchParams();

  // Add loadHabitsFromStorage if not present
  const loadHabitsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (_e) {
      setError("Failed to load habits from storage");
    } finally {
      setLoading(false);
    }
  };

  const loadHabitsFromApi = async () => {
    try {
      const habitsFromApi = await getHabits();
      setHabits(habitsFromApi);
      // await AsyncStorage.setItem(
      //   HABITS_STORAGE_KEY,
      //   JSON.stringify(habitsFromApi)
      // );
    } catch (e) {
      console.error("Failed to load habits from API", e);
      setError("Failed to load habits from API");
    } finally {
      setLoading(false);
    }
  };

  const syncHabits = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const habitsFromStorageRaw = await AsyncStorage.getItem(
        HABITS_STORAGE_KEY
      );
      const habitsFromDatabase = await getHabits();
      const { createHabit, updateHabit, deleteHabit } = await import(
        "@/api/habits"
      );

      let localHabits: Habit[] = habitsFromStorageRaw
        ? JSON.parse(habitsFromStorageRaw)
        : [];

      const remoteMap = new Map(habitsFromDatabase.map((h) => [h.id, h]));
      const localMap = new Map(localHabits.map((h) => [h.id, h]));

      console.log(localMap);

      // Step 1: DELETE remote habits not in local
      for (const remoteHabit of habitsFromDatabase) {
        if (!localMap.has(remoteHabit.id)) {
          try {
            await deleteHabit(remoteHabit.id);
          } catch (err) {
            console.warn(`Failed to delete habit: ${remoteHabit.title}`, err);
          }
        }
      }

      // Step 2: CREATE offline habits
      const cleanedLocalHabits: Habit[] = [];
      for (const localHabit of localHabits) {
        const isOfflineId = localHabit.id.toString().includes("offline-");
        if (isOfflineId) {
          try {
            const { id, ...data } = localHabit;

            const created = await createHabit(data);
            cleanedLocalHabits.push(created); // add newly created habit with real ID
          } catch (err) {
            console.warn(`Failed to create habit: ${localHabit.title}`, err);
          }
        } else {
          cleanedLocalHabits.push(localHabit); // keep existing synced habit
        }
      }

      // Step 3: Save cleanedLocalHabits (which should now have NO offline-* IDs)
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(cleanedLocalHabits)
      );

      // Step 4: Finalize by fetching fresh server data
      const latestFromServer = await getHabits();
      setHabits(latestFromServer);
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(latestFromServer)
      );
    } catch (e) {
      console.log("error syncing habits", e);
    } finally {
      syncingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkConnectionAndLoad = async () => {
      await loadHabitsFromStorage(); // always show local habits first

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        loadHabitsFromApi(); // this will overwrite later with synced data
      }
    };
    checkConnectionAndLoad();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncHabits();
      } else {
        loadHabitsFromStorage();
      }
    });
    return () => unsubscribe();
  }, []);

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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
