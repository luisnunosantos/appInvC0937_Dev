import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import KeyButton from "../../components/KeyButton";
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { syncLocalDatabase } from "../../services/database";

const STORAGE_KEY_DATE = "LAST_DB_DOWNLOAD";

export default function DownloadDbScreen() {
  useKeepAwake();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Pronto para transferir.");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [setsCount, setSetsCount] = useState<number | null>(null);

  useEffect(() => {
    loadLastUpdateDate();
  }, []);

  const loadLastUpdateDate = async () => {
    try {
      const date = await AsyncStorage.getItem(STORAGE_KEY_DATE);
      if (date) setLastUpdate(date);
    } catch (e) {
      console.log("Erro ao ler data", e);
    }
  };

  const handleDownload = async () => {
    if (!user || !user.email) {
      Alert.alert("Erro", "Sessão inválida. Por favor faz login novamente.");
      return;
    }

    setLoading(true);
    setStatus("A descarregar do Google Sheets...");
    setSetsCount(null);

    try {
      const urlWithUser = `${process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL}?action=sync&user=${encodeURIComponent(user.email)}`;

      const response = await fetch(urlWithUser);

      if (!response.ok) throw new Error("Erro de resposta do servidor");

      const data = await response.json();

      if (Array.isArray(data)) {
        setStatus(`A gravar ${data.length} sets no telemóvel...`);

        await syncLocalDatabase(data);

        const now = new Date();
        const dateString =
          now.toLocaleDateString("pt-PT") +
          " às " +
          now.toLocaleTimeString("pt-PT");

        await AsyncStorage.setItem(STORAGE_KEY_DATE, dateString);
        setLastUpdate(dateString);
        setStatus("Transferido com Sucesso!");
        setSetsCount(data.length);
      } else {
        setStatus("Dados inválidos.");
        Toast.show({
          type: "error",
          text1: "Dados inválidos.",
          text2: "O Google enviou dados num formato incorreto.",
          position: "top",
        });
      }
    } catch (error) {
      console.log(error);
      setStatus("Falha na ligação.");
      Toast.show({
        type: "error",
        text1: "Falha ao transferir dados.",
        text2: "Verifique o acesso á internet.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Base de Dados Offline", headerBackTitle: "Voltar" }}
      />

      <View style={styles.card}>
        {/* PARTE SUPERIOR */}
        <View style={styles.topSection}>
          <View style={styles.imageContainer}>
            <Image
              source={Theme.images.atualizar}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Modo Offline</Text>
          <Text style={styles.description}>
            Transfere todos os sets para o teu telemóvel para poderes pesquisar
            sem internet.
          </Text>
        </View>

        {/* PARTE CENTRAL: STATUS */}
        <View style={styles.centerSection}>
          <View
            style={[
              styles.statusBox,
              status === "Transferido com Sucesso!" && styles.statusBoxSuccess,
            ]}
          >
            <Text style={styles.label}>ESTADO</Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={Theme.colors.primary}
                style={{ marginVertical: Theme.metrics.spacing.small }}
              />
            ) : (
              <Ionicons
                name={
                  status === "Transferido com Sucesso!"
                    ? "checkmark-circle"
                    : "cloud-download-outline"
                }
                size={50}
                color={
                  status === "Transferido com Sucesso!"
                    ? Theme.colors.light.success
                    : Theme.colors.light.border
                }
                style={{ marginVertical: 5 }}
              />
            )}

            <Text
              style={[
                styles.statusValue,
                status === "Transferido com Sucesso!"
                  ? { color: Theme.colors.light.success }
                  : { color: Theme.colors.light.textSecondary },
              ]}
            >
              {status}
            </Text>

            {setsCount !== null && (
              <Text style={styles.countText}>{setsCount} Sets guardados</Text>
            )}
          </View>

          {lastUpdate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Última transferência:</Text>
              <Text style={styles.dateText}>{lastUpdate}</Text>
            </View>
          )}
        </View>

        {/* PARTE INFERIOR: BOTÃO LEGO ATUALIZADO */}
        <View style={styles.bottomSection}>
          <KeyButton
            title={loading ? "A Transferir..." : "TRANSFERIR AGORA"}
            onPress={handleDownload}
            disabled={loading}
            icon={
              !loading ? (
                <Ionicons
                  name="download-outline"
                  size={Theme.metrics.icon.base}
                  color={Theme.colors.light.text}
                />
              ) : undefined
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.light.background,
    padding: Theme.metrics.spacing.base,
  },
  card: {
    flex: 1,
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.xlarge,
    padding: Theme.metrics.spacing.large,
    ...Theme.shadows.default,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    marginTop: Theme.metrics.spacing.small,
  },
  imageContainer: {
    height: 100,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.metrics.spacing.small,
  },
  logo: { width: 250, height: 250 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginTop: 5,
  },
  description: {
    textAlign: "center",
    color: Theme.colors.light.textSecondary,
    marginTop: 5,
    fontSize: 14,
    paddingHorizontal: Theme.metrics.spacing.small,
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  statusBox: {
    width: "100%",
    backgroundColor: Theme.colors.light.background,
    paddingVertical: Theme.metrics.spacing.xlarge,
    borderRadius: Theme.metrics.radius.xlarge,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Theme.colors.light.border,
    borderStyle: "dashed",
  },
  statusBoxSuccess: {
    borderColor: Theme.colors.light.success,
    backgroundColor: "#e8f5e9", // Fundo verde super clarinho
    borderStyle: "solid",
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    color: Theme.colors.light.textSecondary,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  countText: {
    marginTop: Theme.metrics.spacing.small,
    fontSize: 14,
    color: Theme.colors.light.text,
    fontWeight: "600",
    backgroundColor: Theme.colors.light.cardBackground,
    paddingHorizontal: Theme.metrics.spacing.medium,
    paddingVertical: 5,
    borderRadius: Theme.metrics.radius.large,
    overflow: "hidden",
  },
  dateContainer: {
    marginTop: Theme.metrics.spacing.medium,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: Theme.colors.light.textSecondary,
  },
  dateText: {
    color: Theme.colors.light.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  bottomSection: {
    marginBottom: Theme.metrics.spacing.small,
  },
});
