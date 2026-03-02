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

export default function EntradaDigitarScreen() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { code: scannedCode } = useLocalSearchParams();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      setCode("");
      setLoading(false);
    }, []),
  );

  const performSearch = useCallback(
    async (searchCode: string) => {
      if (!user)
        return Toast.show({
          type: "error",
          text2: "Login Necessário.",
          position: "top",
        });
      if (!searchCode || searchCode.trim() === "") return;

      setLoading(true);
      try {
        const localData: any = await searchLocalSet(searchCode);

        if (!localData) {
          Toast.show({
            type: "error",
            text1: "Não Encontrado",
            text2: "Código inexistente no catálogo local.",
            position: "top",
          });
          setLoading(false);
          return;
        }

        setLoading(false);
        const barcodeToSend =
          searchCode.length > 8 ? searchCode : localData.ean || "";

        router.push({
          pathname: "/entrada/confirmar",
          params: {
            set_id: localData.number,
            name: localData.name,
            year: localData.year,
            theme: localData.theme,
            subtheme: localData.subtheme,
            barcode: barcodeToSend,
            image_url: localData.image_url,
          },
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
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
        {/* Cabeçalho e Visor */}
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

        {/* Teclado e Botões */}
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
                    params: { type: "entrada" },
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
    // Alterado para ir buscar a cor correta ao modo claro
    backgroundColor: Theme.colors.light.background,
  },
  content: {
    flex: 1,
    // Usamos a nova métrica de espaçamento
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
    // Mantemos a fonte, mas garantimos a cor secundária do modo light
    fontSize: 16,
    color: Theme.colors.light.textSecondary,
    marginBottom: Theme.metrics.spacing.base,
    marginTop: 0,
  },
  displayBox: {
    width: "100%",
    height: 80,
    backgroundColor: Theme.colors.light.cardBackground,
    // Nova métrica de arredondamento
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
