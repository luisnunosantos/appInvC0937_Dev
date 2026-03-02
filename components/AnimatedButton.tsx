// components/AnimatedButton.tsx

import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Transforma o Pressable normal do React Native num componente animável
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleDownTo?: number; // Permite ajustar o quanto o botão encolhe (ex: 0.95 = 95% do tamanho)
}

export default function AnimatedButton({
  children,
  style,
  scaleDownTo = 0.95,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  // Estilo que vai reagir em tempo real ao valor do scale
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    // 1. Vibração suave imediata
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 2. Encolhe o botão rapidamente (100 milissegundos)
    scale.value = withTiming(scaleDownTo, { duration: 100 });

    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    // 3. Volta ao tamanho normal com um efeito de mola orgânico
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
    });

    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
