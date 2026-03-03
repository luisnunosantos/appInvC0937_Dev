import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useKeepAwake } from "expo-keep-awake";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Nossos Componentes e Constantes
import KeyButton from "../../components/KeyButton";
import Theme from "../../constants";
import {
  getUniqueSubthemes,
  getUniqueThemes,
  performAdvancedSearch,
} from "../../services/database";

export default function ConsultasAvancadas() {
  useKeepAwake();

  // Filtros Texto
  const [theme, setTheme] = useState("");
  const [subtheme, setSubtheme] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // Filtros de Data
  const [dateMode, setDateMode] = useState<"IN" | "OUT">("IN");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // UI States
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<"start" | "end">(
    "start",
  );

  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [availableSubthemes, setAvailableSubthemes] = useState<string[]>([]);

  useEffect(() => {
    const loadThemes = async () => setAvailableThemes(getUniqueThemes());
    loadThemes();
  }, []);

  useEffect(() => {
    const loadSubthemes = async () =>
      setAvailableSubthemes(getUniqueSubthemes(theme));
    loadSubthemes();
  }, [theme]);

  const handleSearch = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      const response = await performAdvancedSearch({
        theme,
        subtheme,
        origin,
        destination,
        dateMode,
        dateStart,
        dateEnd,
      });

      if (response && response.success) {
        setResults(response.data);
        if (response.data.length === 0) {
          Toast.show({
            type: "info",
            text1: "Sem resultados",
            text2: "Não foram encontrados registos para estes critérios.",
          });
        } else {
          setShowResultsModal(true);
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível carregar os resultados.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Falha de Ligação",
        text2: "Não foi possível comunicar com o servidor.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setTheme("");
    setSubtheme("");
    setOrigin("");
    setDestination("");
    setDateStart("");
    setDateEnd("");
    setDateMode("IN");
  };

  // --------------------------------------------------------------------------
  // CALENDÁRIO
  // --------------------------------------------------------------------------
  const openDatePicker = (target: "start" | "end") => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed" || !selectedDate) return;

    const formattedDate = selectedDate.toISOString().split("T")[0];
    if (datePickerTarget === "start") {
      setDateStart(formattedDate);
    } else {
      setDateEnd(formattedDate);
    }
  };

  // --------------------------------------------------------------------------
  // COMPONENTES UI
  // --------------------------------------------------------------------------
  const renderAutocompleteInput = (
    label: string,
    value: string,
    icon: any,
    setValue: (t: string) => void,
    placeholder: string,
    availableOptions: string[],
  ) => {
    const showSuggestions =
      value.length > 0 &&
      !availableOptions.some(
        (opt) => opt.toLowerCase() === value.toLowerCase(),
      );
    const filteredOptions = availableOptions
      .filter((opt) => opt.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 4);

    return (
      <View
        style={{
          marginBottom: Theme.metrics.spacing.medium,
          zIndex: showSuggestions ? 10 : 1,
        }}
      >
        <View style={styles.inputContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={Theme.colors.light.textSecondary}
            style={styles.inputIcon}
          />
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor={Theme.colors.light.textSecondary}
              autoCapitalize="words"
            />
          </View>
        </View>
        {showSuggestions && filteredOptions.length > 0 && (
          <View style={styles.suggestionsCard}>
            {filteredOptions.map((opt, index) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.suggestionItem,
                  index < filteredOptions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => setValue(opt)}
              >
                <Text style={styles.suggestionText}>{opt}</Text>
                <Ionicons
                  name="arrow-up-left"
                  size={16}
                  color={Theme.colors.light.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTextInput = (
    label: string,
    value: string,
    icon: any,
    onChangeText: (t: string) => void,
    placeholder: string,
  ) => (
    <View
      style={[
        styles.inputContainer,
        { marginBottom: Theme.metrics.spacing.medium },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={Theme.colors.light.textSecondary}
        style={styles.inputIcon}
      />
      <View style={styles.inputContent}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.light.textSecondary}
        />
      </View>
    </View>
  );

  const renderDateButton = (
    label: string,
    value: string,
    target: "start" | "end",
  ) => (
    <TouchableOpacity
      style={[styles.inputContainer, styles.dateBox]}
      onPress={() => openDatePicker(target)}
      activeOpacity={0.7}
    >
      <View style={styles.dateBoxContent}>
        <Text style={styles.inputLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[
            styles.textInput,
            { fontSize: 14 },
            !value && { color: Theme.colors.light.textSecondary },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value ? value.replace(/-/g, "/") : "Selecionar"}
        </Text>
      </View>

      {/* Ícone à direita: Limpar (se tiver data) ou Calendário (se vazio) */}
      {value ? (
        <TouchableOpacity
          onPress={() =>
            target === "start" ? setDateStart("") : setDateEnd("")
          }
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name="close-circle"
            size={22}
            color={Theme.colors.light.textSecondary}
          />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="calendar"
          size={20}
          color={Theme.colors.light.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  const renderResultItem = ({ item }: { item: any }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultSetNumber}>{item.setNumber}</Text>
        <Text style={styles.resultQty}>Qtd: {item.qty}</Text>
      </View>
      <Text style={styles.resultName}>{item.name}</Text>
      <Text style={styles.resultTheme}>
        {item.theme} {item.subtheme ? `> ${item.subtheme}` : ""}
      </Text>
      <View style={styles.resultDetailsRow}>
        <Ionicons
          name="location-outline"
          size={16}
          color={Theme.colors.light.textSecondary}
        />
        <Text style={styles.resultDetailText}>
          Origem: {item.origin || "-"}
        </Text>
      </View>
      <View style={styles.resultDetailsRow}>
        <Ionicons
          name="cube-outline"
          size={16}
          color={Theme.colors.light.textSecondary}
        />
        <Text style={styles.resultDetailText}>
          Armazém: {item.destination || item.storage || "-"}
        </Text>
      </View>
      {(item.dateIn || item.dateOut) && (
        <View style={styles.resultDates}>
          {item.dateIn && (
            <Text style={styles.dateInText}>
              ↓ Entrou: {String(item.dateIn).substring(0, 10)}
            </Text>
          )}
          {item.dateOut && (
            <Text style={styles.dateOutText}>
              ↑ Saiu: {String(item.dateOut).substring(0, 10)}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Consultas Avançadas" }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filtersHeader}>
            <Text style={styles.sectionTitle}>Critérios de Pesquisa</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>

          {renderAutocompleteInput(
            "Tema",
            theme,
            "color-palette-outline",
            setTheme,
            "Escreve um tema...",
            availableThemes,
          )}
          {renderAutocompleteInput(
            "Subtema",
            subtheme,
            "layers-outline",
            setSubtheme,
            "Escreve um subtema...",
            availableSubthemes,
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderTextInput(
                "Origem",
                origin,
                "business-outline",
                setOrigin,
                "Ex: Loja",
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {renderTextInput(
                "Destino",
                destination,
                "archive-outline",
                setDestination,
                "Ex: Prateleira",
              )}
            </View>
          </View>

          {/* SECÇÃO DE DATA */}
          <View style={styles.dateSectionBox}>
            <Text style={styles.dateSectionTitle}>
              Filtrar por Período de Movimento
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  dateMode === "IN" && styles.toggleActive,
                ]}
                onPress={() => setDateMode("IN")}
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={
                    dateMode === "IN"
                      ? Theme.colors.black
                      : Theme.colors.light.textSecondary
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.toggleText,
                    dateMode === "IN" && styles.toggleTextActive,
                  ]}
                >
                  Entradas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  dateMode === "OUT" && styles.toggleActive,
                ]}
                onPress={() => setDateMode("OUT")}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={
                    dateMode === "OUT"
                      ? Theme.colors.black
                      : Theme.colors.light.textSecondary
                  }
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.toggleText,
                    dateMode === "OUT" && styles.toggleTextActive,
                  ]}
                >
                  Saídas
                </Text>
              </TouchableOpacity>
            </View>

            {/* CAIXAS DE DATA (IGUAIS) */}
            <View style={styles.dateRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                {renderDateButton("Data Inicial", dateStart, "start")}
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                {renderDateButton("Data Final", dateEnd, "end")}
              </View>
            </View>
          </View>

          {/* O NOSSO KEYBUTTON */}
          <View style={{ marginTop: Theme.metrics.spacing.medium }}>
            <KeyButton
              title="Pesquisar no Sheets"
              onPress={handleSearch}
              loading={isLoading}
              loadingText="A pesquisar..."
              icon={
                !isLoading ? (
                  <Ionicons
                    name="search"
                    size={24}
                    color={Theme.colors.black}
                  />
                ) : undefined
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerTarget === "start"
              ? dateStart
                ? new Date(dateStart)
                : new Date()
              : dateEnd
                ? new Date(dateEnd)
                : new Date()
          }
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Modal de Resultados */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resultados ({results.length})</Text>
            <TouchableOpacity
              onPress={() => setShowResultsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Theme.colors.black} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.setNumber}-${index}`}
            renderItem={renderResultItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.light.background },
  formContent: { padding: Theme.metrics.spacing.medium, paddingBottom: 40 },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.metrics.spacing.large,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  clearText: {
    color: Theme.colors.light.error,
    fontSize: 14,
    fontWeight: "600",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },

  inputContainer: {
    backgroundColor: Theme.colors.light.cardBackground,
    borderRadius: Theme.metrics.radius.large,
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.metrics.spacing.medium,
    ...Theme.shadows.small,
  },
  inputIcon: { marginRight: Theme.metrics.spacing.medium },
  inputContent: { flex: 1 },
  inputLabel: {
    fontSize: 12,
    color: Theme.colors.light.textSecondary,
    marginBottom: 4,
  },
  textInput: { fontSize: 16, color: Theme.colors.light.text, padding: 0 },

  suggestionsCard: {
    backgroundColor: Theme.colors.light.cardBackground,
    marginHorizontal: Theme.metrics.spacing.small,
    borderBottomLeftRadius: Theme.metrics.radius.large,
    borderBottomRightRadius: Theme.metrics.radius.large,
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 100,
    ...Theme.shadows.default,
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Theme.metrics.spacing.medium,
    paddingHorizontal: Theme.metrics.spacing.medium,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.light.border,
  },
  suggestionText: {
    fontSize: 15,
    color: Theme.colors.light.text,
    fontWeight: "500",
  },

  dateSectionBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    marginTop: Theme.metrics.spacing.small,
    marginBottom: Theme.metrics.spacing.medium,
  },
  dateSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: Theme.colors.light.textSecondary,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Theme.colors.light.border,
    borderRadius: Theme.metrics.radius.large,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Theme.metrics.radius.base,
  },
  toggleActive: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.small,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.light.textSecondary,
  },
  toggleTextActive: { color: Theme.colors.black },

  // NOVOS ESTILOS PARA AS CAIXAS DE DATA SIMÉTRICAS
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Theme.metrics.spacing.medium,
    marginBottom: Theme.metrics.spacing.small,
  },
  dateBox: {
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 65, // <-- O SEGREDO: Forçamos a altura
  },
  dateBoxContent: {
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },

  modalContainer: { flex: 1, backgroundColor: Theme.colors.light.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    padding: Theme.metrics.spacing.medium,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: Theme.colors.black },
  closeButton: { padding: 4 },
  listContent: { padding: Theme.metrics.spacing.medium, paddingBottom: 40 },
  resultCard: {
    backgroundColor: Theme.colors.light.cardBackground,
    padding: Theme.metrics.spacing.medium,
    borderRadius: Theme.metrics.radius.large,
    marginBottom: Theme.metrics.spacing.medium,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    ...Theme.shadows.small,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.metrics.spacing.small,
  },
  resultSetNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.light.text,
  },
  resultQty: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.light.textSecondary,
  },
  resultName: { fontSize: 15, color: Theme.colors.light.text, marginBottom: 4 },
  resultTheme: {
    fontSize: 13,
    color: Theme.colors.light.textSecondary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  resultDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  resultDetailText: {
    fontSize: 13,
    color: Theme.colors.light.text,
    marginLeft: 6,
  },
  resultDates: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.light.border,
  },
  dateInText: { fontSize: 12, color: "#4CAF50", marginBottom: 2 },
  dateOutText: { fontSize: 12, color: Theme.colors.light.error },
});
