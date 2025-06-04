import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import Field from "@/components/Field";
import SaveHeader from "@/components/SaveHeader";
import { GMT_TIMEZONES } from "@/constants/timezones";
import PickerField from "@/components/PickerField";
import Button from "@/components/Button";
import { useAuth } from "@/providers/Auth";
import { updateUserProfile } from "@/api/users";
import Toast from "react-native-toast-message";

export default function Profile() {
  const [user, setUser] = useState({
    name: "John Doe",
    age: 30,
    timeZone: "Etc/GMT",
  });

  const { logOut: onLogout, user: loggedInUser } = useAuth();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");

        if (userData) {
          setUser(
            JSON.parse(userData) || {
              name: loggedInUser?.display_name || "John Doe",
              age: loggedInUser?.age || 30,
              timeZone: loggedInUser?.timezone || "Etc/GMT",
            }
          );
        }
      } catch (error) {
        console.error("Failed to load user data from storage:", error);
      }
    };
    loadUserData();
  }, [loggedInUser]);

  const onSave = async () => {
    // save data to AsyncStorage
    try {
      await updateUserProfile({
        name: user.name,
        age: user.age,
        timeZone: user.timeZone,
      });
      await AsyncStorage.setItem("user", JSON.stringify(user));
      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Your profile details have been saved successfully.",
      });
    } catch (error) {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      Toast.show({
        type: "info",
        text1: "Profile update failed",
        text2: "Information saved locally. Please try again later.",
      });
    }
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <SaveHeader
          title="Profile"
          description="Edit your profile details"
          onSave={onSave}
        />
        <Field
          label="Name"
          value={user.name}
          onChangeText={(text) => setUser({ ...user, name: text })}
        />

        <PickerField
          label="Age"
          // from 16 yld
          options={Array.from({ length: 100 }, (_, i) => ({
            value: (i + 16).toString(),
            label: (i + 16).toString(),
          }))}
          value={user.age.toString()}
          onChange={(value) => setUser({ ...user, age: parseInt(value, 10) })}
        />

        <PickerField
          label="Time Zone"
          options={GMT_TIMEZONES}
          value={user.timeZone}
          onChange={(value) => setUser({ ...user, timeZone: value })}
        />
        <Button onPress={onLogout}>Sign out</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

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
