// components/FadeInView.tsx

import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface FadeInViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  index?: number; // O segredo para o efeito "cascata" numa lista!
}

export default function FadeInView({
  children,
  style,
  index = 0,
}: FadeInViewProps) {
  // 1. Valores iniciais: Invisível (opacity 0) e ligeiramente para baixo (translateY 30)
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    // 2. O delay é calculado com base no número do item na lista (100ms por item)
    const delay = index * 100;

    // 3. Dispara a animação assim que o componente é montado no ecrã
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 200 }), // Efeito de paragem suave
    );
  }, [index, opacity, translateY]);

  // 4. Injeta os valores animados no estilo
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}
