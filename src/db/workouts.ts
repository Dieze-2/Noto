import { supabase } from "../lib/supabaseClient";

export type WorkoutRow = {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  note: string | null;
  created_at: string;
};

export type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  exercise_name: string;
  load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT";
  load_g: number | null;
  load_text: string | null;
  reps: number | null;
  comment: string | null;
  sort_order: number;
  created_at: string;
};

export async function getOrCreateWorkout(dateISO: string): Promise<WorkoutRow> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // On cherche le workout
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateISO)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  // Sinon on le crée
  const { data: newData, error: insError } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date: dateISO })
    .select()
    .single();

  if (insError) throw insError;
  return newData;
}

export async function getWorkoutExercises(workoutId: string): Promise<WorkoutExerciseRow[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addWorkoutExercise(payload: Partial<WorkoutExerciseRow>) {
  const { error } = await supabase
    .from("workout_exercises")
    .insert(payload);
  if (error) throw error;
}

export async function deleteWorkoutExercise(id: string) {
  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", id);
  if (error) throw error;
}