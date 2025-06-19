import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
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

import {
  getCurrentWeekDates,
  getCurrentMonthDates,
  DAY_NAMES,
  getISOWeekStr,
} from "@/utils/date";
import { PADDING_TOP } from "@/constants/styles";

const screenWidth = Dimensions.get("window").width;

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

  return (
    <View style={[styles.previewContainer, style]}>
      {rows.map((row, rowIdx) => {
        let highlightRow = false;

        if (frequency === "weekly") {
          const weekStr = getISOWeekStr(row);
          highlightRow = completions.some(
            (c) => c.date === weekStr && c.completed
          );
        } else if (frequency === "monthly") {
          highlightRow = false;
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
        console.log(data);
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

  const highlightMonth = frequency === "monthly" && data.month.length > 0;

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
          <View
            style={[
              styles.previewContainer,
              {
                position: "relative",
              },
            ]}
          >
            <View
              style={{
                position: "absolute",
                top: 0,
                left: -6,
                height: "100%",
                width: screenWidth - 20,
                borderWidth: 1,
                borderRadius: 16,
                borderColor: highlightMonth ? Colors.light.tint : "transparent",
              }}
            />
            {highlightMonth && (
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
    paddingTop: PADDING_TOP,
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
