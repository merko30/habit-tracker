import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";
import AuthProvider from "@/providers/Auth";
import Navigation from "@/navigation";
import { HabitsProvider } from "@/providers/Habits";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <HabitsProvider>
            <Navigation />
          </HabitsProvider>
        </AuthProvider>
        <StatusBar style="auto" />
        <Toast position="bottom" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
