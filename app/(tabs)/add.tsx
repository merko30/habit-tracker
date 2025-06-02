import { SafeAreaView, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";

export default function AddScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title">Add your habit</ThemedText>
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
