import { Habit } from "@/types";
import API_URL from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getHabits(): Promise<Habit[]> {
  const res = await fetch(`${API_URL}/habits`);
  if (!res.ok) throw new Error("Failed to fetch habits");
  return res.json();
}

export async function getHabit(id: number) {
  const res = await fetch(`${API_URL}/habits/${id}`);
  if (!res.ok) throw new Error("Failed to fetch habit");
  return res.json();
}

export async function createHabit(data: { title: string; frequency: string }) {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_URL}/habits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Include token for authentication
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create habit");
  return res.json();
}

export async function updateHabit(
  id: number,
  data: { title: string; frequency: string; streak_count: number }
) {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_URL}/habits/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Include token for authentication
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update habit");
  return res.json();
}

export async function deleteHabit(id: number) {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_URL}/habits/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`, // Include token for authentication
    },
  });
  console.log("Deleting habit with ID:", id, "Response:", res);

  if (!res.ok) throw new Error("Failed to delete habit");
  return res.json();
}
