// components/ToastConfig.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ToastConfigParams } from "react-native-toast-message";
import Theme from "../constants";

// O nosso Componente de Toast Customizado
const CustomToast = ({
  text1,
  text2,
  type,
}: ToastConfigParams<any> & { type: "success" | "error" | "info" }) => {
  useEffect(() => {
    if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === "error") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [type]);

  const isSuccess = type === "success";
  const isError = type === "error";

  // Cores dinâmicas com base no tipo
  const iconName = isSuccess
    ? "checkmark-circle"
    : isError
      ? "alert-circle"
      : "information-circle";
  const iconColor = isSuccess
    ? Theme.colors.light.success
    : isError
      ? Theme.colors.light.error
      : Theme.colors.primary;

  return (
    <View style={[styles.container, { borderLeftColor: iconColor }]}>
      <Ionicons
        name={iconName}
        size={28}
        color={iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  );
};

// Exportar a configuração que o Toast vai usar
export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <CustomToast {...props} type="success" />
  ),
  error: (props: ToastConfigParams<any>) => (
    <CustomToast {...props} type="error" />
  ),
  info: (props: ToastConfigParams<any>) => (
    <CustomToast {...props} type="info" />
  ),
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    borderLeftWidth: 8, // Borda lateral grossa com a cor do estado (Verde/Vermelho)
    padding: Theme.metrics.spacing.medium,
    flexDirection: "row",
    alignItems: "center",
    ...Theme.shadows.default,
    marginTop: Theme.metrics.spacing.small,
  },
  icon: {
    marginRight: Theme.metrics.spacing.medium,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: Theme.colors.light.textSecondary,
  },
});
