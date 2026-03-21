import { supabase } from "@/lib/supabaseClient";

/* ── Types ── */
export interface WorkoutRow {
  id: string;
  user_id: string;
  date: string;
  title: string | null;
  note: string | null;
}

export interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_name: string;
  load_type: "KG" | "PDC" | "PDC_PLUS" | "TEXT";
  load_g: number | null;
  reps: number;
  comment: string | null;
  sort_order: number;
}

export interface WorkoutExerciseSetRow {
  id: string;
  workout_exercise_id: string;
  user_id: string;
  reps: number;
  load_type: "KG" | "PDC" | "PDC_PLUS" | "TEXT";
  load_g: number | null;
  load_text: string | null;
  sort_order: number;
  comment: string | null;
}

/* ── Workout ── */
export async function getOrCreateWorkout(date: string): Promise<WorkoutRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) return existing as WorkoutRow;

  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, date, title: null, note: null })
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutRow;
}

/* ── Exercises (masters) ── */
export async function getWorkoutExercises(workoutId: string): Promise<WorkoutExerciseRow[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutExerciseRow[];
}

export async function addWorkoutExercise(payload: {
  workout_id: string;
  exercise_name: string;
  reps: number;
  load_g: number | null;
  load_type: string;
  sort_order: number;
}): Promise<WorkoutExerciseRow> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutExerciseRow;
}

export async function updateWorkoutExercise(
  id: string,
  updates: { reps: number; load_type: string; load_g: number | null }
) {
  const { error } = await supabase
    .from("workout_exercises")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteWorkoutExercise(id: string) {
  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ── Sets ── */
export async function getExerciseSets(exerciseId: string): Promise<WorkoutExerciseSetRow[]> {
  const { data, error } = await supabase
    .from("workout_exercise_sets")
    .select("*")
    .eq("workout_exercise_id", exerciseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutExerciseSetRow[];
}

export async function addExerciseSet(payload: {
  workout_exercise_id: string;
  reps: number;
  load_type: string;
  load_g: number | null;
  sort_order: number;
}): Promise<WorkoutExerciseSetRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("workout_exercise_sets")
    .insert({ ...payload, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as WorkoutExerciseSetRow;
}

export async function updateExerciseSet(
  id: string,
  updates: { reps: number; load_type: string; load_g: number | null }
) {
  const { error } = await supabase
    .from("workout_exercise_sets")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteExerciseSet(id: string) {
  const { error } = await supabase
    .from("workout_exercise_sets")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ── View-based queries for Dashboard ── */
export async function listTrackedExercises(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("v_workout_exercises_flat")
    .select("exercise_name")
    .eq("user_id", user.id);

  if (error) throw error;
  const unique = [...new Set((data ?? []).map((r: any) => r.exercise_name))];
  return unique.sort();
}

export async function getLastLoggedExercise(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("v_workout_exercises_flat")
    .select("exercise_name, workout_date")
    .eq("user_id", user.id)
    .order("workout_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.exercise_name ?? null;
}

export async function getFirstExerciseDate(exerciseName: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("v_workout_exercises_flat")
    .select("workout_date")
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName)
    .order("workout_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.workout_date ?? null;
}

export async function getExerciseMasterHistory(
  exerciseName: string,
  from: string,
  to: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("v_workout_exercises_flat")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName)
    .gte("workout_date", from)
    .lte("workout_date", to)
    .order("workout_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
