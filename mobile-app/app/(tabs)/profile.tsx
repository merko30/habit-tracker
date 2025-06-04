import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

import Field from "@/components/Field";
import SaveHeader from "@/components/SaveHeader";
import { GMT_TIMEZONES } from "@/constants/timezones";
import PickerField from "@/components/PickerField";
import Button from "@/components/Button";
import { useAuth } from "@/providers/Auth";

export default function Profile() {
  const [user, setUser] = useState({
    name: "John Doe",
    age: 30,
    timeZone: "Etc/GMT",
  });

  const { logOut: onLogout } = useAuth();

  const onSave = async () => {
    // save data to AsyncStorage
    await AsyncStorage.setItem("user", JSON.stringify(user));
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
