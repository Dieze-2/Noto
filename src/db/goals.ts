import { supabase } from "@/lib/supabaseClient";

export interface UserGoals {
  user_id: string;
  target_weight_g: number | null;
  target_steps: number | null;
  target_kcal: number | null;
}

export async function getUserGoals(): Promise<UserGoals | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as UserGoals | null;
}

export async function saveUserGoals(goals: {
  target_weight_g: number | null;
  target_steps: number | null;
  target_kcal: number | null;
}): Promise<UserGoals> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_goals")
    .upsert(
      { user_id: user.id, ...goals },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserGoals;
}
