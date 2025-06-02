import { useState } from "react";
import { useColorScheme, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Colors } from "@/constants/Colors";
import { Habit } from "@/types";
import { createCompletion } from "@/api/completions";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import Toast from "react-native-toast-message";

const HabitItem = ({ habit: _habit }: { habit: Habit }) => {
  const [habit, setHabit] = useState<Habit>(_habit);
  const colorScheme = useColorScheme();

  const onComplete = async () => {
    // console.log("Toggling completion for habit:", habit.id);
    try {
      setHabit((old) => ({
        ...old,
        completed_today: !old.completed_today,
        streak_count: old.completed_today
          ? old.streak_count - 1
          : old.streak_count + 1,
      }));
      await createCompletion({
        habit_id: habit.id,
        date: new Date().toISOString().split("T")[0], // yyyy-mm-dd format
        completed: !habit.completed_today,
      });
    } catch (error) {
      setHabit((old) => ({
        ...old,
        completed_today: !old.completed_today, // Revert the completion state
        streak_count: old.completed_today
          ? old.streak_count + 1
          : old.streak_count - 1, // Adjust streak count accordingly
      })); // Revert state on error
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update habit completion. Please try again.",
      });
    }
  };

  return (
    <ThemedView style={styles.item}>
      <ThemedView style={styles.titleContainer}>
        <MaterialIcons
          size={32}
          name={
            habit.completed_today ? "check-circle" : "radio-button-unchecked"
          }
          onPress={onComplete}
          color={
            Colors[colorScheme ?? "light"][
              habit.completed_today ? "tint" : "text"
            ]
          }
        />
        <ThemedText style={styles.itemTitle}>{habit.title}</ThemedText>
      </ThemedView>
      <ThemedView
        style={[
          styles.count,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
      >
        <ThemedText style={styles.streakCount}>{habit.streak_count}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginBottom: 4,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTitle: {
    fontWeight: "500",
  },
  count: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  streakCount: {
    color: "white",
  },
});

export default HabitItem;
