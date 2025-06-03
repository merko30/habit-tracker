const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  age?: number;
  timezone?: string;
  display_name?: string;
}) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  console.log("Registering user with data:", res);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Registration failed");
  }
  return res.json();
}

export async function loginUser(data: {
  email?: string;
  username?: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  return res.json();
}
