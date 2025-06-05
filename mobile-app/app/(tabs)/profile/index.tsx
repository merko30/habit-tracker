import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Link } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/providers/Auth";
import Button from "@/components/Button";

const LIST_ITEMS = [
  { title: "Stats", route: "profile/stats" },
  { title: "Settings", route: "profile/settings" },
];

const ProfileScreen = () => {
  const { user, logOut } = useAuth();

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.infoContainer}>
          <ThemedText type="title" style={styles.title}>
            {user?.display_name || user?.username}
          </ThemedText>
          <ThemedText type="defaultSemiBold">{user?.email}</ThemedText>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Age: </ThemedText>
            <ThemedText type="defaultSemiBold">{user?.age}</ThemedText>
          </View>
        </View>
        {LIST_ITEMS.map((item) => (
          <Link href={item.route} key={item.route} style={styles.listItem}>
            <ThemedText>{item.title}</ThemedText>
          </Link>
        ))}
        <View style={styles.wrapper}>
          <Button onPress={logOut}>Log out</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  infoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 16,
  },
  title: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ededed",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrapper: {
    marginHorizontal: 8,
    marginTop: 16,
  },
});

export default ProfileScreen;
