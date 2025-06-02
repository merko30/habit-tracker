import API_URL from "./config";

export async function getCompletions() {
  const res = await fetch(`${API_URL}/completions`);
  if (!res.ok) throw new Error("Failed to fetch completions");
  return res.json();
}

export async function getCompletion(id: number) {
  const res = await fetch(`${API_URL}/completions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch completion");
  return res.json();
}

export async function createCompletion(data: {
  habit_id: number;
  date: string;
  completed: boolean;
}) {
  const res = await fetch(`${API_URL}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create completion");
  return res.json();
}

export async function updateCompletion(
  id: number,
  data: { completed: boolean }
) {
  const res = await fetch(`${API_URL}/completions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update completion");
  return res.json();
}

export async function deleteCompletion(id: number) {
  const res = await fetch(`${API_URL}/completions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete completion");
  return res.json();
}
