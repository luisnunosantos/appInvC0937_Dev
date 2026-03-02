// app/inventario/index.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import KeyButton from "../../components/KeyButton";
import { GOOGLE_SCRIPT_URL } from "../../config/constants";
import Theme from "../../constants";

export default function InventoryListScreen() {
  const router = useRouter();
  const [sheets, setSheets] = useState<string[]>([]);

  // Separamos os estados de loading para melhor UX
  const [isFetching, setIsFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listInventorySheets" }),
      });
      const data = await response.json();

      if (data.success) {
        setSheets(data.sheets);
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível carregar as folhas.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro de Ligação",
        text2: "Verifica a tua ligação à internet.",
      });
    } finally {
      setIsFetching(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSheets();
  };

  const handleCreateNewSheet = async () => {
    // Se ainda está a pesquisar folhas, ignoramos o clique
    if (isFetching || isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createInventorySheet" }),
      });
      const data = await response.json();

      if (data.success) {
        router.push({
          pathname: "/inventario/inventarioscan",
          params: { sheet: data.sheetName },
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível criar a nova folha.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Falha ao comunicar com o servidor.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSheet = (sheetName: string) => {
    router.push({
      pathname: "/inventario/inventarioscan",
      params: { sheet: sheetName },
    });
  };

  // Definimos a lógica do texto do botão com base no que está a acontecer
  const getButtonTitle = () => {
    if (isFetching && !refreshing) return "A pesquisar...";
    if (isCreating) return "A criar inventário...";
    return "Iniciar Novo Inventário";
  };

  return (
    <View style={styles.container}>
      {/* 1. ÁREA SUPERIOR (LISTA DE INVENTÁRIOS) */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Continuar Inventário Existente</Text>

        {isFetching && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>A procurar folhas...</Text>
          </View>
        ) : (
          <FlatList
            data={sheets}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Theme.colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleOpenSheet(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="file-tray-full-outline"
                    size={32}
                    color={Theme.colors.primary}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item}</Text>
                  <Text style={styles.cardSubtitle}>
                    Tocar para continuar...
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={Theme.colors.light.textSecondary}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color={Theme.colors.light.textSecondary}
                />
                <Text style={styles.emptyText}>
                  Nenhuma folha de inventário encontrada.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* 2. ÁREA INFERIOR (BOTÃO NOVO INVENTÁRIO) */}
      <View style={styles.bottomSection}>
        <KeyButton
          title={
            isFetching && !refreshing
              ? "A pesquisar..."
              : "Iniciar Novo Inventário"
          }
          onPress={handleCreateNewSheet}
          loading={isCreating}
          loadingText="A criar inventário..."
          disabled={isFetching && !refreshing}
          icon={
            !isFetching && !isCreating && !refreshing ? (
              <Ionicons
                name="add-circle"
                size={24}
                color={Theme.colors.black}
              />
            ) : undefined
          }
        />
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
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginBottom: Theme.metrics.spacing.medium,
    marginLeft: 4,
    marginTop: Theme.metrics.spacing.small,
  },
  card: {
    backgroundColor: Theme.colors.light.cardBackground,
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    marginBottom: Theme.metrics.spacing.small,
    ...Theme.shadows.small,
  },
  iconContainer: {
    backgroundColor: "rgba(255, 215, 0, 0.15)", // Amarelo suave da marca
    padding: Theme.metrics.spacing.small,
    borderRadius: Theme.metrics.radius.base,
    marginRight: Theme.metrics.spacing.medium,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.light.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Theme.colors.light.textSecondary,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: Theme.metrics.spacing.small,
    fontSize: 16,
    color: Theme.colors.light.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: Theme.metrics.spacing.medium,
    fontSize: 16,
    color: Theme.colors.light.textSecondary,
    textAlign: "center",
  },
  bottomSection: {
    paddingTop: Theme.metrics.spacing.medium,
    paddingBottom: Theme.metrics.spacing.small,
  },
});
