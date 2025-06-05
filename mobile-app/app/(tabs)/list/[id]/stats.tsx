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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/ThemedText";

const mockWeekly = [true, false, true, true, false, true, true];
const mockMonthly = [
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
];

function PreviewRow({ data, style }: { data: boolean[]; style?: object }) {
  const screenWidth = Dimensions.get("window").width;
  const padding = 16 * 2; // match scrollContainer padding
  const gap = 8;
  const itemCount = 7;
  const itemSize = (screenWidth - padding - gap * (itemCount - 1)) / itemCount;
  // Split data into rows of 7
  const rows = [];
  for (let i = 0; i < data.length; i += 7) {
    rows.push(data.slice(i, i + 7));
  }
  return (
    <View style={[styles.previewContainer, style]}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.previewRow, { gap }]}>
          {row.map((checked, idx) => (
            <View
              key={idx}
              style={[
                styles.previewCircle,
                {
                  width: itemSize,
                  height: itemSize,
                  borderRadius: itemSize / 2,
                  backgroundColor: checked ? "#4caf50" : "#eee",
                },
              ]}
            >
              {checked ? (
                <MaterialIcons name="check" size={24} color="#fff" />
              ) : (
                <MaterialIcons
                  name="radio-button-unchecked"
                  size={itemSize + 3}
                  color="#bbb"
                />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HabitStatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <ThemedText type="title" style={{ marginBottom: 32 }}>
          Statistics
        </ThemedText>
        <View>
          <Text style={styles.title}>Weekly Preview</Text>
          <PreviewRow data={mockWeekly} style={{ marginBottom: 32 }} />
          <Text style={styles.title}>Monthly Preview</Text>
          <PreviewRow data={mockMonthly} />
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
    alignItems: "center",
    justifyContent: "center",
  },
});
