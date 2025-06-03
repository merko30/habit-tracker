import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";

import Field from "@/components/Field";
import SaveHeader from "@/components/SaveHeader";
import { GMT_TIMEZONES } from "@/constants/timezones";
import PickerField from "@/components/PickerField";

export default function Profile() {
  const [user, setUser] = useState({
    name: "John Doe",
    age: 30,
    timeZone: "Etc/GMT",
  });
  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <SaveHeader
          title="Profile"
          description="Edit your profile details"
          onSave={() => {
            // Handle save logic here
            console.log("User saved:", user);
          }}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  description: {
    marginBottom: 16,
    color: "#666",
  },
});
