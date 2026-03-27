import { supabase } from "@/lib/supabaseClient";

export type CatalogExercise = {
  id: string;
  name: string;
  youtube_url: string | null;
  note: string | null;
  note_en: string | null;
  note_es: string | null;
  difficulty_level: string | null;
  target_muscle_group: string | null;
  prime_mover_muscle: string | null;
  secondary_muscle: string | null;
  tertiary_muscle: string | null;
  primary_equipment: string | null;
  secondary_equipment: string | null;
  movement_pattern_1: string | null;
  movement_pattern_2: string | null;
  movement_pattern_3: string | null;
  grip: string | null;
  body_region: string | null;
  created_at: string;
};

export async function listCatalogExercises(): Promise<CatalogExercise[]> {
  const all: CatalogExercise[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("exercise_catalog")
      .select("*")
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as CatalogExercise[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function addCatalogExercise(payload: {
  name: string;
  youtube_url: string | null;
  note: string | null;
}) {
  const { data, error } = await supabase
    .from("exercise_catalog")
    .insert({
      name: payload.name,
      youtube_url: payload.youtube_url,
      note: payload.note,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CatalogExercise;
}

/** Get distinct values for a given column (for filter dropdowns) */
export async function getCatalogFilterValues(column: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("exercise_catalog")
    .select(column)
    .not(column, "is", null)
    .order(column, { ascending: true });

  if (error) throw error;
  const unique = [...new Set((data ?? []).map((r: any) => r[column]).filter(Boolean))];
  return unique as string[];
}
