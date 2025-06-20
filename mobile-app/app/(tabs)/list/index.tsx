import { useEffect, useState, useRef, useMemo } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/ThemedText";
import HabitItem from "@/components/HabitItem";
import { ThemedView } from "@/components/ThemedView";
import FrequencyLegend from "@/components/FrequencyLegend";

import { useSyncHabits } from "@/hooks/useSyncHabits";

import { Habit } from "@/types";

import { useCalculateRisk } from "@/utils/calculateRisk";
import { loadLocalHabits } from "@/utils/localHabits";

import { useAuth } from "@/providers/Auth";

import { PADDING_TOP } from "@/constants/styles";

type DeletedHabit = Habit & {
  deleted?: boolean;
  updated?: boolean; // to track if it was updated locally
};

export default function HomeScreen() {
  const [habits, setHabits] = useState<DeletedHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnlineRef = useRef(true);

  const { user } = useAuth();

  const { refresh } = useLocalSearchParams();

  const note = useCalculateRisk();

  const { syncHabits } = useSyncHabits();

  // event that sets network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      isOnlineRef.current = !!state.isConnected;
    });

    return () => unsubscribe();
  }, []);

  // depending on the internet state and refresh param, load habits
  useEffect(() => {
    const loadHabits = async () => {
      setLoading(true);
      try {
        if (!isOnlineRef.current) {
          // If refresh is true or we're offline, load from local storage
          const habits = await loadLocalHabits();
          setHabits(habits);
        } else {
          // If online, fetch from server
          const habits = await syncHabits();
          setHabits(habits || []);
        }
      } catch (error) {
        console.error("Failed to load habits:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, [refresh]);

  const sortedHabits = useMemo(
    () =>
      habits
        .slice()
        .filter((habit) => !habit.deleted)
        .sort(),
    [habits]
  );

  const name = user?.display_name || user?.username;

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.headerContent}>
          <ThemedText type="title">Hello, {name}</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Your Habits
          </ThemedText>
        </View>
        {note && (
          <View style={styles.infoNote}>
            <ThemedText>{note}</ThemedText>
          </View>
        )}
        <FrequencyLegend />
        <FlatList
          style={{ flex: 1 }}
          data={sortedHabits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HabitItem habit={item} />}
          snapToAlignment="start"
          decelerationRate={"normal"}
          ListEmptyComponent={
            loading ? (
              <ThemedView style={styles.placeholder}>
                <MaterialIcons
                  name="hourglass-empty"
                  size={48}
                  color="lightgray"
                />
                <ThemedText type="subtitle" style={styles.placeholderText}>
                  Loading habits...
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.placeholder}>
                <MaterialIcons name="search" size={48} color="lightgray" />
                <ThemedText type="subtitle" style={styles.placeholderText}>
                  No habits found
                </ThemedText>
              </ThemedView>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: PADDING_TOP,
  },
  headerContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  infoNote: {
    padding: 16,
    backgroundColor: "lightblue",
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  subtitle: {
    marginBottom: 16,
  },
  placeholder: {
    flex: 1,
    paddingTop: "50%",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 8,
    color: "lightgray",
    fontSize: 32,
    fontWeight: "700",
  },
});
