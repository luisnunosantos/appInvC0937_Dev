// app/scanner.tsx

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import Theme from "../constants";
import { searchLocalSet } from "../services/database";

const { width } = Dimensions.get("window");
const SCANNER_SIZE = 280; // Tamanho do quadrado de leitura

export default function ScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false); // Estado da lanterna

  // Animação da linha do laser
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startLaserAnimation();
  }, []);

  const startLaserAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: SCANNER_SIZE - 10,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Precisamos da sua permissão para usar a câmara.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);

    const cleanCode = data.trim();

    // Lógica baseada no parâmetro 'tipo' (Consulta, Entrada, Saída)
    const targetRoute =
      params.tipo === "Entrada"
        ? "/entrada/index"
        : params.tipo === "Saída"
          ? "/saida/index"
          : "/consulta/index";

    // Verifica se existe localmente (para dar feedback rápido)
    const localSet = await searchLocalSet(cleanCode);

    if (localSet) {
      // SUCESSO
      router.replace({
        pathname: targetRoute,
        params: { code: localSet.number },
      });
    } else {
      // ERRO
      Toast.show({
        type: "error",
        text1: "Produto Desconhecido",
        text2: `O código ${cleanCode} não está no catálogo local.`,
        position: "bottom",
        visibilityTime: 3000,
      });

      // Reativa o scanner após 3 segundos
      setTimeout(() => {
        setScanned(false);
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Theme.colors.black}
      />

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"],
        }}
      >
        {/* OVERLAY ESCURO (MÁSCARA) */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayCenterRow}>
            <View style={styles.overlaySide} />

            {/* JANELA DE LEITURA (TRANSPARENTE) */}
            <View style={styles.scannerWindow}>
              {/* Cantos da Mira (Amarelos) */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Linha Laser Animada (Usa o Vermelho Lego!) */}
              <Animated.View
                style={[
                  styles.laserLine,
                  { transform: [{ translateY: laserAnim }] },
                ]}
              />
            </View>

            <View style={styles.overlaySide} />
          </View>

          {/* MENSAGEM E BOTÕES EM BAIXO */}
          <View style={styles.overlayBottom}>
            <Text style={styles.instructionText}>
              Aponte para o código de barras da caixa
            </Text>

            <View style={styles.controlsContainer}>
              {/* Botão Lanterna */}
              <TouchableOpacity
                onPress={() => setTorch(!torch)}
                style={styles.controlButton}
              >
                <Ionicons
                  name={torch ? "flash" : "flash-off"}
                  size={Theme.metrics.icon.large}
                  color={torch ? Theme.colors.primary : Theme.colors.white}
                />
              </TouchableOpacity>

              {/* Botão Fechar */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.controlButton, styles.closeButton]}
              >
                <Ionicons
                  name="close"
                  size={Theme.metrics.icon.large}
                  color={Theme.colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.black,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Theme.colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.metrics.spacing.large,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Theme.metrics.spacing.large,
    fontSize: 16,
    color: Theme.colors.light.text,
  },
  camera: {
    flex: 1,
  },
  button: {
    padding: Theme.metrics.spacing.medium,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.metrics.radius.large,
    ...Theme.shadows.small,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.black,
  },

  // --- OVERLAY STYLES ---
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  overlayTop: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.7)", // Escurece o topo
  },
  overlayCenterRow: {
    flexDirection: "row",
    height: SCANNER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)", // Escurece os lados
  },
  scannerWindow: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: "transparent",
    position: "relative",
  },
  overlayBottom: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.7)", // Escurece o fundo
    alignItems: "center",
    paddingTop: Theme.metrics.spacing.large,
  },

  // --- CANTOS DA MIRA ---
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: Theme.colors.primary, // Amarelo Lego
    borderWidth: 6,
    borderRadius: Theme.metrics.radius.small,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  // --- LASER ---
  laserLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Theme.colors.light.error, // Vermelho Lego!
    opacity: 0.8,
    shadowColor: Theme.colors.light.error,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },

  // --- TEXTOS E BOTÕES ---
  instructionText: {
    color: Theme.colors.white,
    fontSize: 16,
    marginBottom: Theme.metrics.spacing.xlarge,
    textAlign: "center",
    paddingHorizontal: Theme.metrics.spacing.medium,
    fontWeight: "500",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginBottom: Theme.metrics.spacing.xlarge,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: Theme.metrics.radius.round,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "rgba(209, 16, 19, 0.4)", // Vermelho com transparência baseado no Vermelho Lego (#D11013)
  },
});
