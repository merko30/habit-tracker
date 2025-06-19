import { Platform, StatusBar } from "react-native";

export const PADDING_TOP =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;
