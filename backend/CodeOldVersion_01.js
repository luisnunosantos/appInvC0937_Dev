// DateTime: 20260219_1534
// Antes Modo Inventário

// =========================
// FUNÇÃO DE BRICKET - Sync
// =========================

function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
    .createMenu("Brickset")
    .addItem("Update Sets List", "importBricksetSets")
    .addToUi();
}

function importBricksetSets() {
  var mySS = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = mySS.getSheetByName("DB_Lego");
  var csvUrl = "https://brickset.com/exportscripts/sets/all";
  var csvContent = UrlFetchApp.fetch(csvUrl).getContentText();
  var csvData = Utilities.parseCsv(csvContent);
  var updated = Utilities.formatDate(new Date(), "GMT", "dd-MM-YYYY'@'HH:mm");

  mySS
    .getSheetByName("UpdateDate")
    .getRange(2, 1)
    .setValue("Em actualização...");

  /** 1. Filter the data in RAM. We map through the rows and return only the specific column indexes we want
   */

  var filteredData = csvData.map(function (row) {
    return [
      row[0], // Col A
      row[1], // Col B
      row[3], // Col D
      row[5], // Col F
      row[7], // Col H
      row[8], // Col I
      row[24], // Col Y
      row[25], // Col Z
    ];
  });

  /**  2. Clear ONLY the data (preserves bold, colors, borders)   *
   */

  sheet.clearContents();

  /** 3. Paste the clean, filtered data
   */

  sheet
    .getRange(1, 1, filteredData.length, filteredData[0].length)
    .setValues(filteredData);

  mySS.getSheetByName("UpdateDate").getRange(2, 1).setValue(updated);

  // NOVA LINHA: Devolve o número de sets atualizados
  return filteredData.length;
}

/** Ligação a App Armazem C0937 **/

const SHEETS = {
  DB: "DB_Lego",
  MOVEMENTS: "InventoryMovements",
};

// ===========================================================================
// FUNÇÃO DE SQLite : Retorna a base de dados inteira para sincronização local
// ===========================================================================

function getFullDB() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.DB);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove cabeçalhos

  // Função auxiliar para encontrar colunas ignorando maiúsculas
  const getCol = (name) => {
    return headers.findIndex(
      (h) => h.toString().trim().toLowerCase() === name.toLowerCase(),
    );
  };

  // Mapear os índices exatos
  const idxNum = getCol("Number");
  const idxName = getCol("SetName");
  const idxYear = getCol("YearFrom");
  const idxTheme = getCol("Theme");
  const idxSubTheme = getCol("Subtheme"); // Agora apanha "SubTheme" ou "Subtheme"
  const idxEan = getCol("EAN");

  // Formatar os dados
  const formatted = data.map((row) => ({
    n: idxNum !== -1 ? row[idxNum] : "",
    s: idxName !== -1 ? row[idxName] : "",
    y: idxYear !== -1 ? row[idxYear] : "",
    t: idxTheme !== -1 ? row[idxTheme] : "",

    // CORREÇÃO AQUI: Se a célula estiver vazia, manda vazio ("") em vez de null/undefined
    st: idxSubTheme !== -1 && row[idxSubTheme] ? row[idxSubTheme] : "",

    e: idxEan !== -1 ? row[idxEan] : "",
  }));

  return createJsonResponse(formatted);
}

// ================================================
// FUNÇÃO DE LEITURA (GET): VERSÃO ULTRA RÁPIDA
// ================================================

