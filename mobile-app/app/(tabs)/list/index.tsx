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
import FrequencyLegend from "@/components/FrequencyLegend";
import { withParsedTags } from "@/utils/tags";

import { HABITS_STORAGE_KEY } from "@/constants";
import { useAuth } from "@/providers/Auth";
import { useCalculateRisk } from "@/utils/calculateRisk";
import { loadLocalHabits } from "@/utils/localHabits";
import { syncPendingCompletions } from "@/utils/localCompletions";

type DeletedHabit = Habit & {
  deleted?: boolean;
  updated?: boolean; // to track if it was updated locally
};

export default function HomeScreen() {
  const [habits, setHabits] = useState<DeletedHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnlineRef = useRef(true);
  const syncingRef = useRef(false);

  const { user } = useAuth();

  const { refresh } = useLocalSearchParams();

  const note = useCalculateRisk();

  const syncHabits = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      await syncPendingCompletions();
      let localHabits = await loadLocalHabits();
      const { createHabit, updateHabit, deleteHabit } = await import(
        "@/api/habits"
      );

      // check "deleted" field in local habits
      const habitsToDelete = localHabits.filter((h) => h.deleted);

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
            tags: withParsedTags(habit).tags,
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
              tags: withParsedTags(data).tags,
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
            tags: withParsedTags(localHabit).tags || [],
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

  // event that sets network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      isOnlineRef.current = !!state.isConnected;
    });

    return () => unsubscribe();
  }, []);

  // depending on the internet state and refresh param, load habits
  useEffect(() => {
    const loadHabits = async () => {
      setLoading(true);
      try {
        if (!isOnlineRef.current) {
          // If refresh is true or we're offline, load from local storage
          const habits = await loadLocalHabits();
          setHabits(habits);
        } else {
          // If online, fetch from server
          await syncHabits();
        }
      } catch (error) {
        console.error("Failed to load habits:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, [refresh]);

  const sortedHabits = useMemo(
    () =>
      habits
        .slice()
        .filter((habit) => !habit.deleted)
        .sort(),
    [habits]
  );

  const name = user?.display_name || user?.username;

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
        <FrequencyLegend />
        <FlatList
          style={{ flex: 1 }}
          data={sortedHabits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HabitItem habit={item} />}
          snapToAlignment="start"
          decelerationRate={"normal"}
          ListEmptyComponent={
            loading ? (
              <ThemedView style={styles.placeholder}>
                <MaterialIcons
                  name="hourglass-empty"
                  size={48}
                  color="lightgray"
                />
                <ThemedText type="subtitle" style={styles.placeholderText}>
                  Loading habits...
                </ThemedText>
              </ThemedView>
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
