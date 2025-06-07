import { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { Link, useRouter } from "expo-router";

import Field from "@/components/Field";
import { ThemedText } from "@/components/ThemedText";
import Button from "@/components/Button";
import { loginUser } from "@/api/users";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/providers/Auth";
import Toast from "react-native-toast-message";

const LoginScreen = () => {
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const { setLoggedIn, setUser } = useAuth();

  const router = useRouter();

  const onLogin = async () => {
    try {
      const res = await loginUser(data);

      const { token, user } = res;

      await AsyncStorage.setItem("token", token);
      setUser!(user);

      setLoggedIn!(true);

      router.push("/list");
    } catch (error: any) {
      // axios error
      console.log("Login failed:", error.response.data.error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.error || "An error occurred during login.",
      });
    }
  };

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
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Field
          label="Password"
          value={data.password}
          onChangeText={(text) => setData({ ...data, password: text })}
          placeholder="Enter your password"
          secureTextEntry
        />
        <Button onPress={onLogin}>Sign in</Button>
        <Link href="/register" style={styles.registerLink}>
          Don&apos;t have an account? Sign up
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
  registerLink: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
  },
});

export default LoginScreen;
