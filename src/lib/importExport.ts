// src/lib/importExport.ts
import { supabase } from "./supabaseClient";

// Exportation de toutes les tables principales depuis Supabase
export async function exportData() {
  try {
    const [metrics, workouts, exercises, catalog, events] = await Promise.all([
      supabase.from("daily_metrics").select("*"),
      supabase.from("workouts").select("*"),
      supabase.from("workout_exercises").select("*"),
      supabase.from("exercise_catalog").select("*"),
      supabase.from("events").select("*"),
    ]);

    const data = {
      daily_metrics: metrics.data,
      workouts: workouts.data,
      workout_exercises: exercises.data,
      exercise_catalog: catalog.data,
      events: events.data,
      export_date: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bio-log-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur lors de l'export :", error);
    alert("Impossible de générer l'export.");
  }
}

// Importation (Note : l'import massif nécessite des droits RLS appropriés sur Supabase)
export async function importData(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Non authentifié");

    // Pour Supabase, on insère les données table par table
    // Attention : l'import peut échouer si les contraintes de clés étrangères ne sont pas respectées
    for (const tableName of Object.keys(data)) {
      if (Array.isArray(data[tableName]) && data[tableName].length > 0) {
        const { error } = await supabase.from(tableName).upsert(data[tableName]);
        if (error) console.warn(`Erreur sur la table ${tableName}:`, error.message);
      }
    }
    
    window.location.reload();
  } catch (error) {
    console.error("Erreur lors de l'import :", error);
    throw error;
  }
}