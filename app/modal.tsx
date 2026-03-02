// app/modal.tsx

import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Theme from "../constants";
export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Este é um modal</Text>

      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Voltar ao Ecrã Inicial</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // Usar as tuas cores e espaçamentos
    backgroundColor: Theme.colors.light.background,
    padding: Theme.metrics.spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.light.text,
    marginBottom: Theme.metrics.spacing.medium,
  },
  link: {
    marginTop: Theme.metrics.spacing.medium,
    paddingVertical: Theme.metrics.spacing.base,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.black, // Texto escuro
    textDecorationLine: "underline", // Para parecer um link clicável
  },
});
