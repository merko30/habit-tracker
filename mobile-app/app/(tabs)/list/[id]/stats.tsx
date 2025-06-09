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

const screenWidth = Dimensions.get("window").width;

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
  frequency,
}: {
  dates: (string | { date: string; isCurrentMonth?: boolean })[];
  completions: HabitCompletion[];
  style?: object;
  frequency: string;
}) {
  const padding = 16 * 2; // match scrollContainer padding
  const gap = 8;
  const itemCount = 7;
  const itemSize = (screenWidth - padding - gap * (itemCount - 1)) / itemCount;
  // Split dates into rows of 7
  const rows = [];
  for (let i = 0; i < dates.length; i += 7) {
    rows.push(dates.slice(i, i + 7));
  }

  // Helper: get week string for a row (assume all dates in row are in the same week)
  function getWeekStr(row: (string | { date: string })[]) {
    const firstDate = typeof row[0] === "string" ? row[0] : row[0].date;
    const d = new Date(firstDate);
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const weekNumber = Math.ceil(
      ((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  }

  // Helper: check if the month is completed for monthly habits
  function isMonthCompleted() {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    return completions.some((c) => c.date === monthStr && c.completed);
  }

  return (
    <View style={[styles.previewContainer, style]}>
      {rows.map((row, rowIdx) => {
        let highlightRow = false;

        if (frequency === "weekly") {
          const weekStr = getWeekStr(row);
          highlightRow = completions.some(
            (c) => c.date === weekStr && c.completed
          );
        } else if (frequency === "monthly") {
          highlightRow = isMonthCompleted();
        }

        return (
          <View
            key={rowIdx}
            style={{
              // marginBottom: 8,
              position: "relative",
              // ...highlightStyles,
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -5,
                left: -7,
                height: itemSize + 10,
                width: screenWidth - padding / 2,
                borderWidth: 1,
                borderRadius: 16,
                borderColor: highlightRow ? Colors.light.tint : "transparent",
              }}
            />
            {highlightRow && rowIdx === 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -10,
                  right: -12,
                  zIndex: 2,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <MaterialIcons
                  name="check"
                  size={20}
                  color={Colors.light.tint}
                />
              </View>
            )}
            <View style={[styles.previewRow, { gap }]}>
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
                const showPerDayCheck = frequency === "daily" || !highlightRow;
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
                    {checked && isCurrentMonth && showPerDayCheck && (
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
          </View>
        );
      })}
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
    habit?: any;
    week: HabitCompletion[];
    month: HabitCompletion[];
  }>({
    week: [],
    month: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getWeeklyAndMonthlyStats(id as string);
        setData(data);
      } catch {
        // Optionally handle error
      }
    };
    fetchData();
  }, [id]);

  const weekDates = getCurrentWeekDates();
  const monthDates = getCurrentMonthDates();
  const frequency = data.habit?.frequency || "daily";

  // Always wrap the current week in the monthly preview, regardless of frequency
  // Find the row in the monthDates that matches the current week
  const weekDateSet = new Set(weekDates);
  const monthRows = [];
  for (let i = 0; i < monthDates.length; i += 7) {
    const row = monthDates.slice(i, i + 7);
    // If this row matches the current week, use week completions instead of month completions
    const isCurrentWeekRow = row.every((d) =>
      weekDateSet.has(typeof d === "string" ? d : d.date)
    );
    monthRows.push({ row, isCurrentWeekRow });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
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
            frequency={frequency}
          />
          <Text style={styles.title}>Monthly Preview</Text>
          <PeriodInfo isMonth />
          <View style={styles.previewContainer}>
            {monthRows.map(({ row, isCurrentWeekRow }, idx) => (
              <PreviewRow
                key={idx}
                dates={row}
                completions={isCurrentWeekRow ? data.week : data.month}
                frequency={frequency}
              />
            ))}
          </View>
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
