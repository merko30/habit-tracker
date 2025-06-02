import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_URL;

export default API_URL;
