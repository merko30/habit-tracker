import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "./config";

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  age?: number;
  timezone?: string;
  display_name?: string;
}) {
  return axios.post("/register", data).then((response) => response.data);
}

export async function loginUser(data: {
  email?: string;
  username?: string;
  password: string;
}) {
  return axios
    .post("/login", data)
    .then((response) => response.data)
    .catch((error) => {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.error || "An error occurred during login."
      );
    });
}

export async function getUserProfile() {
  return axios.get("/profile").then((response) => response.data);
}

export async function updateUserProfile(data: {
  name?: string;
  age?: number;
  timeZone?: string;
}) {
  return axios.put("/profile", data).then((response) => response.data);
}
