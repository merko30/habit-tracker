import { Habit } from "@/types";

export const TAGS = [
  "Health",
  "Fitness",
  "Productivity",
  "Mental Health",
  "Learning",
  "Personal Growth",
  "Social",
  "Financial",
  "Creative",
];

export const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export type HabitFormValues = Omit<Habit, "created_at" | "streak_count" | "id">;

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, "");

export const initialValues: HabitFormValues = {
  title: "",
  frequency: "daily",
  tags: [],
};
