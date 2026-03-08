import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, Calendar,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { subDays, format, differenceInDays, parseISO } from "date-fns";

import GlassCard from "@/components/GlassCard";
import { supabase } from "@/lib/supabaseClient";
import { CoachAthlete } from "@/db/coachAthletes";
import { Profile, displayName } from "@/db/profiles";

interface Props {
  athletes: CoachAthlete[];
  profiles: Record<string, Profile>;
}

interface AthleteStats {
  athleteId: string;
  name: string;
  sessionsLast30: number;
  avgFrequency: number; // sessions per week
  exerciseCount: number;
  avgProgression: number | null; // % e1RM change
  lastWorkoutDate: string | null;
  isActive: boolean; // had a workout in last 14 days
}

/** Compute estimated 1RM (Epley formula) */
function computeE1RM(loadKg: number, reps: number): number {
  if (loadKg <= 0) return 0;
  return loadKg * (1 + reps / 30);
}

export default function CoachStatsOverview({ athletes, profiles }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [athleteStats, setAthleteStats] = useState<AthleteStats[]>([]);

  const acceptedAthletes = athletes.filter(
    (a) => a.status === "accepted" && a.athlete_id
  );

  useEffect(() => {
    if (acceptedAthletes.length === 0) {
      setLoading(false);
      return;
    }

    (async () => {
      const athleteIds = acceptedAthletes.map((a) => a.athlete_id!);
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

      // Fetch all workout data for accepted athletes in last 30 days
      const { data: recentWorkouts, error: wErr } = await supabase
        .from("v_workout_exercises_flat")
        .select("user_id, workout_date, exercise_name, load_type, load_g, reps")
        .in("user_id", athleteIds)
        .gte("workout_date", thirtyDaysAgo)
        .order("workout_date", { ascending: true });

      // Also fetch ALL data to compute progression
      const { data: allWorkouts, error: aErr } = await supabase
        .from("v_workout_exercises_flat")
        .select("user_id, workout_date, exercise_name, load_type, load_g, reps")
        .in("user_id", athleteIds)
        .order("workout_date", { ascending: true });

      if (wErr || aErr) {
        console.error("CoachStatsOverview:", wErr || aErr);
        setLoading(false);
        return;
      }

      const stats: AthleteStats[] = athleteIds.map((id) => {
        const profile = profiles[id];
        const name = displayName(profile, id.slice(0, 8));

        // Recent data (30 days)
        const recent = (recentWorkouts ?? []).filter((w: any) => w.user_id === id);
        const recentDates = [...new Set(recent.map((w: any) => w.workout_date))];
        const sessionsLast30 = recentDates.length;
        const avgFrequency = sessionsLast30 / (30 / 7); // per week

        // Unique exercises
        const exerciseNames = [...new Set(recent.map((w: any) => w.exercise_name))];

        // Last workout date
        const lastWorkoutDate = recentDates.length > 0
          ? recentDates[recentDates.length - 1]
          : null;
        const isActive = lastWorkoutDate ? lastWorkoutDate >= fourteenDaysAgo : false;

        // Compute average e1RM progression across all exercises
        const allForAthlete = (allWorkouts ?? []).filter((w: any) => w.user_id === id);
        const exMap = new Map<string, any[]>();
        allForAthlete.forEach((w: any) => {
          if (!exMap.has(w.exercise_name)) exMap.set(w.exercise_name, []);
          exMap.get(w.exercise_name)!.push(w);
        });

        const progressions: number[] = [];
        exMap.forEach((entries) => {
          if (entries.length < 2) return;
          const firstLoad = (entries[0].load_g ?? 0) / 1000;
          const lastLoad = (entries[entries.length - 1].load_g ?? 0) / 1000;
          const firstE1RM = computeE1RM(firstLoad, entries[0].reps);
          const lastE1RM = computeE1RM(lastLoad, entries[entries.length - 1].reps);
          if (firstE1RM > 0) {
            progressions.push(((lastE1RM - firstE1RM) / firstE1RM) * 100);
          }
        });

        const avgProgression = progressions.length > 0
          ? progressions.reduce((a, b) => a + b, 0) / progressions.length
          : null;

        return {
          athleteId: id,
          name,
          sessionsLast30,
          avgFrequency,
          exerciseCount: exerciseNames.length,
          avgProgression,
          lastWorkoutDate,
          isActive,
        };
      });

      setAthleteStats(stats);
      setLoading(false);
    })();
  }, [acceptedAthletes.length]);

  const globalStats = useMemo(() => {
    if (athleteStats.length === 0) return null;

    const activeCount = athleteStats.filter((s) => s.isActive).length;
    const inactiveCount = athleteStats.length - activeCount;
    const avgFrequency =
      athleteStats.reduce((sum, s) => sum + s.avgFrequency, 0) / athleteStats.length;
    const withProgression = athleteStats.filter((s) => s.avgProgression !== null);
    const avgProgression =
      withProgression.length > 0
        ? withProgression.reduce((sum, s) => sum + s.avgProgression!, 0) / withProgression.length
        : null;
    const totalSessions = athleteStats.reduce((sum, s) => sum + s.sessionsLast30, 0);

    return { activeCount, inactiveCount, avgFrequency, avgProgression, totalSessions };
  }, [athleteStats]);

  if (acceptedAthletes.length === 0) return null;

  if (loading) {
    return (
      <GlassCard className="p-6 rounded-2xl flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </GlassCard>
    );
  }

  if (!globalStats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-primary" />
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
          {t("coachStats.title")}
        </h2>
      </div>

      {/* Global stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={14} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-primary">{globalStats.activeCount}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("coachStats.activeAthletes")}
          </div>
          {globalStats.inactiveCount > 0 && (
            <div className="text-[9px] text-destructive font-bold mt-0.5">
              {globalStats.inactiveCount} {t("coachStats.inactive")}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar size={14} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{globalStats.totalSessions}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("coachStats.totalSessions30d")}
          </div>
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap size={14} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {globalStats.avgFrequency.toFixed(1)}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("coachStats.avgFrequency")}
          </div>
        </GlassCard>

        <GlassCard className="p-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {globalStats.avgProgression !== null && globalStats.avgProgression >= 0 ? (
              <TrendingUp size={14} className="text-primary" />
            ) : (
              <TrendingDown size={14} className="text-destructive" />
            )}
          </div>
          {globalStats.avgProgression !== null ? (
            <div className={`text-2xl font-black ${globalStats.avgProgression >= 0 ? "text-primary" : "text-destructive"}`}>
              {globalStats.avgProgression > 0 ? "+" : ""}{globalStats.avgProgression.toFixed(1)}%
            </div>
          ) : (
            <div className="text-2xl font-black text-muted-foreground">—</div>
          )}
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("coachStats.avgProgression")}
          </div>
        </GlassCard>
      </div>

      {/* Per-athlete breakdown */}
      <GlassCard className="rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {t("coachStats.perAthlete")}
          </p>
        </div>
        <div className="divide-y divide-border">
          {athleteStats.map((s) => (
            <div key={s.athleteId} className="px-4 py-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.isActive ? "bg-primary" : "bg-destructive/50"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground font-bold">
                  {s.sessionsLast30} {t("coachStats.sessions")} · {s.avgFrequency.toFixed(1)}x/{t("coachStats.week")}
                  {s.lastWorkoutDate && ` · ${t("coachStats.last")}: ${format(parseISO(s.lastWorkoutDate), "dd/MM")}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {s.avgProgression !== null ? (
                  <span className={`text-xs font-black ${s.avgProgression >= 0 ? "text-primary" : "text-destructive"}`}>
                    {s.avgProgression > 0 ? "+" : ""}{s.avgProgression.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">—</span>
                )}
                <p className="text-[9px] text-muted-foreground font-bold">{t("coachStats.e1rmProgression")}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
