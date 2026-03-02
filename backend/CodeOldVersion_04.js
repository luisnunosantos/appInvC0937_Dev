// DateTime: 20260221_1736
// Antes da pesquisas avançadas

// =========================
// FUNÇÃO DE BRICKET - Sync
// =========================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Brickset")
    .addItem("Update Sets List", "importBricksetSets")
    .addToUi();
}

function importBricksetSets() {
  let mySS = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = mySS.getSheetByName("DB_Lego");
  let csvUrl = "https://brickset.com/exportscripts/sets/all";
  let csvContent = UrlFetchApp.fetch(csvUrl).getContentText();
  let csvData = Utilities.parseCsv(csvContent);
  let updated = Utilities.formatDate(new Date(), "GMT", "dd-MM-YYYY'@'HH:mm");

  mySS
    .getSheetByName("UpdateDate")
    .getRange(2, 1)
    .setValue("Em actualização...");

  // 1. Filter the data in RAM. We map through the rows and return only the specific column indexes we want
  let filteredData = csvData.map(function (row) {
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

  // 2. Clear ONLY the data (preserves bold, colors, borders)
  sheet.clearContents();

  // 3. Paste the clean, filtered data
  sheet
    .getRange(1, 1, filteredData.length, filteredData[0].length)
    .setValues(filteredData);

  mySS.getSheetByName("UpdateDate").getRange(2, 1).setValue(updated);

  // 4. Devolve o número de sets atualizados
  return filteredData.length;
}

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

    // Se a célula estiver vazia, manda vazio ("") em vez de null/undefined
    st: idxSubTheme !== -1 && row[idxSubTheme] ? row[idxSubTheme] : "",

    e: idxEan !== -1 ? row[idxEan] : "",
  }));

  return createJsonResponse(formatted);
}

// ============================================
// FUNÇÃO DE LEITURA (GET): VERSÃO ULTRA RÁPIDA
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  const setId = e.parameter.setId;

  // Modo: Atualizar catálogo BRICKSET
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

  // Modo: Sincronização (Download da BD)
  if (action === "sync") {
    return getFullDB();
  }

  // Modo: Verificação de stock (Rápida)
  if (!setId) return createJsonResponse({ error: "ID em falta." });

  const ss = SpreadsheetApp.getActiveSpreadsheet();

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

        // Adicionar ao Histórico (Max 10 itens)
        if (history.length < 10) {
          history.push({
            date: isEntrada ? dateIn : dateOut,
            type: isEntrada ? "Entrada" : "Saída",
            storage: row[hMap["STORAGE"]] || "-",
            user: row[hMap["USER"]] || "Sistema",
            obs: isSaida ? "Saída de Stock" : "Entrada em Stock",
            qty: row[hMap["QTY"]] || 1,
          });
        }
      }
    }
  }

  return createJsonResponse({
    set_id: setId,
    stock: totalStock,
    hasHistory: history.length > 0,
    history: history,
    locations: Array.from(locationsSet).join(", "),
  });
}

