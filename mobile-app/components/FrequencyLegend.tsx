import { View } from "react-native";
import { ThemedText } from "./ThemedText";

import { frequencyColors } from "./HabitItem/utils";

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const Legend = () => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 16,
      marginLeft: 8,
    }}
  >
    {Object.entries(frequencyColors).map(([freq, color]) => (
      <View
        key={freq}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: color,
            marginRight: 4,
            borderLeftWidth: 4,
            borderLeftColor: color,
          }}
        />
        <ThemedText>{frequencyLabels[freq]}</ThemedText>
      </View>
    ))}
  </View>
);

export default Legend;
