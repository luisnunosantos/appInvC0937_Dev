import { Tabs } from "expo-router";
import React from "react";
import Theme from "../../constants"; // Importamos o nosso Design System

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // ESTA LINHA É A MAIS IMPORTANTE:
        headerShown: false,

        // Atualizado para usar o Amarelo Lego global
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarStyle: { display: "none" }, // Mantém escondido se não usares ícones em baixo
      }}
    >
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
