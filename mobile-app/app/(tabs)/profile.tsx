import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

import Field from "@/components/Field";
import SaveHeader from "@/components/SaveHeader";
import { GMT_TIMEZONES } from "@/constants/timezones";
import PickerField from "@/components/PickerField";
import Button from "@/components/Button";
import { useAuth } from "@/providers/Auth";
import { updateUserProfile } from "@/api/users";
import Toast from "react-native-toast-message";
import { PADDING_TOP } from "@/constants/styles";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    age: 0,
    timeZone: "",
  });

  const {
    logOut: onLogout,
    user: loggedInUser,
    setUser: setLoggedInUser,
  } = useAuth();

  useEffect(() => {
    if (!loggedInUser) {
      return;
    }
    setUser({
      name: loggedInUser?.display_name ?? "",
      age: loggedInUser?.age ?? 0,
      timeZone: loggedInUser?.timezone ?? "Etc/GMT",
    });
  }, [loggedInUser]);

  const onSave = async () => {
    try {
      await updateUserProfile({
        name: user.name,
        age: user.age,
        timeZone: user.timeZone,
      });
      // Update the logged-in user state
      setLoggedInUser!({
        id: loggedInUser?.id ?? "",
        name: user.name, // always set name
        email: loggedInUser?.email ?? "",
        username: loggedInUser?.username ?? "",
        display_name: user.name,
        age: user.age,
        timezone: user.timeZone,
      });
      Toast.show({
        type: "success",
        text1: "Profile updated",
        text2: "Your profile details have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      Toast.show({
        type: "error",
        text1: "Error updating profile",
        text2: "There was an error saving your profile details.",
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
    paddingTop: PADDING_TOP,
  },
  description: {
    marginBottom: 16,
    color: "#666",
  },
});