function doGet(e) {
  const action = e.parameter.action;
  const setId = e.parameter.setId;

  // --- MODO: ATUALIZAR CATÁLOGO BRICKSET ---
  if (action === "updateBrickset") {
    try {
      // Chama a tua função e guarda o número de linhas processadas
      const linhas = importBricksetSets();
      // Devolve o sucesso à app
      return createJsonResponse({ result: "success", count: linhas });
    } catch (error) {
      return createJsonResponse({ result: "error", message: error.toString() });
    }
  }

  // --- MODO: SINCRONIZAÇÃO (Download da BD) ---
  if (action === "sync") {
    return getFullDB();
  }

  // --- MODO: SINCRONIZAÇÃO (Download da BD completa para o SQLite) ---
  if (action === "sync") {
    return getFullDB();
  }

  // --- MODO: VERIFICAÇÃO DE STOCK (Rápida) ---
  if (!setId) return createJsonResponse({ error: "ID em falta." });

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // NOTA: Saltamos a leitura da 'DB_Lego' porque a App já tem esses dados!
  // Vamos direto calcular o Stock.

  const movSheet = ss.getSheetByName(SHEETS.MOVEMENTS);
  const lastRow = movSheet.getLastRow();

  let totalStock = 0;
  let locationsSet = new Set();
  let history = [];

  // Se houver movimentos registados...
  if (lastRow > 1) {
    // 1. Buscar cabeçalhos para saber onde estão as colunas
    const headers = movSheet
      .getRange(1, 1, 1, movSheet.getLastColumn())
      .getValues()[0];
    const hMap = {};
    headers.forEach((h, i) => (hMap[h.toString().trim().toUpperCase()] = i));

    // 2. Buscar todos os movimentos de uma vez
    const movData = movSheet
      .getRange(2, 1, lastRow - 1, movSheet.getLastColumn())
      .getValues();

    // 3. Loop do fim para o início (para apanhar os mais recentes primeiro)
    for (let i = movData.length - 1; i >= 0; i--) {
      const row = movData[i];

      // Compara o SetNumber (ou Barcode se necessário)
      // Convertemos para String para evitar erros entre "75192" (texto) e 75192 (número)
      if (String(row[hMap["SETNUMBER"]]) === String(setId)) {
        const dateIn = row[hMap["DATE_IN"]];
        const dateOut = row[hMap["DATE_OUT"]];

        // Verifica se é Entrada ou Saída baseando-se nas datas
        let isEntrada = dateIn && String(dateIn) !== "";
        let isSaida = dateOut && String(dateOut) !== "";

        // Calcular Stock
        if (isEntrada) {
          totalStock++;
          const loc = row[hMap["STORAGE"]];
          if (loc) locationsSet.add(loc);
        } else if (isSaida) {
          totalStock--;
        }

        // Adicionar ao Histórico (Max 5 itens)
        if (history.length < 10) {
          history.push({
            date: isEntrada ? dateIn : dateOut,
            type: isEntrada ? "Entrada" : "Saída",
            storage: row[hMap["STORAGE"]] || "-",
            user: row[hMap["USER"]] || "Sistema", // <--- NOVA LINHA
            obs: isSaida ? "Saída de Stock" : "Entrada em Stock",
            qty: row[hMap["QTY"]] || 1,
          });
        }
      }
    }
  }

  // Retornamos apenas o essencial. A App junta isto com os dados do SQLite.
  return createJsonResponse({
    set_id: setId,
    stock: totalStock,
    hasHistory: history.length > 0, // Importante para as validações de "Set Inexistente"
    history: history,
    locations: Array.from(locationsSet).join(", "),
  });
}

