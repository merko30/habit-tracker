import { Dimensions } from "react-native";
import { withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { createCompletion } from "@/api/completions";

const { width: wWidth } = Dimensions.get("window");

export const ICONS_WIDTH = 60;
export const SNAP_POINTS = [-wWidth, -ICONS_WIDTH, 0];

export const getPosition = (value: number) => {
  "worklet";
  return withTiming(value, { duration: 300 });
};

export const INITIAL_POSITION = 0;
export const HEIGHT = 70;

export const PENDING_COMPLETIONS_KEY = "pendingCompletions";

export type PendingCompletion = {
  habit_id: number;
  date: string;
  completed: boolean;
  frequency: string;
};

export const savePendingCompletion = async (completion: PendingCompletion) => {
  const existing = await AsyncStorage.getItem(PENDING_COMPLETIONS_KEY);
  const pending: PendingCompletion[] = existing ? JSON.parse(existing) : [];
  pending.push(completion);
  await AsyncStorage.setItem(PENDING_COMPLETIONS_KEY, JSON.stringify(pending));
};

export const syncPendingCompletions = async () => {
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

export const frequencyColors: Record<string, string> = {
  daily: "#4CAF50", // Green
  weekly: "#2196F3", // Blue
  monthly: "#FF9800", // Orange
};
