import { Habit } from "@/types";

export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }
  return [];
}

export function withParsedTags(habit: Partial<Habit>): Partial<Habit> {
  return {
    ...habit,
    tags: parseTags(habit.tags),
  };
}
