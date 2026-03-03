// app/saida/confirmar.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import FadeInView from "../../components/FadeInView";
import KeyButton from "../../components/KeyButton";
import SetCard from "../../components/SetCard";
import SkeletonSetCard from "../../components/SkeletonSetCard"; // <-- Importado
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";

export default function SaidaConfirmarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { set_id, name, year, theme, subtheme, barcode } = params;
  const { user } = useAuth();

  const getValidSubtheme = () => {
    if (!subtheme) return null;
    const s = String(subtheme).trim().toLowerCase();
    if (s === "undefined" || s === "null" || s === "") return null;
    return String(subtheme);
  };
  const subtemaFinal = getValidSubtheme();
  const bricksetImageUrl = `https://images.brickset.com/sets/images/${set_id}-1.jpg`;

  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");
  const [destination, setDestination] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [tempOther, setTempOther] = useState("");
  const [saving, setSaving] = useState(false);

  // Estado para o Stock vindo do Google e validação inicial
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [isValidatingStock, setIsValidatingStock] = useState(true);

  // Carregamento do Stock via Google assim que enta no ecrã
  useFocusEffect(
    useCallback(() => {
      setSaving(false);

      async function fetchGoogleStock() {
        if (!set_id) return;

        setIsValidatingStock(true);
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL}?action=getStock&setId=${set_id}`,
          );

          if (response.ok) {
            const data = await response.json();
            const stockReal = data.stock !== undefined ? data.stock : 0;

            if (stockReal <= 0) {
              Vibration.vibrate(400);
              Toast.show({
                type: "error",
                text1: "Sem Stock",
                text2: "Este set não existe no teu inventário.",
                position: "top",
                visibilityTime: 3000,
              });
              // Volta para trás se não houver stock
              setTimeout(() => router.back(), 1500);
            } else {
              setCurrentStock(stockReal);
              setIsValidatingStock(false); // Mostra o formulário real!
            }
          } else {
            throw new Error("Erro na API");
          }
        } catch (error) {
          console.error("Erro ao buscar stock ao Google:", error);
          Toast.show({
            type: "error",
            text1: "Erro de ligação",
            text2: "Não foi possível verificar o stock.",
            position: "top",
          });
          setTimeout(() => router.back(), 1500);
        }
      }

      fetchGoogleStock();
    }, [set_id]),
  );

  const standardOptions = ["Para Montar", "Para Peças"];
  const isOutroSelected =
    destination !== "" && !standardOptions.includes(destination);

  const handleFinalizar = async () => {
    if (currentStock !== null && qtd > currentStock) {
      Toast.show({
        type: "error",
        text1: "Stock Insuficiente",
        text2: `Apenas ${currentStock} unidades disponíveis.`,
        position: "top",
      });
      return;
    }

    if (!destination) {
      Toast.show({
        type: "error",
        text1: "Campo Obrigatório",
        text2: "Por favor, seleciona o destino.",
        position: "top",
      });
      return;
    }

    if (destination === "Para Montar" && obs.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Observações obrigatórias para montagem.",
        position: "top",
      });
      return;
    }

    if (!user || !user.email) return;

    setSaving(true);

    try {
      const dadosParaGuardar = {
        tipoOperacao: "Saída",
        set_id,
        name,
        year,
        theme,
        subtheme: subtemaFinal || "",
        quantity: qtd,
        origin: "",
        destination,
        storage: "",
        obs,
        barcode,
        user: user.email,
      };

      const response = await fetch(process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(dadosParaGuardar),
      });
      const result = await response.json();

      if (result.result === "success") {
        Toast.show({
          type: "success",
          text1: "Saída Registada!",
          text2: `${qtd}x ${name} removido do stock.`,
          position: "top",
        });

        setTimeout(() => router.replace("/(tabs)"), 1000);
      } else {
        Toast.show({ type: "error", text1: "Erro ao guardar." });
        setSaving(false);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Erro de ligação." });
      setSaving(false);
    }
  };

  const confirmOtherDestination = () => {
    if (tempOther.trim() !== "") setDestination(tempOther.trim());
    setModalVisible(false);
  };

  // Ecrã Skeleton enquanto validade o Stock
  if (isValidatingStock) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <View style={styles.scrollContent}>
          <SkeletonSetCard />
          <View
            style={{
              height: 20,
              backgroundColor: Theme.colors.light.border,
              borderRadius: 10,
              width: 100,
              marginBottom: 15,
              marginTop: 10,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              height: 50,
              backgroundColor: Theme.colors.light.border,
              borderRadius: 12,
              width: "100%",
              marginBottom: 20,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              height: 20,
              backgroundColor: Theme.colors.light.border,
              borderRadius: 10,
              width: 120,
              marginBottom: 15,
              opacity: 0.5,
            }}
          />
          <View
            style={{
              height: 100,
              backgroundColor: Theme.colors.light.border,
              borderRadius: 12,
              width: "100%",
              opacity: 0.5,
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <FadeInView>
            <SetCard
              setId={set_id as string}
              name={name as string}
              theme={theme as string}
              subtheme={subtemaFinal}
              year={year as string}
              imageUrl={bricksetImageUrl}
              currentStock={currentStock}
              loadingStock={false}
            >
              <View style={styles.qtyPill}>
                <TouchableOpacity
                  onPress={() => setQtd(Math.max(1, qtd - 1))}
                  style={styles.qtyBtn}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={Theme.colors.light.textSecondary}
                  />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qtd}</Text>
                <TouchableOpacity
                  onPress={() => setQtd(qtd + 1)}
                  style={styles.qtyBtn}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={Theme.colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </SetCard>
          </FadeInView>

          <Text style={styles.label}>Destino :</Text>
          <View style={styles.chipsContainer}>
            {standardOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  destination === opt && styles.chipSelected,
                ]}
                onPress={() => setDestination(opt)}
              >
                <Text
                  style={[
                    styles.chipText,
                    destination === opt && styles.chipTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, isOutroSelected && styles.chipSelected]}
              onPress={() => setModalVisible(true)}
            >
              <Text
                style={[
                  styles.chipText,
                  isOutroSelected && styles.chipTextSelected,
                ]}
              >
                {isOutroSelected ? destination : "Outro..."}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Observações :</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Peças em falta..."
            placeholderTextColor={Theme.colors.light.textSecondary}
            multiline
            numberOfLines={2}
            value={obs}
            onChangeText={setObs}
          />
          <KeyButton
            title={saving ? "A Guardar..." : "Confirmar Saída"}
            onPress={handleFinalizar}
            loading={saving}
            loadingText="A GUARDAR..."
            style={{ marginTop: Theme.metrics.spacing.large }}
            type="primary"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Outro Destino</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Escreve aqui..."
              placeholderTextColor={Theme.colors.light.textSecondary}
              value={tempOther}
              onChangeText={setTempOther}
              autoFocus
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ padding: Theme.metrics.spacing.small }}
              >
                <Text style={{ color: Theme.colors.light.error, fontSize: 16 }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmOtherDestination}
                style={{ padding: Theme.metrics.spacing.small }}
              >
                <Text
                  style={{
                    color: Theme.colors.light.text,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.light.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.metrics.spacing.medium,
    paddingBottom: Theme.metrics.spacing.medium,
    marginTop: Theme.metrics.spacing.small,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.light.background,
    borderRadius: Theme.metrics.radius.round,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    paddingHorizontal: Theme.metrics.spacing.tiny,
    paddingVertical: 3,
    width: 130,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.round,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.small,
  },
  qtyText: { fontSize: 20, fontWeight: "bold", color: Theme.colors.light.text },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginTop: Theme.metrics.spacing.small,
    marginBottom: Theme.metrics.spacing.small,
    marginLeft: Theme.metrics.spacing.tiny,
  },
  input: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    padding: Theme.metrics.spacing.medium,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    marginBottom: Theme.metrics.spacing.medium,
    color: Theme.colors.light.text,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Theme.metrics.spacing.tiny,
  },
  chip: {
    flex: 1,
    backgroundColor: Theme.colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    borderRadius: Theme.metrics.radius.large,
    paddingVertical: 12,
    marginHorizontal: 3,
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: { fontSize: 14, color: Theme.colors.light.textSecondary },
  chipTextSelected: { color: Theme.colors.black, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.xlarge,
    padding: Theme.metrics.spacing.large,
    ...Theme.shadows.default,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    textAlign: "center",
    marginBottom: Theme.metrics.spacing.medium,
  },
  modalInput: {
    backgroundColor: Theme.colors.light.background,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    borderRadius: Theme.metrics.radius.large,
    padding: 12,
    fontSize: 16,
    marginBottom: Theme.metrics.spacing.medium,
    color: Theme.colors.light.text,
  },
});
