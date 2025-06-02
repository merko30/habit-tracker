import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { ThemedText } from "./ThemedText";

interface FieldProps extends TextInputProps {
  label: string;
}

const Field = ({ label, ...rest }: FieldProps) => (
  <View style={styles.container}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <TextInput style={styles.input} {...rest} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});

export default Field;
