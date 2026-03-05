import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import SetCard from "../../components/SetCard";
import SkeletonSetCard from "../../components/SkeletonSetCard";
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";

// 1. Definição de Tipos Estritos
interface HistoryItem {
  tipo: string;
  data: string;
  qtd: number;
  storage: string;
}

interface SetInfo {
  set_id: string | number;
  name: string;
  year: number;
  theme: string;
  subtheme: string;
  image_url?: string;
  location: string;
  history: HistoryItem[];
  stock: number;
}

// 2. Componente de Skeleton fora da função principal para evitar re-renders desnecessários
const SkeletonLine = ({ style }: { style?: any }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: Theme.colors.light.border,
          borderRadius: Theme.metrics.radius.small,
        },
        style,
        { opacity },
      ]}
    />
  );
};

export default function DetalhesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);

  const localData = useMemo(() => {
    return params.baseData ? JSON.parse(params.baseData as string) : null;
  }, [params.baseData]);

  const isStale =
    setInfo && localData && String(setInfo.set_id) !== String(localData.number);

  useEffect(() => {
    if (isStale) {
      setLoading(true);
      setSetInfo(null);
    }

    async function fetchData() {
      if (!localData) return;

      try {
        const userEmail = user?.email || "visitante";

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL}?action=getStock&setId=${localData.number}&user=${encodeURIComponent(userEmail)}`,
        );
        const cloudInfo = await response.json();

        const hasStock = cloudInfo.stock !== undefined && cloudInfo.stock > 0;
        const rawHistory = cloudInfo.history || cloudInfo.movimentos || [];
        const hasHistory = Array.isArray(rawHistory) && rawHistory.length > 0;

        if (!hasStock && !hasHistory) {
          Toast.show({
            type: "error",
            text1: "Set Inexistente",
            text2: `O set ${localData.number} não consta no teu inventário.`,
            position: "top",
            visibilityTime: 4500,
          });

          setTimeout(() => {
            router.back();
          }, 1500);
          return;
        }

        let formattedHistory: HistoryItem[] = [];
        if (hasHistory) {
          formattedHistory = rawHistory.map((mov: any) => {
            const dateIn = mov.Date_IN || mov.date_in;
            const dateOut = mov.Date_OUT || mov.date_out;
            let tipo = "Desconhecido";
            let dataMov = "";

            if (dateIn && String(dateIn).trim() !== "") {
              tipo = "Entrada";
              dataMov = dateIn;
            } else if (dateOut && String(dateOut).trim() !== "") {
              tipo = "Saída";
              dataMov = dateOut;
            } else if (mov.type) {
              tipo = mov.type;
              dataMov = mov.date;
            }

            return {
              tipo,
              data: dataMov,
              qtd: mov.Quantity || mov.qtd || mov.qty || 1,
              storage: mov.Storage || mov.storage || "",
            };
          });
        }

        const fullData: SetInfo = {
          set_id: localData.number,
          name: localData.name,
          year: localData.year,
          theme: localData.theme,
          subtheme: localData.subtheme,
          image_url: localData.image_url,
          location: cloudInfo.Storage || cloudInfo.location || "",
          history: formattedHistory,
          stock: cloudInfo.stock !== undefined ? cloudInfo.stock : 0,
        };

        setSetInfo(fullData);
        setLoading(false);

        if (fullData.stock === 0) Vibration.vibrate(400);
      } catch (error) {
        console.error("Erro no fetch detalhes:", error);
        Toast.show({
          type: "error",
          text1: "Erro de Ligação",
          text2: "Não foi possível validar o inventário na nuvem.",
          position: "top",
        });
        setTimeout(() => router.back(), 2000);
      }
    }

    fetchData();
  }, [localData, user, isStale, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const normalizedDateString = dateString.replace(" ", "T");
    const d = new Date(normalizedDateString);
    if (isNaN(d.getTime())) return dateString.substring(0, 16);
    return (
      d.toLocaleDateString("pt-PT") +
      " " +
      d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getLastLocation = () => {
    if (
      setInfo?.history &&
      Array.isArray(setInfo.history) &&
      setInfo.history.length > 0
    ) {
      const lastMove = setInfo.history.find(
        (m) => m.storage && m.storage.trim() !== "" && m.storage !== "-",
      );
      if (lastMove) return lastMove.storage;
    }
    if (setInfo?.location && setInfo.location !== "Não definido") {
      const locations = String(setInfo.location).split(",");
      return locations[locations.length - 1].trim();
    }
    return "Sem localização registada";
  };

  // Ecrã de Loading com Skeletons
  if (loading || !setInfo || isStale) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <View style={styles.contentAdjusted}>
          <SkeletonSetCard />

          <View style={styles.section}>
            <SkeletonLine
              style={{
                width: 150,
                height: 20,
                marginBottom: Theme.metrics.spacing.small,
                marginTop: Theme.metrics.spacing.medium,
              }}
            />
            <SkeletonLine
              style={{
                width: "100%",
                height: 50,
                borderRadius: Theme.metrics.radius.large,
              }}
            />
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <SkeletonLine
              style={{
                width: 120,
                height: 20,
                marginBottom: Theme.metrics.spacing.small,
                marginTop: Theme.metrics.spacing.medium,
              }}
            />
            {[1, 2, 3].map((key) => (
              <SkeletonLine
                key={key}
                style={{
                  width: "100%",
                  height: 70,
                  marginBottom: Theme.metrics.spacing.small,
                  borderRadius: Theme.metrics.radius.large,
                }}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const finalLocation = getLastLocation();
  const displayImage = setInfo.image_url
    ? String(setInfo.image_url)
    : `https://images.brickset.com/sets/images/${setInfo.set_id}-1.jpg`;

  // Renderização principal do Ecrã de Detalhes
  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.contentAdjusted}>
        <SetCard
          setId={setInfo.set_id}
          name={setInfo.name}
          theme={setInfo.theme}
          subtheme={setInfo.subtheme}
          year={setInfo.year}
          imageUrl={displayImage}
          currentStock={setInfo.stock}
        />

        <View style={styles.section}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: Theme.metrics.spacing.small,
            }}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={Theme.colors.light.text}
              style={{ marginRight: 5, marginTop: 15 }}
            />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Localização Atual
            </Text>
          </View>
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>{finalLocation}</Text>
          </View>
        </View>

        <View style={[styles.section, { flex: 1 }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: Theme.metrics.spacing.small,
            }}
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={Theme.colors.light.text}
              style={{ marginRight: 5, marginTop: 15 }}
            />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Movimentos
            </Text>
          </View>

          <FlatList
            data={setInfo.history}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          item.tipo === "Entrada"
                            ? Theme.colors.light.success
                            : Theme.colors.light.error,
                      },
                    ]}
                  />
                  <Text style={styles.historyType}>{item.tipo}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyQty}>
                      {item.tipo === "Entrada" ? "+" : "-"}
                      {item.qtd}
                    </Text>
                    {item.storage && item.storage !== "-" && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: Theme.colors.light.textSecondary,
                        }}
                      >
                        {item.storage}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.historyDate}>
                    {formatDate(item.data)}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Sem histórico recente.</Text>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
} // <- ESTA ERA A CHAVETA QUE FALTAVA!

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.light.background,
  },
  contentAdjusted: {
    flex: 1,
    paddingHorizontal: Theme.metrics.spacing.medium,
    paddingTop: Theme.metrics.spacing.small,
  },
  section: {
    marginBottom: Theme.metrics.spacing.medium,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginTop: Theme.metrics.spacing.medium,
    marginBottom: Theme.metrics.spacing.small,
  },
  locationBox: {
    backgroundColor: Theme.colors.light.cardBackground,
    padding: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    justifyContent: "center",
  },
  locationText: {
    fontSize: 16,
    color: Theme.colors.light.text,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.light.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    marginBottom: Theme.metrics.spacing.small,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.light.border,
    ...Theme.shadows.small,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Theme.metrics.radius.round,
    marginRight: Theme.metrics.spacing.small,
  },
  historyType: {
    fontSize: 15,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  historyQty: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  historyDate: {
    fontSize: 11,
    color: Theme.colors.light.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: Theme.colors.light.textSecondary,
    marginTop: Theme.metrics.spacing.medium,
  },
});
