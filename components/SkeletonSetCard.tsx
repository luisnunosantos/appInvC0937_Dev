// components/SkeletonSetCard.ts

import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Theme from "../constants";

export default function SkeletonSetCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  // Animação de "Respiração" (Pulse)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      {/* 1. Placeholder do Badge (Canto superior direito) */}
      <Animated.View style={[styles.skeletonBadge, { opacity }]} />

      {/* 2. Placeholder da Imagem */}
      <Animated.View style={[styles.skeletonImage, { opacity }]} />

      {/* 3. Placeholder do ID (#12345) */}
      <Animated.View style={[styles.skeletonTextSmall, { opacity }]} />

      {/* 4. Placeholder do Nome do Set */}
      <Animated.View style={[styles.skeletonTextTitle, { opacity }]} />

      {/* 5. Placeholder dos Detalhes (Ano | Tema) */}
      <Animated.View style={[styles.skeletonTextMedium, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Fundo branco do modo claro
    backgroundColor: Theme.colors.light.cardBackground,
    // Usa o mesmo arredondamento e padding do SetCard real
    borderRadius: Theme.metrics.radius.xlarge,
    padding: Theme.metrics.spacing.medium,
    alignItems: "center",
    marginBottom: Theme.metrics.spacing.medium,
    width: "100%",
    // A sombra perfeita que definimos no teu Theme
    ...Theme.shadows.default,
  },
  skeletonBadge: {
    position: "absolute",
    // Posição exatamente igual ao Badge do SetCard
    top: Theme.metrics.spacing.base,
    right: Theme.metrics.spacing.base,
    width: 60,
    height: 24,
    borderRadius: Theme.metrics.radius.xlarge,
    // Usamos a cor da borda para fazer o esqueleto (um cinza muito limpo)
    backgroundColor: Theme.colors.light.border,
  },
  skeletonImage: {
    width: 180,
    height: 130,
    borderRadius: Theme.metrics.radius.large,
    backgroundColor: Theme.colors.light.border,
    marginBottom: Theme.metrics.spacing.medium,
    marginTop: Theme.metrics.spacing.medium,
  },
  skeletonTextSmall: {
    width: 60,
    height: 14,
    borderRadius: Theme.metrics.radius.small,
    backgroundColor: Theme.colors.light.border,
    marginBottom: Theme.metrics.spacing.small,
  },
  skeletonTextTitle: {
    width: "80%",
    height: 22,
    borderRadius: Theme.metrics.radius.base,
    backgroundColor: Theme.colors.light.border,
    marginBottom: Theme.metrics.spacing.small,
  },
  skeletonTextMedium: {
    width: "60%",
    height: 14,
    borderRadius: Theme.metrics.radius.small,
    backgroundColor: Theme.colors.light.border,
  },
});
