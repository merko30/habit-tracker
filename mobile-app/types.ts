// Types for habits and completions from the server API

export interface Habit {
  id: number;
  title: string;
  frequency: string;
  tags: string[];
  created_at: string; // ISO date string
  streak_count: number;
  completed_today?: boolean; // Optional, used for UI indication
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
  tags: string[];
}

export interface UpdateHabit {
  title: string;
  frequency: string;
  streak_count: number;
  tags: string[];
}

export interface CreateCompletion {
  habit_id: number;
  date: string;
  completed: boolean;
}

export interface UpdateCompletion {
  completed: boolean;
}
