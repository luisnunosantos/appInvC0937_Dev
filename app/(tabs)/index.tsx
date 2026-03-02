import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "../../constants";
import { useAuth } from "../../context/AuthContext";

const MENU_ITEMS = [
  {
    id: "1",
    title: "Entrada",
    image: Theme.images.entrada,
    route: "/entrada",
    requiresAuth: true,
  },
  {
    id: "2",
    title: "Saída",
    image: Theme.images.saida,
    route: "/saida",
    requiresAuth: true,
  },
  {
    id: "3",
    title: "Consultar",
    image: Theme.images.consulta,
    route: "/consulta",
    requiresAuth: false,
  },
  {
    id: "4",
    title: "Modo Lote",
    image: Theme.images.scan,
    route: "/lote",
    requiresAuth: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handlePress = (item: (typeof MENU_ITEMS)[0]) => {
    // LÓGICA DE BLOQUEIO
    // Se requer autenticação E não tem user, bloqueia.
    // Como "Consultar" agora é false, passa direto.
    if (item.requiresAuth && !user) {
      Alert.alert(
        "Acesso Restrito",
        "Tens de fazer login com a conta Google primeiro.\n\nAbre o menu lateral para entrar.",
      );
      return;
    }

    router.push(item.route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={MENU_ITEMS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isLocked = item.requiresAuth && !user;

            return (
              <TouchableOpacity
                style={[styles.card, isLocked && styles.cardLocked]}
                onPress={() => handlePress(item)}
                activeOpacity={isLocked ? 0.9 : 0.7}
              >
                <View style={[styles.imgBox, isLocked && { opacity: 0.5 }]}>
                  <Image
                    source={item.image}
                    style={styles.img}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    isLocked && { color: Theme.colors.light.textSecondary },
                  ]}
                >
                  {item.title}
                </Text>

                {isLocked && (
                  <View style={styles.lockIcon}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={Theme.colors.light.textSecondary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Usa o fundo global para combinar com todos os outros ecrãs
    backgroundColor: Theme.colors.light.background,
  },
  list: {
    padding: Theme.metrics.spacing.small,
    paddingTop: Theme.metrics.spacing.small,
  },
  card: {
    flex: 1,
    margin: Theme.metrics.spacing.small,
    height: 170,
    borderWidth: 1,
    borderColor: Theme.colors.light.border,
    borderRadius: Theme.metrics.radius.xlarge, // Mesma curvatura do SetCard!
    padding: Theme.metrics.spacing.medium,
    backgroundColor: Theme.colors.light.cardBackground,
    ...Theme.shadows.default, // Sombra padrão suave
    justifyContent: "center",
  },
  cardLocked: {
    // Um fundo ligeiramente mais escuro para indicar bloqueio
    backgroundColor: Theme.colors.light.background,
    borderColor: Theme.colors.light.border,
    // Reduzir sombra para parecer inativo
    ...Theme.shadows.small,
  },
  imgBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    width: "80%",
    height: "80%",
  },
  label: {
    textAlign: "center",
    marginTop: Theme.metrics.spacing.small,
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  lockIcon: {
    position: "absolute",
    top: Theme.metrics.spacing.medium,
    right: Theme.metrics.spacing.medium,
  },
});
