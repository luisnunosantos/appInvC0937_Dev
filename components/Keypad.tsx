// components/Keypad.ts

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import Theme from "../constants";
import KeyButton from "./KeyButton";

interface KeypadProps {
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  onOkPress: () => void;
  loading?: boolean;
}

export default function Keypad({
  onNumberPress,
  onDeletePress,
  onOkPress,
  loading = false,
}: KeypadProps) {
  const renderNumber = (num: string) => (
    <View style={styles.keyWrapper}>
      <KeyButton
        title={num}
        onPress={() => onNumberPress(num)}
        type="standard" // Branco
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Linha 1 */}
      <View style={styles.row}>
        {renderNumber("1")}
        {renderNumber("2")}
        {renderNumber("3")}
      </View>

      {/* Linha 2 */}
      <View style={styles.row}>
        {renderNumber("4")}
        {renderNumber("5")}
        {renderNumber("6")}
      </View>

      {/* Linha 3 */}
      <View style={styles.row}>
        {renderNumber("7")}
        {renderNumber("8")}
        {renderNumber("9")}
      </View>

      {/* Linha 4 */}
      <View style={styles.row}>
        {/* APAGAR (Vermelho) */}
        <View style={styles.keyWrapper}>
          <KeyButton
            title=""
            onPress={onDeletePress}
            type="danger"
            icon={
              <Ionicons
                name="backspace-outline"
                size={30}
                color={Theme.colors.white}
              />
            }
          />
        </View>

        {/* ZERO (Branco) */}
        {renderNumber("0")}

        {/* OK (Amarelo) */}
        <View style={styles.keyWrapper}>
          <KeyButton
            title="OK"
            onPress={onOkPress}
            loading={loading}
            type="primary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 0,
    marginTop: Theme.metrics.spacing.small,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.metrics.spacing.small,
  },
  keyWrapper: {
    flex: 1,
    paddingHorizontal: Theme.metrics.spacing.tiny,
  },
});
