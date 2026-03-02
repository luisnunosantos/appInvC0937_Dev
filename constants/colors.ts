// constants/colors.ts

// --- CORES BASE DA MARCA ---
const legoYellow = "#FFD700"; // O nosso Amarelo Principal
const legoRed = "#D11013"; // Vermelho Lego para erros ou destaques
const white = "#FFFFFF";
const black = "#000000";

export const colors = {
  // --- CORES GLOBAIS (Iguais em qualquer modo) ---
  primary: legoYellow,
  secondary: black,
  white: white,
  black: black,

  // --- MODO CLARO (Light) ---
  light: {
    background: "#F5F5F5", // Cinza muito claro
    cardBackground: white, // Cartões brancos
    text: "#11181C", // Texto quase preto
    textSecondary: "#687076", // Cinza médio
    border: "#E1E4E8", // Borda subtil
    error: legoRed, // Vermelho Lego
    success: "#4CAF50", // Verde padrão
    shadowColor: "#000000", // Sombra preta
  },

  // --- MODO ESCURO (Dark) ---
  dark: {
    background: "#151718", // Fundo principal muito escuro
    cardBackground: "#202425", // Cartões ligeiramente mais claros que o fundo
    text: "#ECEDEE", // Texto claro (quase branco) para não cansar a vista
    textSecondary: "#9BA1A6", // Cinza claro para texto secundário
    border: "#3A3D40", // Bordas escuras
    error: "#E53935", // Vermelho ligeiramente suavizado para o ecrã escuro
    success: "#43A047", // Verde suavizado
    shadowColor: "#000000",
  },
};
