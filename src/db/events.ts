import { supabase } from "../lib/supabaseClient";

export type EventRow = {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  color: string;
  note?: string;
};

export async function getEventsOverlappingRange(from: string, to: string): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lte("start_date", to)
    .gte("end_date", from)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data || []) as EventRow[];
}

export async function createEvent(payload: {
  title: string;
  start_date: string;
  end_date: string;
  color?: string;
  note?: string;
}) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Non authentifié");

  const { error } = await supabase.from("events").insert([
    {
      user_id: authData.user.id,
      title: payload.title,
      start_date: payload.start_date,
      end_date: payload.end_date,
      color: payload.color || "#00ffa3",
      note: payload.note,
    },
  ]);

  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
