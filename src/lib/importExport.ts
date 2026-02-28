import { db } from "../db/db";

// Exportation de toutes les tables en JSON
export async function exportData() {
  const tables = ["daily_metrics", "workouts", "workout_exercises", "catalog_exercises", "events"];
  const data: any = {};

  for (const table of tables) {
    data[table] = await db.table(table).toArray();
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bio-log-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Importation du JSON dans la base IndexedDB
export async function importData(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    
    await db.transaction("rw", db.allTables, async () => {
      for (const table in data) {
        if (db.table(table)) {
          await db.table(table).clear();
          await db.table(table).bulkAdd(data[table]);
        }
      }
    });
    
    window.location.reload();
  } catch (error) {
    console.error("Erreur lors de l'import :", error);
    throw error;
  }
}