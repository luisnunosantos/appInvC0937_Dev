import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import KeyButton from "../../components/KeyButton";
import SetCard from "../../components/SetCard";
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { SessionStore } from "../../services/session";

export default function EntradaConfirmarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const { set_id, name, year, theme, subtheme, barcode, image_url } = params;

  const getValidSubtheme = () => {
    if (!subtheme) return null;
    const s = String(subtheme).trim().toLowerCase();
    if (s === "undefined" || s === "null" || s === "") return null;
    return String(subtheme);
  };
  const subtemaFinal = getValidSubtheme();

  const displayImage = image_url
    ? String(image_url)
    : `https://images.brickset.com/sets/images/${set_id}-1.jpg`;

  const [qtd, setQtd] = useState(1);
  const [origin, setOrigin] = useState(SessionStore.data?.lastOrigin || "");
  const [storage, setStorage] = useState(SessionStore.data?.lastStorage || "");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSaving(false);
    }, []),
  );

  const handleFinalizar = async () => {
    if (storage.trim() === "") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "error",
        text1: "Campo Obrigatório",
        text2: "Por favor, indique o Local de Armazenamento.",
        position: "top",
        visibilityTime: 4000,
      });
      return;
    }

    if (!user || !user.email) {
      Toast.show({
        type: "error",
        text1: "Erro de Sessão",
        text2: "Faz login novamente.",
        position: "top",
      });
      return;
    }

    setSaving(true);

    try {
      SessionStore.savePreferences(origin, storage);

      const dadosParaGuardar = {
        tipoOperacao: "Entrada",
        set_id: set_id,
        name: name,
        year: year,
        theme: theme,
        subtheme: subtemaFinal || "",
        quantity: qtd,
        origin: origin,
        destination: "",
        storage: storage,
        obs: "",
        barcode: barcode,
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
          text1: "Sucesso!",
          text2: `Entrada de ${qtd}x ${name} registada.`,
          position: "top",
          visibilityTime: 3000,
        });

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1000);
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Falha ao guardar na Google Sheet.",
          position: "top",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Erro de Ligação",
        text2: "Verifica a tua internet.",
        position: "top",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CARTÃO DO SET */}
          <SetCard
            setId={set_id as string}
            name={name as string}
            theme={theme as string}
            subtheme={subtemaFinal}
            year={year as string}
            imageUrl={displayImage}
          >
            {/* O SELETOR DE QUANTIDADE ENTRA COMO CHILDREN */}
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

          {/* FORMULÁRIO */}
          <View style={styles.form}>
            <Text style={styles.label}>Origem :</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Lego Store, OLX..."
              placeholderTextColor={Theme.colors.light.textSecondary}
              value={origin}
              onChangeText={setOrigin}
            />

            <Text
              style={[
                styles.label,
                { marginTop: Theme.metrics.spacing.medium },
              ]}
            >
              Local de Armazenamento{" "}
              <Text style={styles.required}>* (Obrigatório)</Text>:
            </Text>
            <TextInput
              style={[
                styles.input,
                storage.trim() === "" ? styles.inputError : null,
              ]}
              placeholder="Ex: Garagem, Vault..."
              placeholderTextColor={Theme.colors.light.textSecondary}
              value={storage}
              onChangeText={setStorage}
            />
          </View>

          <KeyButton
            title={saving ? "A Guardar..." : "Confirmar Entrada"}
            onPress={handleFinalizar}
            loading={saving}
            loadingText="A GUARDAR..."
            style={{ marginTop: Theme.metrics.spacing.large }}
            type="primary"
          />

          <View style={{ height: Theme.metrics.spacing.medium }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.metrics.spacing.medium,
    paddingBottom: Theme.metrics.spacing.medium,
    paddingTop: 0,
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
    ...Theme.shadows.small, // Substitui a sombra fixa
  },
  qtyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  form: {
    marginTop: Theme.metrics.spacing.small,
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginBottom: Theme.metrics.spacing.small,
  },
  required: {
    color: Theme.colors.light.error,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    padding: 12,
    fontSize: 16,
    color: Theme.colors.light.text,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
  },
  inputError: {
    borderColor: Theme.colors.light.error,
    borderWidth: 1.5,
  },
});
