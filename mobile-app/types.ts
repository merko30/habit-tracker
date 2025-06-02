// Types for habits and completions from the server API

export interface Habit {
  id: number;
  title: string;
  frequency: string;
  created_at: string; // ISO date string
  streak_count: number;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string; // yyyy-mm-dd
  completed: boolean;
}

export interface CreateHabit {
  title: string;
  frequency: string;
}

export interface UpdateHabit {
  title: string;
  frequency: string;
  streak_count: number;
}

export interface CreateCompletion {
  habit_id: number;
  date: string;
  completed: boolean;
}

export interface UpdateCompletion {
  completed: boolean;
}
