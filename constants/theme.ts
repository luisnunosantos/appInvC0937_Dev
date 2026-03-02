// constants/theme.ts

import { Platform } from "react-native";
import { colors } from "./colors";

export const Colors = {
  light: {
    text: colors.light.text,
    textSecondary: colors.light.textSecondary,
    background: colors.light.background,
    cardBackground: colors.light.cardBackground,
    tint: colors.primary, // Amarelo Lego como destaque
    icon: colors.light.textSecondary,
    tabIconDefault: colors.light.textSecondary,
    tabIconSelected: colors.primary, // Amarelo Lego no menu
    border: colors.light.border,
    error: colors.light.error, // Vermelho Lego
    success: colors.light.success,
  },
  dark: {
    text: colors.dark.text,
    textSecondary: colors.dark.textSecondary,
    background: colors.dark.background,
    cardBackground: colors.dark.cardBackground,
    tint: colors.primary, // O Amarelo Lego brilha no escuro!
    icon: colors.dark.textSecondary,
    tabIconDefault: colors.dark.textSecondary,
    tabIconSelected: colors.primary,
    border: colors.dark.border,
    error: colors.dark.error,
    success: colors.dark.success,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
