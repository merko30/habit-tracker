import { View, StyleSheet, Pressable, useColorScheme } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Colors } from "@/constants/Colors";

import { ThemedText } from "./ThemedText";

interface SaveHeaderProps {
  onSave: () => void;
  title: string;
  description: string;
}

const SaveHeader = ({ title, description, onSave }: SaveHeaderProps) => {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText type="default" style={styles.description}>
          {description}
        </ThemedText>
      </View>
      <Pressable
        onPress={onSave}
        style={[
          styles.button,
          { backgroundColor: Colors[colorScheme ?? "light"].tint },
        ]}
      >
        <MaterialIcons name="check" size={24} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },

  description: {
    marginBottom: 16,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },

  button: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 9999,
  },
});

export default SaveHeader;
