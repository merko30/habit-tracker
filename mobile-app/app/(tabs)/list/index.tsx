import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { createCompletion } from "@/api/completions";

import { HABITS_STORAGE_KEY } from "@/constants";
import { useAuth } from "@/providers/Auth";
import { useCalculateRisk } from "@/utils/calculateRisk";

const PENDING_COMPLETIONS_KEY = "pendingCompletions";
type PendingCompletion = {
  habit_id: number;
  date: string;
  completed: boolean;
};

const syncPendingCompletions = async () => {
  const existing = await AsyncStorage.getItem(PENDING_COMPLETIONS_KEY);
  if (!existing) return;
  const pending: PendingCompletion[] = JSON.parse(existing);
  if (!Array.isArray(pending) || pending.length === 0) return;
  const successful: PendingCompletion[] = [];
  for (const completion of pending) {
    try {
      await createCompletion(completion);
      successful.push(completion);
    } catch {
      // If fails, keep in pending
    }
  }
  // Remove successful from pending
  const remaining = pending.filter(
    (c) =>
      !successful.some((s) => s.habit_id === c.habit_id && s.date === c.date)
  );
  if (remaining.length === 0) {
    await AsyncStorage.removeItem(PENDING_COMPLETIONS_KEY);
  } else {
    await AsyncStorage.setItem(
      PENDING_COMPLETIONS_KEY,
      JSON.stringify(remaining)
    );
  }
};

type DeletedHabit = Habit & {
  deleted?: boolean;
  updated?: boolean; // to track if it was updated locally
};

export default function HomeScreen() {
  const [habits, setHabits] = useState<DeletedHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const { user } = useAuth();

  const { refresh } = useLocalSearchParams();

  const note = useCalculateRisk();

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
      console.log("Loaded habits from API:", habitsFromApi.length);

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
      await syncPendingCompletions();
      const habitsFromStorageRaw = await AsyncStorage.getItem(
        HABITS_STORAGE_KEY
      );
      const { createHabit, updateHabit, deleteHabit } = await import(
        "@/api/habits"
      );

      let localHabits: DeletedHabit[] = habitsFromStorageRaw
        ? JSON.parse(habitsFromStorageRaw)
        : [];

      // check "deleted" field in local habits
      const habitsToDelete = localHabits.filter((h) => !h.deleted);
      // Step 1: DELETE habits that are marked as deleted
      for (const habit of habitsToDelete) {
        if (habit.deleted) {
          try {
            await deleteHabit(habit.id);
            // Remove from local storage
            localHabits = localHabits.filter((h) => h.id !== habit.id);
          } catch (err) {
            console.warn(`Failed to delete habit: ${habit.title}`, err);
          }
        }
      }

      const habitsToUpdate = localHabits.filter((h) => h.updated && !h.deleted);

      // Step 1: UPDATE habits that are marked as updated
      for (const habit of habitsToUpdate) {
        try {
          const updatedHabit = await updateHabit(habit.id, {
            title: habit.title,
            frequency: habit.frequency,
            tags: habit.tags || [],
          });
          // Update local habits array with the updated habit
          localHabits = localHabits.map((h) =>
            h.id === updatedHabit.id ? updatedHabit : h
          );
        } catch (err) {
          console.warn(`Failed to update habit: ${habit.title}`, err);
        }
      }

      // Step 2: CREATE offline habits
      const cleanedLocalHabits: Habit[] = [];
      for (const localHabit of localHabits) {
        const isOfflineId = localHabit.id.toString().includes("offline-");
        if (isOfflineId) {
          try {
            const { id, ...data } = localHabit;
            // Ensure tags is an array before sending to API
            const habitData = {
              ...data,
              tags: Array.isArray(data.tags)
                ? data.tags
                : (() => {
                    try {
                      return JSON.parse(data.tags);
                    } catch {
                      return [];
                    }
                  })(),
            };
            const created = await createHabit(habitData);
            cleanedLocalHabits.push(created); // add newly created habit with real ID
          } catch (err) {
            console.warn(`Failed to create habit: ${localHabit.title}`, err);
          }
        } else {
          // Ensure tags is always an array (not stringified)
          cleanedLocalHabits.push({
            ...localHabit,
            tags: Array.isArray(localHabit.tags)
              ? localHabit.tags
              : (() => {
                  try {
                    return JSON.parse(localHabit.tags);
                  } catch {
                    return [];
                  }
                })(),
          });
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
      // await loadHabitsFromStorage(); // always show local habits first

      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        loadHabitsFromApi(); // this will overwrite later with synced data
      } else {
        loadHabitsFromStorage(); // load from local storage if offline
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

  const sortedHabits = useMemo(
    () =>
      habits
        .slice()
        .sort((a, b) => {
          // Prioritize updated habits
          if (a.updated && !b.updated) return -1;
          if (!a.updated && b.updated) return 1;
          // Then sort by created_at
          return a.created_at.localeCompare(b.created_at);
        })
        .filter((habit) => !habit.deleted),
    [habits]
  );

  const name = useMemo(() => user?.display_name || user?.username, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.headerContent}>
          <ThemedText type="title">Hello, {name}</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Your Habits
          </ThemedText>
        </View>
        {note && (
          <View style={styles.infoNote}>
            <ThemedText>{note}</ThemedText>
          </View>
        )}
        <FlatList
          style={{ flex: 1, marginBottom: 100 }}
          data={sortedHabits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HabitItem habit={item} />}
          snapToAlignment="start"
          decelerationRate={"normal"}
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
  infoNote: {
    padding: 16,
    backgroundColor: "lightblue",
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
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
