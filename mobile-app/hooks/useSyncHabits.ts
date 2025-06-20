import { useCallback, useRef } from "react";
import { getHabits } from "@/api/habits";
import { createHabit, updateHabit, deleteHabit } from "@/api/habits";
import { Habit as BaseHabit } from "@/types";
import { HABITS_STORAGE_KEY } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncPendingCompletions } from "@/utils/localCompletions";
import { withParsedTags } from "@/utils/tags";

export interface Habit extends BaseHabit {
  deleted?: boolean;
  updated?: boolean;
}

export function useSyncHabits() {
  const syncingRef = useRef(false);

  const syncHabits = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await syncPendingCompletions();
      const habitsFromStorageRaw = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      let localHabits: Habit[] = habitsFromStorageRaw ? JSON.parse(habitsFromStorageRaw) : [];

      // DELETE habits marked as deleted
      const habitsToDelete = localHabits.filter((h) => h.deleted);
      for (const habit of habitsToDelete) {
        if (habit.deleted) {
          try {
            await deleteHabit(habit.id);
            localHabits = localHabits.filter((h) => h.id !== habit.id);
          } catch (err) {
            console.warn(`Failed to delete habit: ${habit.title}`, err);
          }
        }
      }

      // UPDATE habits marked as updated
      const habitsToUpdate = localHabits.filter((h) => h.updated && !h.deleted);
      for (const habit of habitsToUpdate) {
        try {
          const updatedHabit = await updateHabit(habit.id, {
            title: habit.title,
            frequency: habit.frequency,
            tags: withParsedTags(habit).tags,
          });
          localHabits = localHabits.map((h) =>
            h.id === updatedHabit.id ? updatedHabit : h
          );
        } catch (err) {
          console.warn(`Failed to update habit: ${habit.title}`, err);
        }
      }

      // CREATE offline habits
      const cleanedLocalHabits: Habit[] = [];
      for (const localHabit of localHabits) {
        const isOfflineId = localHabit.id.toString().includes("offline-");
        if (isOfflineId) {
          try {
            const { id, ...data } = localHabit;
            const habitData = {
              ...data,
              tags: withParsedTags(data).tags,
            };
            const created = await createHabit(habitData);
            cleanedLocalHabits.push(created);
          } catch (err) {
            console.warn(`Failed to create habit: ${localHabit.title}`, err);
          }
        } else {
          cleanedLocalHabits.push({
            ...localHabit,
            tags: withParsedTags(localHabit).tags || [],
          });
        }
      }

      // Save cleaned habits
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(cleanedLocalHabits)
      );

      // Fetch fresh server data
      const latestFromServer = await getHabits();
      await AsyncStorage.setItem(
        HABITS_STORAGE_KEY,
        JSON.stringify(latestFromServer)
      );
      return latestFromServer;
    } catch (e) {
      console.log("error syncing habits", e);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  return { syncHabits };
}
