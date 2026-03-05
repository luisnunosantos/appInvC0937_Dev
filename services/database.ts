// services/database.ts

import * as SQLite from "expo-sqlite";

// Define an interface for the Lego set data structure
interface LegoSet {
  n: string | number;
  s: string;
  y: number;
  t: string;
  st: string;
  e: string | number;
}

let db: SQLite.Database | null = null;

// Lazily open the database connection.
const getDb = async (): Promise<SQLite.Database> => {
  if (db === null) {
    db = await SQLite.openDatabaseAsync("lego_inventory.db");
  }
  return db;
};

export const setupDatabase = async () => {
  const db = await getDb();
  // Create the table for Lego sets if it doesn't exist.
  await db.execAsync(`
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

export const syncLocalDatabase = async (data: LegoSet[]) => {
  const db = await getDb();
  try {
    // Use a transaction to perform the batch insert efficiently.
    await db.withTransactionAsync(async () => {
      // Clear the existing data.
      await db.runAsync("DELETE FROM lego_sets");

      // Prepare the insert statement once.
      const statement = await db.prepareAsync(
        "INSERT OR REPLACE INTO lego_sets (number, name, year, theme, subtheme, ean) VALUES (?, ?, ?, ?, ?, ?)",
      );

      // Iterate over the data and execute the prepared statement.
      for (const item of data) {
        // Basic validation to avoid inserting empty rows.
        if (item.n) {
          await statement.executeAsync([
            String(item.n),
            String(item.s),
            Number(item.y),
            String(item.t),
            String(item.st),
            String(item.e),
          ]);
        }
      }

      // Finalize the statement after the loop.
      await statement.finalizeAsync();
    });
    console.log("Sincronização SQLite concluída com sucesso.");
  } catch (error) {
    console.error("Erro na transação de sincronização:", error);
    throw error;
  }
};

export const searchLocalSet = async (query: string) => {
  const db = await getDb();
  const cleanQuery = query.trim();
  return await db.getFirstAsync<LegoSet>(
    "SELECT * FROM lego_sets WHERE number = ? OR ean = ?",
    [cleanQuery, cleanQuery],
  );
};

export const getLegoSetByCode = async (
  code: string,
): Promise<LegoSet | null> => {
  const db = await getDb();
  try {
    const result = await db.getFirstAsync<LegoSet>(
      `SELECT * FROM lego_sets WHERE ean LIKE ? OR number = ?`,
      [`%${code}%`, code],
    );
    return result;
  } catch (error) {
    console.error("Erro ao buscar set:", error);
    return null;
  }
};

// =============================
// CONSULTAS AVANÇADAS E FILTROS
// =============================

/**
 * Retorna uma lista de Temas (Themes) únicos da base de dados local
 * Ideal para preencher a Dropdown de pesquisa.
 */
export const getUniqueThemes = async (): Promise<string[]> => {
  const db = await getDb();
  try {
    const results = await db.getAllAsync<{ theme: string }>(
      "SELECT DISTINCT theme FROM lego_sets WHERE theme IS NOT NULL AND theme != '' ORDER BY theme ASC",
    );
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
export const getUniqueSubthemes = async (theme?: string): Promise<string[]> => {
  const db = await getDb();
  try {
    let query =
      "SELECT DISTINCT subtheme FROM lego_sets WHERE subtheme IS NOT NULL AND subtheme != ''";
    let params: string[] = [];

    if (theme) {
      query += " AND theme = ?";
      params.push(theme);
    }

    query += " ORDER BY subtheme ASC";

    const results = await db.getAllAsync<{ subtheme: string }>(query, params);
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
