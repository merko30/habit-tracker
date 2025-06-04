import axios from "./config";

export async function getCompletions() {
  return axios
    .get("/completions")
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to fetch completions:", err);
      throw new Error("Failed to fetch completions");
    });
}

export async function getCompletion(id: number) {
  return axios
    .get(`/completions/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to fetch completion:", err);
      throw new Error("Failed to fetch completion");
    });
}

export async function createCompletion(data: {
  habit_id: number;
  date: string;
  completed: boolean;
}) {
  return axios
    .post("/completions", data)
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to create completion:", err);
      throw new Error("Failed to create completion");
    });
}

export async function updateCompletion(
  id: number,
  data: { completed: boolean }
) {
  return axios
    .put(`/completions/${id}`, data)
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to update completion:", err);
      throw new Error("Failed to update completion");
    });
}

export async function deleteCompletion(id: number) {
  return axios
    .delete(`/completions/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to delete completion:", err);
      throw new Error("Failed to delete completion");
    });
}
