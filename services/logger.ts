// services/logger.ts

// services/logger.ts (Versão de Emergência - Sem FileSystem)
import * as MailComposer from "expo-mail-composer";
import { Platform } from "react-native";

// Variável em memória temporária (perde-se se fechar a app, mas desenrasca)
let memoryLogs = "";

export default {
  async logError(error: any, context: string) {
    const timestamp = new Date().toISOString();
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);

    const logEntry = `[${timestamp}] [${context}]\nErro: ${message}\n------------------\n`;

    console.error(logEntry); // Mostra no terminal
    memoryLogs += logEntry; // Guarda na memória
  },

  async sendLogsByEmail() {
    if (!memoryLogs) {
      alert("Não existem logs registados.");
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (isAvailable) {
      await MailComposer.composeAsync({
        subject: `Logs Lego Inventory (${Platform.OS})`,
        body: "Logs:\n\n" + memoryLogs,
        recipients: ["nuno.santos@gmail.com"],
      });
    } else {
      alert("Configura uma conta de e-mail no telemóvel.");
    }
  },

  async clearLogs() {
    memoryLogs = "";
  },
};
