// Type interfaces for DB rows
export interface Habit {
  id: number;
  title: string;
  frequency: string;
  tags: string; // JSON stringified array
  created_at: string;
  completed_today?: boolean; // Optional, used for UI indication
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  date: string; // ISO date string yyyy-mm-dd
  completed: boolean;
}

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  age: number;
  timezone: string;
  display_name: string;
  created_at: string;
};
