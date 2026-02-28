import { db } from "../db"; // Modifié ici pour pointer sur le dossier db (qui contient index.ts)

// Exportation de toutes les tables en JSON
export async function exportData() {
  const tables = ["daily_metrics", "workouts", "workout_exercises", "catalog_exercises", "events"];
  const data: any = {};

  try {
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
  } catch (error) {
    console.error("Erreur lors de l'export :", error);
  }
}

// Importation du JSON dans la base IndexedDB
export async function importData(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    
    // On récupère toutes les tables définies dans l'instance Dexie
    await db.transaction("rw", db.tables, async () => {
      for (const tableContent in data) {
        const table = db.table(tableContent);
        if (table) {
          await table.clear();
          await table.bulkAdd(data[tableContent]);
        }
      }
    });
    
    window.location.reload();
  } catch (error) {
    console.error("Erreur lors de l'import :", error);
    throw error;
  }
}