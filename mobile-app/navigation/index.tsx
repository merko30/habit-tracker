import { Stack } from "expo-router";

import { useAuth } from "@/providers/Auth";
import Splash from "@/app/splash";

const Navigation = () => {
  const { loggedIn: isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return (
    <Stack>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default Navigation;
