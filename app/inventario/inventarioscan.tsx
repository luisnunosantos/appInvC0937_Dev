import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import KeyButton from "../../components/KeyButton"; // <-- Importado o nosso botão oficial
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { getLegoSetByCode } from "../../services/database";

type ScannedItem = {
  id: string;
  code: string;
  name: string;
  setNumber: string;
  year: string;
  theme: string;
  subtheme: string;
  quantity: number;
  timestamp: string;
};

export default function InventoryScanScreen() {
  useKeepAwake();
  const router = useRouter();
  const { sheet } = useLocalSearchParams<{ sheet: string }>();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const lastScanTime = useRef<number>(0);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.textPermission}>
          Precisamos da câmara para o Inventário.
        </Text>
        {/* Botão Padronizado */}
        <KeyButton
          title="Permitir Câmara"
          onPress={requestPermission}
          style={{ width: 250 }}
        />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    if (now - lastScanTime.current < 1500) return;

    lastScanTime.current = now;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const setInfo = getLegoSetByCode(data);

    // Extrai todos os campos disponíveis
    const setName = setInfo ? setInfo.name : "Set Desconhecido";
    const setNum = setInfo ? setInfo.number : data;
    const setYear = setInfo?.year || "";
    const setTheme = setInfo?.theme || "";
    const setSubTheme = setInfo?.subtheme || "";

    setScannedItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.code === data || item.setNumber === setNum,
      );

      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += 1;
        newItems[existingIndex].timestamp = new Date().toLocaleTimeString();
        return newItems;
      } else {
        const newItem: ScannedItem = {
          id: now.toString(),
          code: data,
          name: setName,
          setNumber: setNum,
          year: setYear,
          theme: setTheme,
          subtheme: setSubTheme,
          quantity: 1,
          timestamp: new Date().toLocaleTimeString(),
        };
        return [newItem, ...prev];
      }
    });
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
    Haptics.selectionAsync();
  };

  const handleClearList = () => {
    Alert.alert(
      "Limpar Lista",
      "Tens a certeza que queres apagar tudo o que leste nesta sessão?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => setScannedItems([]),
        },
      ],
    );
  };

  const sendBatch = async () => {
    if (scannedItems.length === 0) {
      Toast.show({
        type: "error",
        text1: "Aviso",
        text2: "A lista está vazia.",
      });
      return;
    }

    Alert.alert(
      "Confirmar Gravação",
      `Queres gravar estes registos na folha ${sheet}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Gravar",
          onPress: async () => {
            setIsScanning(false);
            setLoading(true);

            try {
              const payloadItems = scannedItems.map((item) => ({
                barcode: item.code,
                setNumber: item.setNumber,
                name: item.name,
                year: item.year,
                theme: item.theme,
                subtheme: item.subtheme,
                quantity: item.quantity,
                user: user?.email || "App_User",
              }));

              const payload = {
                action: "saveInventoryBatch",
                sheetName: sheet,
                items: payloadItems,
              };

              const response = await fetch(process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              const result = await response.json();

              if (result.success) {
                // Toast Sucesso
                Toast.show({
                  type: "success",
                  text1: "Sucesso",
                  text2: "Inventário guardado com sucesso!",
                });
                setScannedItems([]);
              } else {
                // Toast Erro Servidor
                Toast.show({
                  type: "error",
                  text1: "Erro",
                  text2: result.error || "Falha ao gravar.",
                });
              }
            } catch (error) {
              // Toast Erro Rede
              Toast.show({
                type: "error",
                text1: "Erro de Conexão",
                text2: "Verifica a tua internet.",
              });
            } finally {
              setLoading(false);
              setIsScanning(true);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.overlayText}>Folha Ativa: {sheet}</Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.cameraPaused}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.pausedText}>
                  A gravar no Google Sheets...
                </Text>
              </>
            ) : (
              <Text style={styles.pausedText}>Câmara Pausada</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Lidos: {scannedItems.length} conj.
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => setIsScanning(!isScanning)}
              style={styles.iconButton}
            >
              <Ionicons
                name={isScanning ? "pause-circle" : "play-circle"}
                size={32}
                color={Theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearList}
              style={[
                styles.iconButton,
                { marginLeft: Theme.metrics.spacing.base },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={26}
                color={Theme.colors.light.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={scannedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Text style={styles.qtdText}>{item.quantity}x</Text>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>
                  Set: {item.setNumber} | EAN: {item.code}
                </Text>
                <Text style={styles.timestamp}>
                  Última leitura: {item.timestamp}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btnRemoveItem}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={28}
                  color={Theme.colors.light.error}
                />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Aponta para os códigos de barras para contar!
            </Text>
          }
        />

        {scannedItems.length > 0 && !loading && (
          <View style={styles.footerContainer}>
            {/* Botão Padronizado com ícone */}
            <KeyButton
              title={`Gravar no Inventário (${scannedItems.length})`}
              onPress={sendBatch}
              icon={
                <Ionicons
                  name="cloud-upload"
                  size={24}
                  color={Theme.colors.black}
                />
              }
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Theme.colors.light.background },

  // Permissão
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.light.background,
  },
  textPermission: {
    marginBottom: Theme.metrics.spacing.large,
    fontSize: 16,
    color: Theme.colors.light.text,
  },

  // Área da Camara
  cameraContainer: {
    height: 260,
    backgroundColor: Theme.colors.black,
    overflow: "hidden",
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  scanFrame: {
    width: 260,
    height: 160,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Theme.colors.primary,
    borderWidth: 5,
    borderRadius: Theme.metrics.radius.small,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

  overlayText: {
    color: Theme.colors.white,
    marginTop: Theme.metrics.spacing.large,
    fontWeight: "600",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: Theme.metrics.radius.base,
  },
  cameraPaused: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  pausedText: {
    color: Theme.colors.white,
    fontSize: 18,
    marginTop: Theme.metrics.spacing.small,
  },

  // Área da lista
  listContainer: { flex: 1, backgroundColor: Theme.colors.light.background },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.metrics.spacing.base,
    backgroundColor: Theme.colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.light.border,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.textSecondary,
    textTransform: "uppercase",
  },
  actionButtons: { flexDirection: "row", alignItems: "center" },
  iconButton: { padding: 4 },

  card: {
    flexDirection: "row",
    backgroundColor: Theme.colors.light.cardBackground,
    marginHorizontal: Theme.metrics.spacing.base,
    marginTop: Theme.metrics.spacing.small,
    padding: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    alignItems: "center",
    ...Theme.shadows.small,
  },
  cardIcon: {
    width: 44,
    height: 44,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.metrics.radius.base,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.metrics.spacing.medium,
  },
  qtdText: { fontWeight: "bold", fontSize: 16, color: Theme.colors.black },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Theme.colors.light.textSecondary,
    marginTop: 2,
  },
  timestamp: { fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 4 },
  btnRemoveItem: { padding: 8, marginLeft: 5 },

  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: Theme.colors.light.textSecondary,
    lineHeight: 22,
  },

  // Botão de finalizar
  footerContainer: {
    position: "absolute",
    bottom: Theme.metrics.spacing.large,
    left: Theme.metrics.spacing.large,
    right: Theme.metrics.spacing.large,
    alignItems: "center",
  },
});
