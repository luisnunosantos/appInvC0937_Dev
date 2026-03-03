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

const STORAGE_KEY_DATE = "LAST_BRICKSET_UPDATE";

export default function BricksetUpdateScreen() {
  useKeepAwake(); // Mantém o ecrã ligado durante o update
  const router = useRouter();

  // 2. OBTER O UTILIZADOR DO CONTEXTO
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("A aguardar início...");
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

  const handleUpdate = async () => {
    // 3. VERIFICAÇÃO DE SEGURANÇA
    if (!user || !user.email) {
      Alert.alert("Erro", "Sessão inválida. Por favor faz login novamente.");
      return;
    }

    setLoading(true);
    setStatus("A contactar Brickset...");
    setSetsCount(null);

    try {
      // 4. URL COM O USER EMAIL
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL}?action=updateBrickset&user=${encodeURIComponent(user.email)}`,
      );
      const result = await response.json();

      if (result.result === "success") {
        const now = new Date();
        const dateString =
          now.toLocaleDateString("pt-PT") +
          " às " +
          now.toLocaleTimeString("pt-PT");

        await AsyncStorage.setItem(STORAGE_KEY_DATE, dateString);

        setLastUpdate(dateString);
        setStatus("Atualizado com Sucesso!");
        setSetsCount(result.count);
      } else {
        setStatus("Erro na atualização.");
        Toast.show({
          type: "error",
          text1: "Erro na atualização.",
          text2: "O Google Script reportou um erro.",
          position: "top",
        });
      }
    } catch (error) {
      setStatus("Falha na ligação.");
      Toast.show({
        type: "error",
        text1: "Erro de ligação.",
        text2: "Verifica a internet.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: "Sincronização Brickset", headerBackTitle: "Voltar" }}
      />

      <View style={styles.card}>
        {/* PARTE SUPERIOR: LOGO E TÍTULO */}
        <View style={styles.topSection}>
          <View style={styles.imageContainer}>
            <Image
              source={Theme.images.brickset}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Atualizar Catálogo</Text>
          <Text style={styles.description}>
            Sincronização direta com a base de dados oficial do Brickset.
          </Text>
        </View>

        {/* PARTE CENTRAL: STATUS */}
        <View style={styles.centerSection}>
          <View
            style={[
              styles.statusBox,
              status === "Atualizado com Sucesso!" && styles.statusBoxSuccess,
            ]}
          >
            <Text style={styles.label}>ESTADO ATUAL</Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={Theme.colors.primary}
                style={{ marginVertical: Theme.metrics.spacing.small }}
              />
            ) : (
              <Ionicons
                name={
                  status === "Atualizado com Sucesso!"
                    ? "checkmark-circle"
                    : "information-circle"
                }
                size={50}
                color={
                  status === "Atualizado com Sucesso!"
                    ? Theme.colors.light.success
                    : Theme.colors.light.border
                }
                style={{ marginVertical: 5 }}
              />
            )}

            <Text
              style={[
                styles.statusValue,
                status === "Atualizado com Sucesso!"
                  ? { color: Theme.colors.light.success }
                  : { color: Theme.colors.light.textSecondary },
              ]}
            >
              {status}
            </Text>

            {setsCount !== null && (
              <Text style={styles.countText}>{setsCount} Sets processados</Text>
            )}
          </View>

          {lastUpdate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Última atualização:</Text>
              <Text style={styles.dateText}>{lastUpdate}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSection}>
          <KeyButton
            title={loading ? "A Atualizar..." : "INICIAR ATUALIZAÇÃO"}
            onPress={handleUpdate}
            disabled={loading}
            icon={
              !loading ? (
                <Ionicons
                  name="cloud-upload"
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

  // --- SECÇÃO SUPERIOR ---
  topSection: {
    alignItems: "center",
    marginTop: Theme.metrics.spacing.medium,
  },
  imageContainer: {
    height: 140,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.metrics.spacing.small,
  },
  logo: {
    width: "90%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginTop: Theme.metrics.spacing.small,
  },
  description: {
    textAlign: "center",
    color: Theme.colors.light.textSecondary,
    marginTop: 5,
    fontSize: 14,
    paddingHorizontal: Theme.metrics.spacing.medium,
  },

  // --- SECÇÃO CENTRAL ---
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
    backgroundColor: "#e8f5e9", // Fundo verde clarinho mantido para dar destaque
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
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  countText: {
    marginTop: Theme.metrics.spacing.small,
    fontSize: 16,
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
