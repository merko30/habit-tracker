import { Stack } from "expo-router";

export default function ListStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stats"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
