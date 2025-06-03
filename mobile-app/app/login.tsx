import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import Field from "@/components/Field";
import { ThemedText } from "@/components/ThemedText";

const LoginScreen = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Sign in
        </ThemedText>
        <ThemedText style={styles.description}>
          Welcome back! Please enter your details.
        </ThemedText>
        <Field
          label="Email"
          value={data.email}
          onChangeText={(text) => setData({ ...data, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={data.password}
          onChangeText={(text) => setData({ ...data, password: text })}
          placeholder="Enter your password"
          secureTextEntry
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: "#666",
  },
});

export default LoginScreen;
