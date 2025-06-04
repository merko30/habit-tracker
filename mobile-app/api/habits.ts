import { Habit } from "@/types";

import axios from "./config";

export async function getHabits(): Promise<Habit[]> {
  return await axios.get("/habits").then((response) => response.data);
}

export async function createHabit(data: Partial<Habit>): Promise<Habit> {
  return await axios.post("/habits", data).then((response) => response.data);
}

export async function updateHabit(id: number, data: Partial<Habit>) {
  return await axios
    .put(`/habits/${id}`, data)
    .then((response) => response.data);
}

export async function deleteHabit(id: number) {
  return await axios.delete(`/habits/${id}`).then((response) => response.data);
}
