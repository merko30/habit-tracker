import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ThemedText } from "@/components/ThemedText";
import { getWeeklyAndMonthlyStats } from "@/api/completions";
import { HabitCompletion } from "@/types";
import { Colors } from "@/constants/Colors";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 (Mon) - 6 (Sun)
  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOfWeek + i);
    const year = d.getFullYear();
    const month = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    week.push(`${year}-${month}-${day}`);
  }
  return week;
}

function getCurrentMonthDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = getDaysInMonth(year, month);
  const dates: { date: string; isCurrentMonth: boolean }[] = [];

  // Find the weekday of the 1st of the month (0=Mon, 6=Sun)
  const firstDay = new Date(year, month, 1);
  let firstWeekday = (firstDay.getDay() + 6) % 7; // 0=Mon

  // Add days from previous month if needed
  if (firstWeekday > 0) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    for (let i = prevMonthDays - firstWeekday + 1; i <= prevMonthDays; i++) {
      const m = pad2(prevMonth + 1);
      const d = pad2(i);
      dates.push({ date: `${prevYear}-${m}-${d}`, isCurrentMonth: false });
    }
  }

  // Add current month days
  for (let i = 1; i <= days; i++) {
    const m = pad2(month + 1);
    const d = pad2(i);
    dates.push({ date: `${year}-${m}-${d}`, isCurrentMonth: true });
  }

  return dates;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function PreviewRow({
  dates,
  completions,
  style,
}: {
  dates: (string | { date: string; isCurrentMonth?: boolean })[];
  completions: HabitCompletion[];
  style?: object;
}) {
  const screenWidth = Dimensions.get("window").width;
  const padding = 16 * 2; // match scrollContainer padding
  const gap = 8;
  const itemCount = 7;
  const itemSize = (screenWidth - padding - gap * (itemCount - 1)) / itemCount;
  // Split dates into rows of 7
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) {
    rows.push(dates.slice(i, i + 7));
  }
  return (
    <View style={[styles.previewContainer, style]}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.previewRow, { gap }]}>
          {row.map((dateObj, idx) => {
            let date: string;
            let isCurrentMonth = true;
            if (typeof dateObj === "string") {
              date = dateObj;
            } else {
              date = dateObj.date;
              isCurrentMonth = dateObj.isCurrentMonth !== false;
            }
            const checked = completions.some(
              (c) => c.date === date && c.completed
            );
            return (
              <View
                key={idx}
                style={[
                  styles.previewCircle,
                  {
                    width: itemSize,
                    height: itemSize,
                    borderRadius: itemSize / 2,
                    backgroundColor: isCurrentMonth
                      ? Colors.light.tint
                      : "#ccc",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: isCurrentMonth ? "#fff" : "#888",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {date.split("-")[2]}
                </ThemedText>
                {checked && isCurrentMonth && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      position: "absolute",
                      bottom: -5,
                      right: -5,
                      backgroundColor: "#fff",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons
                      name="check"
                      size={16}
                      color={Colors.light.tint}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const PeriodInfo = ({ isMonth }: { isMonth: boolean }) => (
  <View>
    <ThemedText>
      {isMonth
        ? new Date().toLocaleString("default", { month: "long" })
        : "This Week"}
    </ThemedText>
    <View style={styles.datesRow}>
      {DAY_NAMES.map((name, idx) => (
        <ThemedText key={idx} style={styles.dateLabel}>
          {name}
        </ThemedText>
      ))}
    </View>
  </View>
);

export default function HabitStatsScreen() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<{
    week: HabitCompletion[];
    month: HabitCompletion[];
  }>({
    week: [],
    month: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWeeklyAndMonthlyStats(id as string);
        setData(data);
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        setError("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const weekDates = getCurrentWeekDates();
  const monthDates = getCurrentMonthDates();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <ThemedText type="title" style={{ marginBottom: 32 }}>
          Statistics
        </ThemedText>
        <View>
          <Text style={styles.title}>Weekly Preview</Text>
          <PeriodInfo isMonth={false} />
          <PreviewRow
            dates={weekDates}
            completions={data.week}
            style={{ marginBottom: 32 }}
          />
          <Text style={styles.title}>Monthly Preview</Text>
          <PeriodInfo isMonth />
          <PreviewRow dates={monthDates} completions={data.month} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  previewContainer: {
    width: "100%",
    gap: 8,
    marginVertical: 8,
  },
  previewRow: {
    flexDirection: "row",
  },
  previewCircle: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNamesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateLabel: {
    flex: 1,
    textAlign: "center",
    fontWeight: "500",
    color: "#666",
  },
});