// Mantém esta função auxiliar igual
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ================================================
// FUNÇÃO DE ESCRITA (POST): BATCH MODE (MODO LOTE)
// ================================================

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("InventoryMovements");

    // Obtém os cabeçalhos para saber onde escrever cada coluna
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    // Função auxiliar para encontrar o índice da coluna pelo nome (ignora maiúsculas)
    const getColIndex = (name) => {
      // Retorna -1 se não encontrar
      return headers.findIndex(
        (h) => h.toString().trim().toUpperCase() === name.toUpperCase(),
      );
    };

    // ==========================================
    // NOVA LÓGICA: BATCH MODE (MODO LOTE)
    // ==========================================
    if (params.action === "BATCH_MOVEMENT") {
      const items = params.items;
      const type = params.type;

      // 1. LER DADOS QUE VÊM DA APP
      const appUser = params.user || "Sem Email"; // Agora recebe o Email
      const origin = params.origin || ""; // Recebe a Origem
      const storage = params.storage || ""; // Recebe o Storage
      const obs = params.obs || ""; // Recebe Vazio (ou o que vier)

      if (!items || items.length === 0) {
        return createJsonResponse({ result: "error", message: "Lista vazia" });
      }

      const rowsToAdd = items.map((item, i) => {
        let row = new Array(headers.length).fill("");
        const now = new Date();

        const randomPart = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const uniqueID =
          "LG-" +
          (now.getTime() + i).toString().substring(4) +
          "-" +
          randomPart;

        const map = {
          ID: uniqueID,
          SetNumber: item.setNumber,
          Name: item.name,
          EAN: item.ean,
          BarCode: item.ean ? "'" + item.ean : "",
          User: appUser, // Email do utilizador
          Origin: origin, // Origem Preenchida
          Storage: storage, // Local Preenchido
          Obs: obs, // Vazio
          Qty: 1,
        };

        for (let [key, val] of Object.entries(map)) {
          let idx = getColIndex(key);
          if (idx !== -1) row[idx] = val;
        }

        let colDate = -1;
        if (type === "ENTRADA") colDate = getColIndex("Date_IN");
        if (type === "SAIDA") colDate = getColIndex("Date_OUT");

        if (colDate !== -1) row[colDate] = now;

        return row;
      });

      if (rowsToAdd.length > 0) {
        sheet
          .getRange(
            sheet.getLastRow() + 1,
            1,
            rowsToAdd.length,
            rowsToAdd[0].length,
          )
          .setValues(rowsToAdd);
      }

      return createJsonResponse({ result: "success", count: rowsToAdd.length });
    }

    // ======================================================================
    // FUNÇÃO DE ESCRITA (POST): LÓGICA ANTIGA (MANTIDA PARA COMPATIBILIDADE)
    // ======================================================================

    // Ler a quantidade que vem da App (se não vier nada, assume 1)
    const qtdTotal = parseInt(params.quantity) || 1;
    let firstGeneratedID = "";

    // === CICLO PARA CRIAR UMA LINHA POR CADA UNIDADE ===
    for (let i = 0; i < qtdTotal; i++) {
      // Cria uma linha vazia com o tamanho exato dos cabeçalhos
      let newRow = new Array(headers.length).fill("");
      const now = new Date();

      // 1. GERAR ID ÚNICO
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const uniqueID =
        "LG-" + (now.getTime() + i).toString().substring(4) + "-" + randomPart;

      if (i === 0) firstGeneratedID = uniqueID;

      // 2. PREENCHER DADOS BASE
      // Mapeamos o nome da coluna no Excel -> Valor que vem da App
      const dataMap = {
        ID: uniqueID,
        SetNumber: params.set_id,
        Name: params.name,
        Year: params.year,
        Theme: params.theme,
        SubTheme: params.subtheme,
        Origin: params.origin,
        Destination: params.destination,
        Storage: params.storage,
        Obs: params.obs,
        Qty: 1, // Sempre 1 por linha física
        Status: "Active",
        User: params.user || "App_User", // Guarda o utilizadores Google
        BarCode: params.barcode ? "'" + params.barcode : "",
      };

      // 3. PREENCHER DATAS (Dependendo se é Entrada ou Saída)
      const colIn = getColIndex("Date_IN");
      const colOut = getColIndex("Date_OUT");

      // Ajuste: A app manda "tipoOperacao", verifica se bate certo
      if (
        (params.tipoOperacao === "Entrada" || params.type === "Entrada") &&
        colIn !== -1
      ) {
        newRow[colIn] = now;
      }
      if (
        (params.tipoOperacao === "Saída" || params.type === "Saída") &&
        colOut !== -1
      ) {
        newRow[colOut] = now;
      }

      // 4. PREENCHER O RESTO DAS COLUNAS
      for (let [colName, value] of Object.entries(dataMap)) {
        const idx = getColIndex(colName);
        if (idx !== -1) {
          newRow[idx] = value;
        }
      }

      // Adiciona a linha à folha
      sheet.appendRow(newRow);
    }

    return createJsonResponse({
      result: "success",
      generatedID: firstGeneratedID,
      rowsAdded: qtdTotal,
    });
  } catch (err) {
    return createJsonResponse({
      result: "error",
      message: err.toString(),
    });
  }
}

// Helper (mantém igual)
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
