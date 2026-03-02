// services/auth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_STORAGE_KEY = "@lego_app_user";

export const AuthService = {
  // Guardar o utilizador na memória
  saveUser: async (user: any) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Erro ao guardar user", e);
    }
  },

  // Carregar o utilizador da memória (ao abrir a app)
  getUser: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error("Erro ao ler user", e);
      return null;
    }
  },

  // Apagar utilizador (Logout)
  logout: async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error("Erro ao fazer logout", e);
    }
  },
};