// =================================================
// FUNÇÃO DE ESCRITA (POST): BATCH MODE & INVENTÁRIO
// =================================================

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ==================================================
    // LÓGICA: MODO INVENTÁRIO (GESTÃO DE FOLHAS INV_...)
    // ==================================================

    // 1. Listar Folhas de Inventário Existentes
    if (params.action === "listInventorySheets") {
      const sheets = ss.getSheets();
      let invSheets = [];
      for (let i = 0; i < sheets.length; i++) {
        let name = sheets[i].getName();
        if (name.indexOf("Inv_") === 0) {
          invSheets.push(name);
        }
      }
      // Ordenar para mostrar as mais recentes primeiro
      invSheets.sort((a, b) => b.localeCompare(a));
      return createJsonResponse({ success: true, sheets: invSheets });
    }

    // 2. Criar Nova Folha de Inventário
    if (params.action === "createInventorySheet") {
      const date = new Date();
      const sheetName =
        "Inv_" +
        Utilities.formatDate(
          date,
          Session.getScriptTimeZone(),
          "yyyyMMdd_HHmm",
        );
      let existingSheet = ss.getSheetByName(sheetName);

      if (!existingSheet) {
        let newSheet = ss.insertSheet(sheetName);
        // NOVOS CABEÇALHOS
        newSheet.appendRow([
          "ID",
          "Date_In",
          "BarCode",
          "SetNumber",
          "Name",
          "Year",
          "Theme",
          "SubTheme",
          "Qty",
          "User",
        ]);
        newSheet.getRange("A1:J1").setFontWeight("bold");
      }
      return createJsonResponse({ success: true, sheetName: sheetName });
    }

    // 3. Guardar Lote do Inventário na Folha Selecionada
    if (params.action === "saveInventoryBatch") {
      const sheetName = params.sheetName;
      const items = params.items;
      const targetSheet = ss.getSheetByName(sheetName);

      if (!targetSheet) throw new Error("Folha não encontrada: " + sheetName);

      // Converte os objetos JSON num array de arrays na ordem exata dos cabeçalhos
      const dataToAppend = items.map((item, i) => {
        const now = new Date();

        // Gerar um ID único parecido com o que tens noutras folhas
        const randomPart = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const uniqueID =
          "INV-" +
          (now.getTime() + i).toString().substring(4) +
          "-" +
          randomPart;

        return [
          uniqueID, // ID
          now, // Date_In
          item.barcode ? "'" + item.barcode : "", // BarCode (com apóstrofo para manter os zeros)
          item.setNumber, // SetNumber
          item.name, // Name
          item.year, // Year
          item.theme, // Theme
          item.subtheme, // SubTheme
          item.quantity, // Qty
          item.user, // User
        ];
      });

      if (dataToAppend.length > 0) {
        targetSheet
          .getRange(
            targetSheet.getLastRow() + 1,
            1,
            dataToAppend.length,
            dataToAppend[0].length,
          )
          .setValues(dataToAppend);
      }
      return createJsonResponse({
        success: true,
        message: "Lote guardado com sucesso",
      });
    }
    // =========================================================
    // LÓGICA EXISTENTE: REGISTO DE MOVIMENTOS (ENTRADAS/SAIDAS)
    // =========================================================

    // Se a execução chegar aqui, é porque as ações de cima não foram ativadas,
    // ou seja, continua a ser a lógica da folha InventoryMovements.
    const sheet = ss.getSheetByName("InventoryMovements");
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    const getColIndex = (name) => {
      return headers.findIndex(
        (h) => h.toString().trim().toUpperCase() === name.toUpperCase(),
      );
    };

    // BATCH MODE DE ENTRADAS/SAÍDAS
    if (params.action === "BATCH_MOVEMENT") {
      const items = params.items;
      const type = params.type;

      const appUser = params.user || "Sem Email";
      const origin = params.origin || "";
      const storage = params.storage || "";
      const obs = params.obs || "";

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
          User: appUser,
          Origin: origin,
          Storage: storage,
          Obs: obs,
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

    // LÓGICA ANTIGA DE ENTRADA/SAÍDA (Unitária/Multi-quantidade)
    const qtdTotal = parseInt(params.quantity) || 1;
    let firstGeneratedID = "";

    for (let i = 0; i < qtdTotal; i++) {
      let newRow = new Array(headers.length).fill("");
      const now = new Date();

      const randomPart = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const uniqueID =
        "LG-" + (now.getTime() + i).toString().substring(4) + "-" + randomPart;

      if (i === 0) firstGeneratedID = uniqueID;

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
        Qty: 1,
        Status: "Active",
        User: params.user || "App_User",
        BarCode: params.barcode ? "'" + params.barcode : "",
      };

      const colIn = getColIndex("Date_IN");
      const colOut = getColIndex("Date_OUT");

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

      for (let [colName, value] of Object.entries(dataMap)) {
        const idx = getColIndex(colName);
        if (idx !== -1) {
          newRow[idx] = value;
        }
      }

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

// ============================================
// HELPER (Apenas uma declaração para limpeza)
// ============================================
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
