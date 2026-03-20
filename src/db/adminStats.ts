import { supabase } from "@/lib/supabaseClient";
import { CoachPlan, PLAN_CONFIG } from "@/db/coachSubscriptions";

export interface CoachRow {
  coach_id: string;
  plan: CoachPlan;
  trial_end: string | null;
  cancel_at: string | null;
  pending_cancellation: boolean;
  created_at: string;
  athleteCount: number;
  profileName: string;
  email: string;
}

export interface UserStats {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
}

export interface AdminStats {
  totalCoaches: number;
  activeTrials: number;
  expiringTrials: CoachRow[];
  coaches: CoachRow[];
  planBreakdown: Record<CoachPlan, number>;
  userStats: UserStats;
}

/** Fetch all coach subscriptions with enriched data (admin only) */
export async function getAdminStats(): Promise<AdminStats> {
  // 1. Get all coach subscriptions
  const { data: subs, error: subErr } = await supabase
    .from("coach_subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (subErr) {
    console.error("getAdminStats subs:", subErr);
    return emptyStats();
  }

  const coachIds = (subs ?? []).map((s: any) => s.coach_id);
  if (coachIds.length === 0) return emptyStats();

  // 2. Get profiles + athlete counts in parallel
  const [profilesRes, athleteCountsRes] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").in("id", coachIds),
    supabase.from("coach_athletes").select("coach_id").in("coach_id", coachIds).in("status", ["accepted", "pending"]),
  ]);

  const profileMap = new Map<string, string>();
  (profilesRes.data ?? []).forEach((p: any) => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    profileMap.set(p.id, name || p.id.slice(0, 8));
  });

  // Count athletes per coach
  const countMap = new Map<string, number>();
  (athleteCountsRes.data ?? []).forEach((row: any) => {
    countMap.set(row.coach_id, (countMap.get(row.coach_id) ?? 0) + 1);
  });

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const coaches: CoachRow[] = (subs ?? []).map((s: any) => ({
    coach_id: s.coach_id,
    plan: s.plan as CoachPlan,
    trial_end: s.trial_end,
    cancel_at: s.cancel_at,
    pending_cancellation: s.pending_cancellation ?? false,
    created_at: s.created_at,
    athleteCount: countMap.get(s.coach_id) ?? 0,
    profileName: profileMap.get(s.coach_id) ?? s.coach_id.slice(0, 8),
    email: "",
  }));

  const activeTrials = coaches.filter(
    (c) => c.trial_end && new Date(c.trial_end) > now
  ).length;

  const expiringTrials = coaches.filter(
    (c) => c.trial_end && new Date(c.trial_end) > now && new Date(c.trial_end) <= in7Days
  );

  const planBreakdown: Record<CoachPlan, number> = { classic: 0, pro: 0, club: 0 };
  coaches.forEach((c) => { planBreakdown[c.plan]++; });

  const userStats = await getUserStats();

  return {
    totalCoaches: coaches.length,
    activeTrials,
    expiringTrials,
    coaches,
    planBreakdown,
    userStats,
  };
}

async function getUserStats(): Promise<UserStats> {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, new7Res, new30Res] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d30),
  ]);

  return {
    totalUsers: totalRes.count ?? 0,
    newUsers7d: new7Res.count ?? 0,
    newUsers30d: new30Res.count ?? 0,
  };
}

function emptyStats(): AdminStats {
  return {
    totalCoaches: 0,
    activeTrials: 0,
    expiringTrials: [],
    coaches: [],
    planBreakdown: { classic: 0, pro: 0, club: 0 },
    userStats: { totalUsers: 0, newUsers7d: 0, newUsers30d: 0 },
  };
}
