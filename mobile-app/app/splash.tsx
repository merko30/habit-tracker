import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme, View } from "react-native";

const Splash = () => {
  const colorScheme = useColorScheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThemedText
        style={{
          fontSize: 48,
          lineHeight: 48,
          textTransform: "uppercase",
          fontWeight: "bold",
          color: Colors[colorScheme ?? "light"].tint,
        }}
      >
        Habit
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 48,
          lineHeight: 48,
          textTransform: "uppercase",
          fontWeight: "bold",
          color: Colors[colorScheme ?? "light"].tint,
        }}
      >
        Tracker
      </ThemedText>
    </View>
  );
};

export default Splash;
