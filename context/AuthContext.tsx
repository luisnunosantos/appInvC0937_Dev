// context/AuthContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, { createContext, useContext, useEffect, useState } from "react";

// Tipo de dados do utilizador
type User = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  idToken?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (googleData: any) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const USER_STORAGE_KEY = "@lego_inventory_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Ao iniciar a App, tenta recuperar o login guardado
  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // 2. Função de Login (Global)
  async function signIn(googleResponse: any) {
    try {
      // Normalização Robusta: Procura o user onde quer que ele esteja na resposta
      const rawUser =
        googleResponse.data?.user || googleResponse.user || googleResponse;

      if (!rawUser || !rawUser.email) {
        throw new Error("Dados de utilizador inválidos recebidos do Google.");
      }

      const normalizedUser: User = {
        id: rawUser.id,
        name: rawUser.name,
        email: rawUser.email,
        photo: rawUser.photo,
        idToken: googleResponse.data?.idToken || googleResponse.idToken,
      };

      // Atualiza Memória e Disco
      setUser(normalizedUser);
      await AsyncStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(normalizedUser),
      );
    } catch (error) {
      console.error("Erro ao processar login no Contexto:", error);
      throw error;
    }
  }

  // 3. Função de Logout (Global)
  async function signOut() {
    try {
      setUser(null); // Limpa memória imediatamente
      await AsyncStorage.removeItem(USER_STORAGE_KEY); // Limpa disco
      await GoogleSignin.signOut(); // Limpa sessão Google
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar em qualquer ficheiro
export const useAuth = () => useContext(AuthContext);
