import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HABITS_STORAGE_KEY } from "@/constants";
import { Habit as BaseHabit } from "@/types";

export interface Habit extends BaseHabit {
  deleted?: boolean;
  updated?: boolean;
}

interface HabitsContextType {
  habits: Habit[];
  loading: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: number | string) => Promise<void>;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      setHabits(stored ? JSON.parse(stored) : []);
    } catch {
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addHabit = useCallback(
    async (habit: Habit) => {
      const newHabits = [...habits, habit];
      setHabits(newHabits);
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(newHabits));
    },
    [habits]
  );

  const updateHabit = useCallback(
    async (updated: Habit) => {
      const newHabits = habits.map((h) =>
        h.id === updated.id ? { ...h, ...updated, updated: true } : h
      );
      setHabits(newHabits);
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(newHabits));
    },
    [habits]
  );

  const deleteHabit = useCallback(
    async (id: number | string) => {
      const newHabits = habits.map((h) =>
        h.id === id ? { ...h, deleted: true } : h
      );
      setHabits(newHabits);
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(newHabits));
    },
    [habits]
  );

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  return (
    <HabitsContext.Provider
      value={{
        habits,
        loading,
        loadHabits,
        addHabit,
        updateHabit,
        deleteHabit,
        setHabits,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context)
    throw new Error("useHabits must be used within a HabitsProvider");
  return context;
}
