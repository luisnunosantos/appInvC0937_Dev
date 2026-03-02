// components/CustomDrawer.tsx

import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "../config/constants";
import Theme from "../constants";
import changelog from "../constants/changelog.json";
import { useAuth } from "../context/AuthContext";
import Logger from "../services/logger";

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, signIn, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estado para controlar o Modal "Sobre a Aplicação"
  const [showAboutModal, setShowAboutModal] = useState(false);

  useKeepAwake();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      await signIn(response);
    } catch (error: any) {
      console.error("Erro Login UI:", error);
      Logger.logError(error, "Login_UI");
      Alert.alert("Erro", "Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Terminar Sessão", "Tens a certeza que queres sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleExitApp = () => {
    Alert.alert("Fechar", "Desejas fechar a aplicação?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", onPress: () => BackHandler.exitApp() },
    ]);
  };

  const handleProtectedAction = (route: string) => {
    if (!user) {
      Alert.alert(
        "Acesso Restrito",
        "Precisas de fazer login para aceder a esta funcionalidade.",
      );
      return;
    }
    router.push(route as any);
  };

  const handleSendLogs = async () => {
    props.navigation.closeDrawer();
    await Logger.sendLogsByEmail();
  };

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flexGrow: 1, // Permite fazer scroll e empurra o footer para baixo
          backgroundColor: Theme.colors.light.cardBackground,
        }}
      >
        {/* 1. HEADER (Perfil) */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={Theme.colors.primary} />
            )}
          </View>
          <Text style={styles.userName}>{user?.name || "Visitante"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "Faz login para aceder"}
          </Text>
        </View>

        <View style={styles.menuList}>
          {/* 2. INÍCIO */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons
              name="home-outline"
              size={22}
              color={Theme.colors.light.text}
            />
            <Text style={styles.menuText}>Início</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* 3. SECÇÃO GESTÃO DA BASE DE DADOS */}
          <Text style={styles.sectionTitle}>Gestão da Base de Dados</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleProtectedAction("/extras/download-db")}
          >
            <Ionicons
              name="cloud-download-outline"
              size={22}
              color={user ? "#2196F3" : Theme.colors.light.textSecondary}
            />
            <Text style={[styles.menuText, !user && styles.disabledText]}>
              Offline - Transferir Base de Dados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleProtectedAction("/extras/brickset")}
          >
            <Ionicons
              name="refresh-circle-outline"
              size={22}
              color={
                user
                  ? Theme.colors.light.success
                  : Theme.colors.light.textSecondary
              }
            />
            <Text style={[styles.menuText, !user && styles.disabledText]}>
              Atualizar Catálogos de Sets
            </Text>
          </TouchableOpacity>

          {/* 4. SECÇÃO EXTRAS */}
          <Text style={styles.sectionTitle}>Extras</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleProtectedAction("/inventario")}
          >
            <Ionicons
              name="barcode-outline"
              size={22}
              color={user ? "#FF5722" : Theme.colors.light.textSecondary}
            />
            <Text style={[styles.menuText, !user && styles.disabledText]}>
              Modo Inventário
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleProtectedAction("/extras/consultas-avancadas")}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={user ? "#4CAF50" : Theme.colors.light.textSecondary}
            />
            <Text style={[styles.menuText, !user && styles.disabledText]}>
              Consultas Avançadas
            </Text>
          </TouchableOpacity>

          {/* 5. SECÇÃO SUPORTE */}
          <Text style={styles.sectionTitle}>Suporte</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleSendLogs}>
            <Ionicons name="bug-outline" size={22} color="#f0ad4e" />
            <Text style={styles.menuText}>Reportar Problema (Logs)</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          <View style={styles.separator} />

          {/* 6. BOTÕES DE SISTEMA */}
          {!user ? (
            <TouchableOpacity
              style={[styles.menuItem, styles.loginButton]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.black} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={22}
                    color={Theme.colors.black}
                  />
                  <Text
                    style={[styles.menuText, { color: Theme.colors.black }]}
                  >
                    Iniciar Sessão
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons
                name="log-out-outline"
                size={22}
                color={Theme.colors.light.error}
              />
              <Text
                style={[styles.menuText, { color: Theme.colors.light.error }]}
              >
                Terminar Sessão
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleExitApp}>
            <Ionicons
              name="power-outline"
              size={22}
              color={Theme.colors.light.text}
            />
            <Text style={styles.menuText}>Fechar Aplicação</Text>
          </TouchableOpacity>
        </View>

        {/* 7. RODAPÉ CLICÁVEL */}
        <TouchableOpacity
          style={styles.footer}
          activeOpacity={0.6}
          onPress={() => setShowAboutModal(true)}
        >
          {/* Lê automaticamente a versão do primeiro item (o mais recente) do json! */}
          <Text style={styles.footerText}>
            Lego Inventory {changelog[0].version}
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* MODAL DE HISTÓRICO DE VERSÕES */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sobre a Aplicação</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={Theme.colors.light.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.historyContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* MAGIA ACONTECE AQUI: Lemos o JSON e geramos a lista automaticamente */}
              {changelog.map((release, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.versionTitle}>
                    {release.version} {release.isCurrent ? "(Atual)" : ""}
                  </Text>
                  <Text style={styles.versionDesc}>
                    {release.changes.map((change) => `• ${change}`).join("\n")}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={Theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.developerText}>
                Desenvolvido para Gestão Lego
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Theme.metrics.spacing.large,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    paddingTop: 50,
    marginBottom: Theme.metrics.spacing.small,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: Theme.metrics.radius.round,
    backgroundColor: Theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.metrics.spacing.small,
    borderWidth: 2,
    borderColor: Theme.colors.white,
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: Theme.metrics.radius.round,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.black,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
    marginTop: 2,
  },

  menuList: {
    paddingHorizontal: Theme.metrics.spacing.base,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: Theme.colors.light.textSecondary,
    marginTop: Theme.metrics.spacing.medium,
    marginBottom: Theme.metrics.spacing.tiny,
    marginLeft: Theme.metrics.spacing.small,
    textTransform: "uppercase",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: Theme.metrics.spacing.small,
    borderRadius: Theme.metrics.radius.base,
    marginVertical: 2,
  },
  menuText: {
    marginLeft: Theme.metrics.spacing.medium,
    fontSize: 15,
    color: Theme.colors.light.text,
    fontWeight: "500",
  },
  disabledText: {
    color: Theme.colors.light.textSecondary,
  },

  loginButton: {
    backgroundColor: Theme.colors.primary,
    marginTop: Theme.metrics.spacing.small,
    opacity: 0.85,
  },

  separator: {
    height: 1,
    backgroundColor: Theme.colors.light.border,
    marginVertical: Theme.metrics.spacing.small,
  },

  footer: {
    padding: Theme.metrics.spacing.large,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.light.border,
    alignItems: "center",
  },
  footerText: {
    color: Theme.colors.light.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline", // Dá indicação visual de que é clicável
  },

  // --- ESTILOS DO MODAL "SOBRE" ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.metrics.spacing.large,
  },
  modalContent: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    padding: Theme.metrics.spacing.large,
    width: "100%",
    maxHeight: "80%", // Previne que cresça fora do ecrã se tiveres muitas versões no futuro
    ...Theme.shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.metrics.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.light.border,
    paddingBottom: Theme.metrics.spacing.small,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  historyContainer: {
    marginTop: Theme.metrics.spacing.small,
  },
  historyItem: {
    marginBottom: Theme.metrics.spacing.medium,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
    paddingLeft: Theme.metrics.spacing.medium,
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginBottom: 6,
  },
  versionDesc: {
    fontSize: 14,
    color: Theme.colors.light.textSecondary,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.metrics.spacing.large,
    paddingTop: Theme.metrics.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.light.border,
  },
  developerText: {
    fontSize: 13,
    color: Theme.colors.light.textSecondary,
    fontStyle: "italic",
    fontWeight: "500",
  },
});
