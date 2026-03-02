// constants/fonts.ts

export const fonts = {
  size: {
    small: 12,
    regular: 16,
    medium: 18,
    large: 22,
    title: 28,
  },
  weight: {
    bold: "700" as const, // TypeScript precisa do "as const" para pesos de fonte
    medium: "500" as const,
    regular: "400" as const,
  },
};
