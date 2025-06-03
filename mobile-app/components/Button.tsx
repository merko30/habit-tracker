import { Colors } from "@/constants/Colors";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  ViewStyle,
} from "react-native";

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<any>;
}

const Button = ({
  children,
  style = {},
  textStyle = {},
  ...props
}: ButtonProps) => {
  const colorScheme = useColorScheme();

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: Colors[colorScheme ?? "light"].tint,
        },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 8,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Button;
