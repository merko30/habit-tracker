import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";

export default function HomeScreen() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    // load from AsyncStorage
    const loadHabits = async () => {
      try {
        const storedHabits = await SecureStore.getItemAsync("habits");
        if (storedHabits) {
          setHabits(JSON.parse(storedHabits));
        }
      } catch (error) {
        console.error("Failed to load habits from storage", error);
      }
    };
    loadHabits();
  }, []);

  console.log("Loaded habits:", habits);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title">Hello, John Doe!</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
