// constants/index.ts

import { colors } from "./colors";
import { fonts } from "./fonts";
import { images } from "./images";
import { metrics } from "./metrics";

const Theme = {
  colors,
  metrics,
  fonts,
  images,

  // Helper para sombras consistentes
  shadows: {
    default: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    small: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    // ADICIONAMOS A SOMBRA LARGE AQUI 👇
    large: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, // Um pouco mais forte para modais e cartões sobrepostos
      shadowRadius: 12,
      elevation: 8, // Importante para o Android
    },
  },
};

export default Theme;
