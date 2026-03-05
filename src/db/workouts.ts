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

  // CLEAN: reps non-null (DB: NOT NULL default 0)
  reps: number;

  comment: string | null;
  sort_order: number;
  created_at: string;
};

export type WorkoutExerciseSetRow = {
  id: string;
  user_id: string;
  workout_exercise_id: string;

  // CLEAN: reps non-null (DB: NOT NULL default 0)
  reps: number;

  load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT";
  load_g: number | null;
  load_text: string | null;

  sort_order: number;
  comment: string | null;

  created_at: string;
  updated_at: string;
};

export async function getOrCreateWorkout(dateISO: string): Promise<WorkoutRow> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateISO)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as WorkoutRow;

  const { data: newData, error: insError } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date: dateISO })
    .select()
    .single();

  if (insError) throw insError;
  return newData as WorkoutRow;
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

export async function addWorkoutExercise(payload: Partial<WorkoutExerciseRow>) {
  const { error } = await supabase.from("workout_exercises").insert(payload);
  if (error) throw error;
}

export async function deleteWorkoutExercise(id: string) {
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function updateWorkoutExercise(
  id: string,
  patch: Partial<Pick<WorkoutExerciseRow, "reps" | "load_type" | "load_g" | "load_text" | "comment" | "sort_order" | "exercise_name">>
) {
  const { error } = await supabase.from("workout_exercises").update(patch).eq("id", id);
  if (error) throw error;
}

export async function getLastExerciseByName(name: string) {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      *,
      workouts!inner(date)
    `
    )
    .ilike("exercise_name", name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  if (data) {
    return {
      ...data,
      date: (data as any).workouts.date,
    };
  }
  return null;
}

/* -----------------------------
   SETS API (workout_exercise_sets)
------------------------------ */

export async function getExerciseSets(workoutExerciseId: string): Promise<WorkoutExerciseSetRow[]> {
  const { data, error } = await supabase
    .from("workout_exercise_sets")
    .select("*")
    .eq("workout_exercise_id", workoutExerciseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutExerciseSetRow[];
}

export async function addExerciseSet(payload: {
  workout_exercise_id: string;
  reps: number; // CLEAN: non-null
  load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT";
  load_g: number | null;
  load_text?: string | null;
  sort_order: number;
  comment?: string | null;
}) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const userId = authData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase.from("workout_exercise_sets").insert({
    user_id: userId,
    workout_exercise_id: payload.workout_exercise_id,
    reps: payload.reps,
    load_type: payload.load_type,
    load_g: payload.load_g,
    load_text: payload.load_text ?? null,
    sort_order: payload.sort_order,
    comment: payload.comment ?? null,
  });

  if (error) throw error;
}

export async function deleteExerciseSet(id: string) {
  const { error } = await supabase.from("workout_exercise_sets").delete().eq("id", id);
  if (error) throw error;
}

export async function updateExerciseSet(
  id: string,
  patch: Partial<Pick<WorkoutExerciseSetRow, "reps" | "load_type" | "load_g" | "load_text" | "sort_order" | "comment">>
) {
  const { error } = await supabase.from("workout_exercise_sets").update(patch).eq("id", id);
  if (error) throw error;
}

/* -----------------------------
   DASHBOARD API
------------------------------ */

export type ExerciseMasterPoint = {
  date: string; // YYYY-MM-DD
  exercise_name: string;
  load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT";
  load_g: number | null;
  reps: number; // CLEAN: non-null
};

export async function getExerciseMasterHistory(
  exerciseName: string,
  fromISO: string,
  toISO: string
): Promise<ExerciseMasterPoint[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      exercise_name,
      load_type,
      load_g,
      reps,
      workouts!inner(date)
    `
    )
    .eq("exercise_name", exerciseName)           // IMPORTANT: exact match
    .gte("workouts.date", fromISO)
    .lte("workouts.date", toISO)
    .order("workouts.date", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    date: r.workouts.date as string,
    exercise_name: r.exercise_name as string,
    load_type: r.load_type as ExerciseMasterPoint["load_type"],
    load_g: r.load_g as number | null,
    reps: r.reps as number,
  }));
}


export async function listTrackedExercises(): Promise<string[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("exercise_name")
    .order("exercise_name", { ascending: true });

  if (error) throw error;

  const names = Array.from(
    new Set((data ?? []).map((r: any) => String(r.exercise_name)).filter(Boolean))
  );

  return names.sort((a, b) => a.localeCompare(b));
}

export async function getFirstExerciseDate(exerciseName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("workouts!inner(date)")
    .eq("exercise_name", exerciseName)
    .order("workouts.date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as any)?.workouts?.date ?? null;
}
