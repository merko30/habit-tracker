import AsyncStorage from "@react-native-async-storage/async-storage";
import { HABITS_STORAGE_KEY } from "@/constants";
import { createCompletion } from "@/api/completions";
import { Habit } from "@/types";

const COMPLETIONS_STORAGE_KEY = "pendingCompletions";

export type PendingCompletion = {
  habit_id: number;
  date: string;
  completed: boolean;
  frequency: string;
};

export async function loadPendingCompletions(): Promise<PendingCompletion[]> {
  const stored = await AsyncStorage.getItem(COMPLETIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function savePendingCompletions(
  completions: PendingCompletion[]
): Promise<void> {
  await AsyncStorage.setItem(
    COMPLETIONS_STORAGE_KEY,
    JSON.stringify(completions)
  );
}

export async function addPendingCompletion(
  completion: PendingCompletion
): Promise<void> {
  const completions = await loadPendingCompletions();
  completions.push(completion);
  await savePendingCompletions(completions);
}

export async function removePendingCompletion(
  predicate: (c: PendingCompletion) => boolean
): Promise<void> {
  const completions = await loadPendingCompletions();
  const filtered = completions.filter((c) => !predicate(c));
  await savePendingCompletions(filtered);
}

export async function syncPendingCompletions() {
  const pending = await loadPendingCompletions();
  if (!Array.isArray(pending) || pending.length === 0) return;
  // Load all habits from storage to look up frequency if missing
  const habitsRaw = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
  const habits: Habit[] = habitsRaw ? JSON.parse(habitsRaw) : [];
  const successful: PendingCompletion[] = [];
  for (const completion of pending) {
    let freq = completion.frequency;
    if (!freq) {
      const habit = habits.find((h) => h.id === completion.habit_id);
      freq = habit?.frequency || "daily";
    }
    try {
      await createCompletion({ ...completion, frequency: freq });
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
  await savePendingCompletions(remaining);
}
