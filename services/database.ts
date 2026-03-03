// services/database.ts

import * as SQLite from "expo-sqlite";

// Abrir a base de dados (será criada se não existir)
const db = SQLite.openDatabaseSync("lego_inventory.db");

export const setupDatabase = () => {
  // Criar a tabela local para guardar os 22.000 sets
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lego_sets (
      number TEXT PRIMARY KEY,
      name TEXT,
      year INTEGER,
      theme TEXT,
      subtheme TEXT,
      ean TEXT
    );
  `);
};

export const syncLocalDatabase = async (data: any[]) => {
  // 1. Limpar dados antigos
  db.execSync("DELETE FROM lego_sets");

  // 2. ALTERAÇÃO AQUI: Usamos "INSERT OR REPLACE" em vez de só "INSERT"
  // Isto resolve o erro se houver sets repetidos no Excel
  const statement = db.prepareSync(
    "INSERT OR REPLACE INTO lego_sets (number, name, year, theme, subtheme, ean) VALUES (?, ?, ?, ?, ?, ?)",
  );

  try {
    db.execSync("BEGIN TRANSACTION");

    for (const item of data) {
      // Pequena validação para garantir que não tentamos gravar linhas vazias
      if (item.n) {
        statement.executeSync([
          String(item.n),
          String(item.s),
          Number(item.y),
          String(item.t),
          String(item.st),
          String(item.e),
        ]);
      }
    }

    db.execSync("COMMIT");
    console.log("Sincronização SQLite concluída com sucesso.");
  } catch (error) {
    db.execSync("ROLLBACK");
    console.error("Erro na transação de sincronização:", error);
    throw error;
  } finally {
    statement.finalizeSync();
  }
};

export const searchLocalSet = (query: string) => {
  const cleanQuery = query.trim();
  return db.getFirstSync(
    "SELECT * FROM lego_sets WHERE number = ? OR ean = ?",
    [cleanQuery, cleanQuery],
  );
};

export const getLegoSetByCode = (code: string): any | null => {
  try {
    // Tenta encontrar pelo EAN (código de barras) ou pelo número do set
    // O LIKE ajuda caso o leitor apanhe um zero à esquerda ou direita extra
    const result = db.getFirstSync(
      `SELECT * FROM lego_sets WHERE ean LIKE ? OR number = ?`,
      [`%${code}%`, code],
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar set:", error);
    return null;
  }
};

// ============================================
// NOVAS FUNÇÕES: CONSULTAS AVANÇADAS E FILTROS
// ============================================

/**
 * Retorna uma lista de Temas (Themes) únicos da base de dados local
 * Ideal para preencher a Dropdown de pesquisa.
 */
export const getUniqueThemes = (): string[] => {
  try {
    const results = db.getAllSync(
      "SELECT DISTINCT theme FROM lego_sets WHERE theme IS NOT NULL AND theme != '' ORDER BY theme ASC",
    ) as { theme: string }[];
    return results.map((r) => r.theme);
  } catch (error) {
    console.error("Erro ao buscar temas únicos:", error);
    return [];
  }
};

/**
 * Retorna uma lista de Subtemas únicos da base de dados local.
 * Se passarmos um 'theme', ele filtra apenas os subtemas desse tema!
 */
export const getUniqueSubthemes = (theme?: string): string[] => {
  try {
    let query =
      "SELECT DISTINCT subtheme FROM lego_sets WHERE subtheme IS NOT NULL AND subtheme != ''";
    let params: string[] = [];

    if (theme) {
      query += " AND theme = ?";
      params.push(theme);
    }

    query += " ORDER BY subtheme ASC";

    const results = db.getAllSync(query, params) as { subtheme: string }[];
    return results.map((r) => r.subtheme);
  } catch (error) {
    console.error("Erro ao buscar subtemas únicos:", error);
    return [];
  }
};

/**
 * Faz o pedido ao Backend (Google Apps Script) para pesquisar os movimentos.
 */
export const performAdvancedSearch = async (filters: {
  theme?: string;
  subtheme?: string;
  origin?: string;
  destination?: string;
  dateMode?: "IN" | "OUT"; // NOVO: Tipo de movimento
  dateStart?: string; // NOVO: Data de Início
  dateEnd?: string; // NOVO: Data de Fim
}) => {
  try {
    const response = await fetch(process.env.EXPO_PUBLIC_GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "advancedSearch",
        ...filters,
      }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Erro no fetch da pesquisa avançada:", error);
    throw error;
  }
};

// export const searchLocalSet = (query: string) => {
//   const cleanQuery = query.trim();

//   // 1. Tenta procurar pelo Número do Set
//   let result = db.getFirstSync("SELECT * FROM lego_sets WHERE number = ?", [
//     cleanQuery,
//   ]);

//   // 2. Se não encontrou, tenta pelo EAN (Código de Barras)
//   if (!result) {
//     result = db.getFirstSync("SELECT * FROM lego_sets WHERE ean = ?", [
//       cleanQuery,
//     ]);
//   }

//   return result;
// };
