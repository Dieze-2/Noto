import { supabase } from "@/lib/supabaseClient";

export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  color: string | null;
}

export async function getEventsOverlappingRange(
  from: string,
  to: string
): Promise<EventRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .lte("start_date", to)
    .gte("end_date", from)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as EventRow[];
}
