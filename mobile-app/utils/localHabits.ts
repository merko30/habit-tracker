import AsyncStorage from "@react-native-async-storage/async-storage";
import { HABITS_STORAGE_KEY } from "@/constants";
import { Habit as BaseHabit } from "@/types";

interface Habit extends BaseHabit {
  deleted?: boolean;
  updated?: boolean;
}

export async function loadLocalHabits(): Promise<Habit[]> {
  const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveLocalHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
}
