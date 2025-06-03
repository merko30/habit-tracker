import { StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { ThemedText } from "./ThemedText";

interface PickerFieldProps {
  options: { value: string; label: string }[];
  value: string;
  label: string;
  onChange: (value: string) => void;
  valueKey?: string;
  labelKey?: string;
  getLabel?: (option: { value: string; label: string } | any) => string;
}

const PickerField = ({
  options,
  value,
  onChange,
  label,
  valueKey = "value",
  labelKey = "label",
  getLabel,
}: PickerFieldProps) => (
  <View>
    <ThemedText type="defaultSemiBold">{label}</ThemedText>
    <Picker
      selectedValue={value}
      onValueChange={onChange}
      style={styles.picker}
    >
      {options.map((option) => (
        <Picker.Item
          key={option[valueKey as keyof typeof option]}
          label={
            getLabel
              ? getLabel(option)
              : option[labelKey as keyof typeof option]
          }
          value={option[valueKey as keyof typeof option] as string}
        />
      ))}
    </Picker>
  </View>
);

const styles = StyleSheet.create({
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
  },
});

export default PickerField;
