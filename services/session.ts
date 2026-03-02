// services/session.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

class SessionService {
  // 1. Dados Temporários (O item que passa do ecrã de pesquisa para o confirmar)
  data: any = null;

  // 2. Preferências (Para a app se lembrar do que escreveste por último)
  lastOrigin: string = "";
  lastStorage: string = "";

  constructor() {
    // Ao iniciar, tenta logo recuperar o que estava guardado
    this.loadPreferences();
  }

  // --- Gestão de Dados Temporários ---
  setData(item: any) {
    this.data = item;
  }

  getData() {
    return this.data;
  }

  clear() {
    this.data = null;
  }

  // --- Gestão de Preferências (Origem e Armazenamento) ---

  // Chama isto quando clicares em "Confirmar" para gravar no disco
  async savePreferences(origin: string, storage: string) {
    this.lastOrigin = origin;
    this.lastStorage = storage;
    try {
      await AsyncStorage.setItem("@lego_last_origin", origin);
      await AsyncStorage.setItem("@lego_last_storage", storage);
    } catch (e) {
      console.error("Erro ao gravar preferências de sessão", e);
    }
  }

  // A app chama isto sozinha ao arrancar
  private async loadPreferences() {
    try {
      const origin = await AsyncStorage.getItem("@lego_last_origin");
      const storage = await AsyncStorage.getItem("@lego_last_storage");

      if (origin) this.lastOrigin = origin;
      if (storage) this.lastStorage = storage;
    } catch (e) {
      console.error("Erro ao carregar preferências de sessão", e);
    }
  }
}

export const SessionStore = new SessionService();
