// components/SetCard.ts

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Theme from "../constants";

interface SetCardProps {
  setId: string | number;
  name: string;
  theme: string;
  subtheme?: string | null;
  year: string | number;
  imageUrl: string;
  // Props opcionais para o Stock (Badge)
  currentStock?: number | null;
  loadingStock?: boolean;
  // Permite colocar o contador de quantidade dentro do card
  children?: React.ReactNode;
}

export default function SetCard({
  setId,
  name,
  theme,
  subtheme,
  year,
  imageUrl,
  currentStock,
  loadingStock = false,
  children,
}: SetCardProps) {
  // --- LÓGICA DO BADGE ---
  const renderBadge = () => {
    // Se currentStock for undefined, estamos na Entrada (não mostrar badge)
    if (currentStock === undefined) return null;

    const stockVal = currentStock || 0;
    const hasStock = stockVal > 0;

    let badgeBg, badgeText, badgeBorder;

    if (loadingStock) {
      badgeBg = "#FFF3E0";
      badgeText = "#E65100";
      badgeBorder = "#FFB74D";
    } else if (stockVal > 1) {
      badgeBg = "#E8F5E9";
      badgeText = "#2E7D32";
      badgeBorder = Theme.colors.light.success; // Verde Padrão
    } else {
      badgeBg = "#FFEBEE";
      badgeText = "#C62828";
      badgeBorder = Theme.colors.light.error; // Vermelho Lego
    }

    return (
      <View
        style={[
          styles.stockBadge,
          { backgroundColor: badgeBg, borderColor: badgeBorder },
        ]}
      >
        {loadingStock ? (
          <ActivityIndicator size="small" color={badgeText} />
        ) : (
          <>
            <Ionicons
              name={hasStock ? "copy-outline" : "copy-outline"}
              size={16}
              color={badgeText}
            />
            <Text style={[styles.stockBadgeText, { color: badgeText }]}>
              {currentStock !== null ? `${currentStock} un.` : "?"}
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {renderBadge()}

      <Image
        source={{ uri: imageUrl }}
        style={styles.legoImage}
        resizeMode="contain"
        defaultSource={require("../assets/images/icon.png")}
      />

      <Text style={styles.setId}>#{setId}</Text>
      <Text style={styles.setName}>{name}</Text>

      <Text style={styles.setDetails}>
        {subtheme && subtheme !== "undefined" && subtheme !== "null"
          ? `${theme} | ${subtheme} | ${year}`
          : `${theme} | ${year}`}
      </Text>

      {/* Renderiza o seletor de quantidade aqui */}
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.xlarge,
    padding: Theme.metrics.spacing.medium,
    alignItems: "center",
    position: "relative",
    // Substituímos as definições de sombra antigas pelas do Theme
    ...Theme.shadows.default,
  },
  stockBadge: {
    position: "absolute",
    top: Theme.metrics.spacing.base,
    right: Theme.metrics.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Theme.metrics.radius.xlarge,
    borderWidth: 1,
    zIndex: 10,
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  legoImage: {
    width: 180,
    height: 130,
    marginBottom: Theme.metrics.spacing.medium,
    marginTop: Theme.metrics.spacing.medium,
  },
  setId: {
    fontSize: 14,
    color: Theme.colors.light.textSecondary,
    fontWeight: "bold",
  },
  setName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: Theme.colors.light.text,
    marginBottom: 2,
  },
  setDetails: {
    fontSize: 13,
    color: Theme.colors.light.textSecondary, // Substitui o #666
    marginTop: Theme.metrics.spacing.tiny,
    textAlign: "center",
  },
  childrenContainer: {
    marginTop: Theme.metrics.spacing.medium,
    width: "100%",
    alignItems: "center",
  },
});
