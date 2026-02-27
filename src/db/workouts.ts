import { supabase } from "../lib/supabaseClient";

export type WorkoutRow = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
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

export async function getWorkoutsByDate(dateISO: string): Promise<WorkoutRow[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("date", dateISO)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutRow[];
}

export async function getWorkoutExercises(workoutId: string): Promise<WorkoutExerciseRow[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutExerciseRow[];
}

export async function getOrCreateWorkout(dateISO: string): Promise<WorkoutRow> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: existing, error: findErr } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateISO)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) return existing as WorkoutRow;

  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date: dateISO, title: null, note: null })
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutRow;
}

export async function addWorkoutExercise(payload: {
  workout_id: string;
  exercise_name: string;
  load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT";
  load_g: number | null;
  load_text: string | null;
  reps: number | null;
  comment: string | null;
}) {
  const { data: maxRow, error: maxErr } = await supabase
    .from("workout_exercises")
    .select("sort_order")
    .eq("workout_id", payload.workout_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw maxErr;

  const nextOrder = ((maxRow as any)?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({ ...payload, sort_order: nextOrder })
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutExerciseRow;
}
