// constants/metrics.ts

import { Dimensions, Platform } from "react-native";

// Captura o tamanho do ecrã do telemóvel
const { width, height } = Dimensions.get("window");

export const metrics = {
  // --- DIMENSÕES DO ECRÃ ---
  screenWidth: width,
  screenHeight: height,

  // --- ESPAÇAMENTOS (Margin e Padding) ---
  // Usar estes valores em vez de números soltos (ex: padding: 16 -> padding: metrics.spacing.base)
  spacing: {
    tiny: 4,
    small: 8,
    base: 16, // Espaçamento padrão das laterais do ecrã
    medium: 20, // Muito usado dentro dos cartões
    large: 24,
    xlarge: 32,
    xxlarge: 48,
  },

  // --- ARREDONDAMENTOS (Border Radius) ---
  radius: {
    small: 4,
    base: 8, // Para inputs de texto e caixas pequenas
    large: 12, // O PADRÃO PARA OS TEUS CARTÕES
    xlarge: 20, // Para Modais (que sobem do fundo do ecrã)
    round: 9999, // Para botões circulares perfeitos
  },

  // --- TAMANHOS DE ÍCONES (Regra: Ícones Grandes) ---
  icon: {
    small: 16,
    base: 24, // Ícones secundários
    large: 32, // Ícones de ações principais (Padrão da app)
    xlarge: 48, // Ícones de destaque
    giant: 80, // Para ecrãs de estado (ex: "Em desenvolvimento")
  },

  // --- TAMANHOS DE COMPONENTES PADRÃO ---
  buttonHeight: 50, // Altura confortável para o polegar carregar
  inputHeight: 48, // Altura das caixas de pesquisa/texto
  headerHeight: Platform.OS === "ios" ? 44 : 56, // Altura da barra superior

  // --- SOMBRAS SUAVES (Regra de Design) ---
  // Podes espalhar isto nos teus cartões com: ...metrics.shadows.soft
  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2, // Para Android
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4, // Para Android
    },
  },
};
