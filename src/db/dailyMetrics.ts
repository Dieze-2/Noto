import { supabase } from "../lib/supabaseClient";

 

export type DailyMetricsRow = {

  id: string;

  user_id: string;

  date: string; // YYYY-MM-DD

  steps: number | null;

  kcal: number | null;

  weight_g: number | null;

  note: string | null;

  created_at: string;

  updated_at: string;

};

 

export async function getDailyMetricsByDate(dateISO: string): Promise<DailyMetricsRow | null> {

  const { data, error } = await supabase

    .from("daily_metrics")

    .select("*")

    .eq("date", dateISO)

    .maybeSingle();

 

  if (error) throw error;

  return data ?? null;

}

 

export async function upsertDailyMetrics(payload: {

  date: string; // YYYY-MM-DD

  steps: number | null;

  kcal: number | null;

  weight_g: number | null;

  note: string | null;

}) {

  const { data: authData, error: authErr } = await supabase.auth.getUser();

  if (authErr) throw authErr;

 

  const userId = authData.user?.id;

  if (!userId) throw new Error("Not authenticated");

 

  // We include user_id to satisfy RLS insert policy

  const { data, error } = await supabase

    .from("daily_metrics")

    .upsert(

      {

        user_id: userId,

        date: payload.date,

        steps: payload.steps,

        kcal: payload.kcal,

        weight_g: payload.weight_g,

        note: payload.note,

      },

      { onConflict: "user_id,date" }

    )

    .select("*")

    .single();

 

  if (error) throw error;

  return data as DailyMetricsRow;

}

 export async function getDailyMetricsRange(fromISO: string, toISO: string): Promise<DailyMetricsRow[]> {
  const { data, error } = await supabase
    .from("daily_metrics")
    .select("*")
    .gte("date", fromISO)
    .lte("date", toISO)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DailyMetricsRow[];
}


 