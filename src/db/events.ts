import { supabase } from "../lib/supabaseClient";

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  color: string | null;
  note: string | null;
  created_at: string;
};

export async function getEventsOverlappingRange(fromISO: string, toISO: string): Promise<EventRow[]> {
  // overlap rule: start <= to AND end >= from
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lte("start_date", toISO)
    .gte("end_date", fromISO)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function createEvent(payload: {
  title: string;
  start_date: string;
  end_date: string;
  color: string | null;
  note: string | null;
}) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("events")
    .insert({ user_id: userId, ...payload })
    .select("*")
    .single();

  if (error) throw error;
  return data as EventRow;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}