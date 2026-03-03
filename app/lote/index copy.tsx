// app/lote/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useNavigation } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert, // Mantido apenas para a pergunta de "Limpar Lista"
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Theme from "../../constants"; // Importação do Design System
import { useAuth } from "../../context/AuthContext";
import { getLegoSetByCode } from "../../services/database";

type ScannedItem = {
  id: string;
  code: string;
  name: string;
  setNumber: string;
  timestamp: string;
};

export default function ModoLoteScreen() {
  useKeepAwake();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DO MODAL DE CONFIRMAÇÃO ---
  const [modalVisible, setModalVisible] = useState(false);
  const [inputOrigin, setInputOrigin] = useState("");
  const [inputStorage, setInputStorage] = useState("");

  const lastScanTime = useRef<number>(0);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.textPermission}>
          Precisamos da câmara para o Lote.
        </Text>
        <TouchableOpacity
          style={styles.btnPermission}
          onPress={requestPermission}
        >
          <Text style={styles.btnText}>Permitir Câmara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    if (now - lastScanTime.current < 1500) return;

    lastScanTime.current = now;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const setInfo = getLegoSetByCode(data);

    const newItem: ScannedItem = {
      id: now.toString(),
      code: data,
      name: setInfo ? setInfo.name : "Set Desconhecido",
      setNumber: setInfo ? setInfo.number : "---",
      timestamp: new Date().toLocaleTimeString(),
    };

    setScannedItems((prev) => [newItem, ...prev]);
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );
    Haptics.selectionAsync();
  };

  // Mantido o Alert nativo aqui porque exige resposta (botões) do utilizador
  const handleClearList = () => {
    Alert.alert("Limpar Lista", "Tens a certeza que queres apagar tudo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpar",
        style: "destructive",
        onPress: () => setScannedItems([]),
      },
    ]);
  };

  const handleOpenConfirmModal = () => {
    if (scannedItems.length === 0) {
      Toast.show({
        type: "error",
        text1: "Aviso",
        text2: "A lista está vazia.",
        position: "top",
      });
      return;
    }
    setIsScanning(false);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsScanning(true);
  };

  const sendBatch = async (type: "ENTRADA" | "SAIDA") => {
    setModalVisible(false);
    setLoading(true);

    try {
      console.log("A enviar para:", process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL);

      const payload = {
        action: "BATCH_MOVEMENT",
        type: type,
        user: user?.email || "Sem Email",
        origin: inputOrigin,
        storage: inputStorage,
        obs: "",
        items: scannedItems.map((item) => ({
          ean: item.code,
          setNumber: item.setNumber,
          name: item.name,
        })),
      };

      const response = await fetch(process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const textResponse = await response.text();
      console.log("Resposta:", textResponse);

      try {
        const result = JSON.parse(textResponse);
        if (
          response.ok &&
          (result.status === "success" || result.result === "success")
        ) {
          // Toast de Sucesso
          Toast.show({
            type: "success",
            text1: "Sucesso",
            text2: `${result.count || "Vários"} movimentos registados!`,
          });
          setScannedItems([]);
          setInputOrigin("");
          setInputStorage("");
          setIsScanning(true);
        } else {
          // Toast de Erro do Servidor
          Toast.show({
            type: "error",
            text1: "Erro no Servidor",
            text2: result.message || "Falha desconhecida.",
          });
          setIsScanning(true);
        }
      } catch (e) {
        // Toast de Resposta Inválida
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Resposta inválida do servidor.",
        });
      }
    } catch (error) {
      // Toast de Falha de Conexão
      Toast.show({
        type: "error",
        text1: "Erro de Conexão",
        text2: "Verifica a internet.",
      });
      setIsScanning(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* ÁREA DA CÂMARA */}
      <View style={styles.cameraContainer}>
        {isScanning ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              {/* Moldura inspirada no teu Scanner principal */}
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.overlayText}>
                Aponta para o código de barras
              </Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.cameraPaused}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.pausedText}>A gravar dados...</Text>
              </>
            ) : (
              <Text style={styles.pausedText}>A aguardar confirmação...</Text>
            )}
          </View>
        )}
      </View>

      {/* LISTA */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Itens Lidos ({scannedItems.length})
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
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={Theme.colors.light.textSecondary}
                />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>
                  Set: {item.setNumber} | EAN: {item.code}
                </Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>

              {/* BOTÃO DE REMOVER ITEM INDIVIDUAL */}
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
            <Text style={styles.emptyText}>Começa a passar as caixas!</Text>
          }
        />

        {scannedItems.length > 0 && !loading && (
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={handleOpenConfirmModal}
            >
              <Text style={styles.btnConfirmText}>
                Finalizar Lote ({scannedItems.length})
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={Theme.colors.black}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* --- MODAL DE DETALHES --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalhes do Lote</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={Theme.colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Origem / Fonte</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Fornecedor, Loja, Caixa X..."
                placeholderTextColor={Theme.colors.light.textSecondary}
                value={inputOrigin}
                onChangeText={setInputOrigin}
              />

              <Text style={styles.label}>Local de Armazenamento</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Prateleira A1, Armazém 2..."
                placeholderTextColor={Theme.colors.light.textSecondary}
                value={inputStorage}
                onChangeText={setInputStorage}
              />

              <View style={styles.modalButtons}>
                {/* Botão SAÍDA (Vermelho) */}
                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnSaida]}
                  onPress={() => sendBatch("SAIDA")}
                >
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={24}
                    color={Theme.colors.white}
                  />
                  <Text style={styles.modalBtnTextWhite}>Saída</Text>
                </TouchableOpacity>

                {/* Botão ENTRADA (Amarelo) */}
                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnEntrada]}
                  onPress={() => sendBatch("ENTRADA")}
                >
                  <Ionicons
                    name="arrow-down-circle-outline"
                    size={24}
                    color={Theme.colors.black}
                  />
                  <Text style={styles.modalBtnText}>Entrada</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Theme.colors.light.background },

  // --- PERMISSÕES ---
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.light.background,
  },
  textPermission: {
    marginBottom: 20,
    fontSize: 16,
    color: Theme.colors.light.text,
  },
  btnPermission: {
    backgroundColor: Theme.colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  btnText: { fontWeight: "bold", color: Theme.colors.black },

  // --- ÁREA DA CÂMARA ---
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

  // Moldura do Scanner no Lote
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
    borderColor: Theme.colors.primary, // Amarelo Lego
    borderWidth: 5,
    borderRadius: Theme.metrics.radius.small,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

  overlayText: {
    color: Theme.colors.white,
    marginTop: 20,
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
  pausedText: { color: Theme.colors.white, fontSize: 18, marginTop: 10 },

  // --- ÁREA DA LISTA ---
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
    padding: 14,
    borderRadius: Theme.metrics.radius.large,
    alignItems: "center",
    ...Theme.shadows.small,
  },
  cardIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 215, 0, 0.15)", // Amarelo suave em vez do antigo amarelo seco
    borderRadius: Theme.metrics.radius.base,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
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

  // --- BOTÃO FINALIZAR (RODAPÉ) ---
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  btnConfirm: {
    backgroundColor: Theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: Theme.metrics.radius.round,
    width: "100%",
    ...Theme.shadows.default,
  },
  btnConfirmText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.black,
  },

  // --- ESTILOS DO MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderTopLeftRadius: Theme.metrics.radius.xlarge,
    borderTopRightRadius: Theme.metrics.radius.xlarge,
    padding: Theme.metrics.spacing.large,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.metrics.spacing.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.light.textSecondary,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: Theme.colors.light.background,
    borderRadius: Theme.metrics.radius.base,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    color: Theme.colors.light.text,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: Theme.metrics.radius.large,
    gap: 8,
  },
  btnEntrada: { backgroundColor: Theme.colors.primary }, // Amarelo
  btnSaida: { backgroundColor: Theme.colors.light.error }, // Vermelho Lego
  modalBtnText: { fontWeight: "bold", color: Theme.colors.black, fontSize: 16 },
  modalBtnTextWhite: {
    fontWeight: "bold",
    color: Theme.colors.white,
    fontSize: 16,
  },
});
