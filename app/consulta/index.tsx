import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import KeyButton from "../../components/KeyButton";
import Keypad from "../../components/Keypad";
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { searchLocalSet } from "../../services/database";

export default function ConsultaIndexScreen() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { code: scannedCode } = useLocalSearchParams();
  const { user } = useAuth(); // Mantemos o hook, mas não bloqueamos se for null

  useFocusEffect(
    useCallback(() => {
      setCode("");
      setLoading(false);
    }, []),
  );

  const performSearch = useCallback(
    async (searchCode: string) => {
      if (!searchCode || searchCode.trim() === "") return;

      setLoading(true); // Ativa o loading visual
      try {
        // 1. Apenas verificamos se existe na base de dados local
        const localData: any = await searchLocalSet(searchCode);

        if (!localData) {
          Toast.show({
            type: "error",
            text1: "Não Encontrado",
            text2: "Código inexistente no catálogo local.",
            position: "bottom",
          });
          setLoading(false);
          return;
        }

        setLoading(false);
        // 2. NAVEGAÇÃO IMEDIATA!
        router.push({
          pathname: "/consulta/detalhes",
          params: {
            baseData: JSON.stringify(localData),
          },
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Erro ao consultar base de dados local.",
          position: "bottom",
        });
      }
    },
    [router, user],
  );

  const handleNumberPress = (num: string) => {
    if (code.length < 14) setCode((prev) => prev + num);
  };

  const handleDeletePress = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (scannedCode) {
      const cleanCode = scannedCode.toString();
      setCode(cleanCode);
      performSearch(cleanCode);
    }
  }, [scannedCode, performSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.subTitle}>
            Digite o Nº do Set ou Código de Barras
          </Text>

          <View style={styles.displayBox}>
            {loading ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            ) : (
              <Text style={styles.displayText}>{code}</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Keypad
            onNumberPress={handleNumberPress}
            onDeletePress={handleDeletePress}
            onOkPress={() => performSearch(code)}
            loading={loading}
          />

          <View style={styles.footerActions}>
            <View style={{ flex: 1, marginRight: Theme.metrics.spacing.small }}>
              <KeyButton
                title="Limpar"
                onPress={() => setCode("")}
                type="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <KeyButton
                title="Scanner"
                icon={
                  !loading ? (
                    <Ionicons
                      name="barcode-outline"
                      size={Theme.metrics.icon.base}
                      color={Theme.colors.light.text}
                    />
                  ) : undefined
                }
                onPress={() =>
                  router.push({
                    pathname: "/scanner",
                    params: { tipo: "Consulta" },
                  })
                }
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.light.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.metrics.spacing.base,
    justifyContent: "flex-start",
    paddingTop: Theme.metrics.spacing.small,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 5,
    marginBottom: 50,
  },
  subTitle: {
    fontSize: 16,
    color: Theme.colors.light.textSecondary,
    marginBottom: Theme.metrics.spacing.base,
    marginTop: 0,
    textAlign: "center",
  },
  displayBox: {
    width: "100%",
    height: 80,
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Theme.colors.light.border,
    ...Theme.shadows.small,
  },
  displayText: {
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 3,
    color: Theme.colors.light.text,
  },
  bottomSection: {
    width: "100%",
  },
  footerActions: {
    flexDirection: "row",
    marginTop: Theme.metrics.spacing.small,
  },
});
