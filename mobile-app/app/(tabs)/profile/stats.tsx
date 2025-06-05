import { ThemedText } from "@/components/ThemedText";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";

const ProfileScreen = () => (
  <SafeAreaView>
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText>stats</ThemedText>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  description: {
    marginBottom: 16,
    color: "#666",
  },
});

export default ProfileScreen;
