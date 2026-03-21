import { supabase } from "@/lib/supabaseClient";

/**
 * Dismiss the PR banner for a given athlete.
 * Stores the current timestamp so only PRs logged AFTER this time will re-trigger the banner.
 */
export async function dismissPRBanner(athleteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("pr_dismissals")
    .upsert(
      { user_id: user.id, athlete_id: athleteId, dismissed_at: new Date().toISOString() },
      { onConflict: "user_id,athlete_id" }
    );

  if (error) console.error("dismissPRBanner:", error);
}

/**
 * Get the last PR dismiss timestamp for a given athlete.
 * Returns null if never dismissed.
 */
export async function getPRDismissedAt(athleteId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("pr_dismissals")
    .select("dismissed_at")
    .eq("user_id", user.id)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (error) {
    console.error("getPRDismissedAt:", error);
    return null;
  }
  return data?.dismissed_at ?? null;
}

/**
 * Record the coach's visit to an athlete's profile page.
 */
export async function recordCoachVisit(athleteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("coach_athlete_visits")
    .upsert(
      { coach_id: user.id, athlete_id: athleteId, last_visited_at: new Date().toISOString() },
      { onConflict: "coach_id,athlete_id" }
    );

  if (error) console.error("recordCoachVisit:", error);
}

/**
 * Get the coach's last visit timestamp for a given athlete.
 */
export async function getCoachLastVisit(athleteId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("coach_athlete_visits")
    .select("last_visited_at")
    .eq("coach_id", user.id)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (error) {
    console.error("getCoachLastVisit:", error);
    return null;
  }
  return data?.last_visited_at ?? null;
}
