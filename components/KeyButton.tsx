// components/KeyButton.ts

import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import Theme from "../constants";

interface KeyButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "danger" | "standard";
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export default function KeyButton({
  title,
  onPress,
  type = "primary",
  loading = false,
  loadingText,
  disabled = false,
  style,
  icon,
}: KeyButtonProps) {
  // 1. Controlamos a escala de forma isolada
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withTiming(0.95, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    }
  };

  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return "#CCC";
    if (pressed) {
      if (type === "standard") return "#E0E0E0";
      if (type === "secondary") return "#333";
      if (type === "danger") return "#B71C1C";
      return "#C6A700";
    }
    if (type === "standard") return Theme.colors.light.cardBackground;
    if (type === "secondary") return Theme.colors.black;
    if (type === "danger") return Theme.colors.light.error;
    return Theme.colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return "#666";
    if (type === "primary" || type === "standard") return Theme.colors.black;
    return Theme.colors.white;
  };

  return (
    // 2. A animação fica toda do lado de fora, protegendo o teu layout!
    <Animated.View
      style={[
        animatedStyle,
        { width: "100%", marginVertical: Theme.metrics.spacing.tiny },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: getBackgroundColor(pressed),
            opacity: pressed ? 0.9 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <View style={styles.content}>
            <ActivityIndicator color={getTextColor()} />
            {loadingText && (
              <Text
                style={[
                  styles.text,
                  {
                    color: getTextColor(),
                    marginLeft: Theme.metrics.spacing.small,
                    fontSize: 18,
                  },
                ]}
              >
                {loadingText}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {icon && (
              <View
                style={[
                  styles.iconContainer,
                  title ? { marginRight: 5 } : null,
                ]}
              >
                {icon}
              </View>
            )}
            {title ? (
              <Text style={[styles.text, { color: getTextColor() }]}>
                {title}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Theme.metrics.buttonHeight,
    borderRadius: Theme.metrics.radius.large,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Theme.shadows.default,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 0,
  },
  text: {
    fontSize: Theme.fonts?.size?.large || 18,
    fontWeight: Theme.fonts?.weight?.bold || "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
