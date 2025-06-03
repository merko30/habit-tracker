import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";

import Field from "@/components/Field";
import { ThemedText } from "@/components/ThemedText";
import Button from "@/components/Button";
import { registerUser } from "@/api/users";
import Toast from "react-native-toast-message";

const RegisterScreen = () => {
  const [data, setData] = useState({
    username: "merimhas",
    email: "merim.hasanbegovic@outlook.com",
    password: "password123",
  });

  const router = useRouter();

  const onRegister = async () => {
    try {
      await registerUser(data);

      router.push("/login");
    } catch (error: any) {
      console.log("Registration failed:", error.message);
      Toast.show({
        type: "error",
        text1: error.message || "An error occurred during registration.",
      });
      // Handle registration error (e.g., show a message to the user)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Sign up
        </ThemedText>
        <ThemedText style={styles.description}>
          Create a new account to get started.
        </ThemedText>
        <Field
          label="Username"
          value={data.username}
          onChangeText={(text) => setData({ ...data, username: text })}
          placeholder="Enter your username"
          autoCapitalize="none"
        />
        <Field
          label="Email"
          value={data.email}
          onChangeText={(text) => setData({ ...data, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={data.password}
          onChangeText={(text) => setData({ ...data, password: text })}
          placeholder="Enter your password"
          secureTextEntry
        />
        <Button onPress={onRegister}>Sign in</Button>
        <Link href="/login" style={styles.loginLink}>
          Already have an account? Sign in
        </Link>
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
  loginLink: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
  },
});

export default RegisterScreen;
