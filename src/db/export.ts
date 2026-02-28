import { supabase } from "../lib/supabaseClient";

export async function exportAllDataToJSON() {
  try {
    // Récupération de toutes les tables principales
    const [metrics, workouts, exercises] = await Promise.all([
      supabase.from("daily_metrics").select("*"),
      supabase.from("workouts").select("*"),
      supabase.from("workout_exercises").select("*"),
    ]);

    const data = {
      daily_metrics: metrics.data,
      workouts: workouts.data,
      workout_exercises: exercises.data,
      export_date: new Date().toISOString(),
    };

    // Création du fichier téléchargeable
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `noto_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur lors de l'export :", error);
    alert("Impossible de générer l'export.");
  }
}