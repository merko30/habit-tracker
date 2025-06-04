import { Habit } from "@/types";

import axios from "./config";

export async function getHabits(): Promise<Habit[]> {
  return await axios.get("/habits").then((response) => response.data);
}

export async function createHabit(data: { title: string; frequency: string }) {
  return await axios.post("/habits", data).then((response) => response.data);
}

export async function updateHabit(
  id: number,
  data: { title: string; frequency: string; streak_count: number }
) {
  return await axios
    .put(`/habits/${id}`, data)
    .then((response) => response.data);
}

export async function deleteHabit(id: number) {
  return await axios.delete(`/habits/${id}`).then((response) => response.data);
}
