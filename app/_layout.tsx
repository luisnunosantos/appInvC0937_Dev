// app/_layout.tsx

import { DrawerToggleButton } from "@react-navigation/drawer";
import { ErrorBoundaryProps } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import CustomDrawerContent from "../components/CustomDrawer";
import { toastConfig } from "../components/ToastConfig";
import Theme from "../constants";
import { AuthProvider } from "../context/AuthContext";
import { setupDatabase } from "../services/database";
import Logger from "../services/logger";

export default function RootLayout() {
  useEffect(() => {
    const initDB = async () => {
      try {
        await setupDatabase();
      } catch (error) {
        Logger.logError(error, "SetupDatabase_RootLayout");
        console.error("Erro ao inicializar BD:", error);
      }
    };
    initDB();
  }, []);

  return (
    <>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
              headerShown: true,
              headerTitleStyle: { fontWeight: "bold", fontSize: 22 },
              headerTintColor: Theme.colors.light.text,
              headerStyle: { backgroundColor: Theme.colors.primary },
              headerLeft: (props) => (
                <DrawerToggleButton
                  {...props}
                  tintColor={Theme.colors.light.text}
                />
              ),
            }}
          >
            <Drawer.Screen
              name="(tabs)"
              options={{ title: "Menu", drawerLabel: "Home" }}
            />
            <Drawer.Screen
              name="entrada/index"
              options={{
                title: "Entrada",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="saida/index"
              options={{ title: "Saída", drawerItemStyle: { display: "none" } }}
            />
            <Drawer.Screen
              name="consulta/index"
              options={{
                title: "Consultar",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="lote/index"
              options={{
                title: "Modo Lote",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="entrada/confirmar"
              options={{
                title: "Confirmar Entrada",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="saida/confirmar"
              options={{
                title: "Confirmar Saída",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="consulta/detalhes"
              options={{
                title: "Detalhes do Set",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="scanner"
              options={{
                title: "Scanner",
                drawerItemStyle: { display: "none" },
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="extras/download-db"
              options={{
                title: "Sincronizar BD",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="extras/brickset"
              options={{
                title: "Brickset",
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="extras/consultas-avancadas"
              options={{
                drawerLabel: "Consultas Avançadas",
                title: "Consultas Avançadas",
              }}
            />
            <Drawer.Screen
              name="inventario/index"
              options={{
                title: "Modo Inventário",
                drawerLabel: "Modo Inventário",
              }}
            />
            <Drawer.Screen
              name="inventario/inventarioscan"
              options={{
                title: "Registo de Inventário",
                drawerItemStyle: { display: "none" },
              }}
            />
          </Drawer>
        </GestureHandlerRootView>
      </AuthProvider>
      <Toast config={toastConfig} />
    </>
  );
}

// Componente de UI para quando a app crashar
export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    Logger.logError(props.error, "FATAL_ERROR_BOUNDARY");
  }, [props.error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ops! Algo correu mal.</Text>
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{props.error.message}</Text>
      </View>

      <TouchableOpacity
        onPress={() => Logger.sendLogsByEmail()}
        style={styles.mainButton}
      >
        <Text style={styles.buttonText}>Enviar Relatório por E-mail</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={props.retry} style={{ marginTop: 20 }}>
        <Text style={styles.retryText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: Theme.colors.light.text,
  },
  errorBox: {
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    marginBottom: 30,
    borderColor: Theme.colors.light.border,
    borderWidth: 1,
  },
  errorText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: Theme.colors.light.error,
  },
  mainButton: {
    backgroundColor: Theme.colors.black,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 4,
    shadowColor: Theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: Theme.colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  retryText: {
    color: Theme.colors.light.text,
    textDecorationLine: "underline",
    fontSize: 15,
  },
});
