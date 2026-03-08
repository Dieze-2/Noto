import { supabase } from "@/lib/supabaseClient";

export interface CatalogExercise {
  id: string;
  name: string;
}

export async function listCatalogExercises(): Promise<CatalogExercise[]> {
  const { data, error } = await supabase
    .from("catalog_exercises")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CatalogExercise[];
}
