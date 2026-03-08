import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, Weight, Footprints, Flame,
  TrendingUp, TrendingDown, Minus, Dumbbell,
  ClipboardList, Plus, ChevronRight, ChevronDown, ChevronUp,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import GlassCard from "@/components/GlassCard";
import { supabase } from "@/lib/supabaseClient";
import { getProfile, displayName, Profile } from "@/db/profiles";
import { getCoachPrograms, Program } from "@/db/programs";
import ProgramEditor from "@/components/ProgramEditor";
import { createProgram, deleteProgram } from "@/db/programs";
import { toast } from "sonner";

interface DailyMetric {
  date: string;
  weight_g: number | null;
  steps: number | null;
  kcal: number | null;
}

interface WorkoutDay {
  date: string;
  exercises: { name: string; load_type: string; load_g: number | null; reps: number }[];
}

type Tab = "overview" | "training" | "programs";

export default function CoachAthleteViewPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutDay[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [metricsExpanded, setMetricsExpanded] = useState(false);

  /* program editor */
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    if (!athleteId) return;

    const [prof, allPrograms] = await Promise.all([
      getProfile(athleteId),
      getCoachPrograms(),
    ]);

    setProfile(prof);
    setPrograms(allPrograms.filter((p) => p.athlete_id === athleteId));

    // Get ALL metrics (no date filter)
    const { data: metricsData } = await supabase
      .from("daily_metrics")
      .select("date, weight_g, steps, kcal")
      .eq("user_id", athleteId)
      .order("date", { ascending: false });
    setMetrics(metricsData ?? []);

    // Get workout history with exercises via the flat view
    const { data: flatExercises } = await supabase
      .from("v_workout_exercises_flat")
      .select("workout_date, exercise_name, load_type, load_g, reps")
      .eq("user_id", athleteId)
      .order("workout_date", { ascending: false });

    if (flatExercises) {
      const byDate = new Map<string, WorkoutDay>();
      flatExercises.forEach((row: any) => {
        const d = row.workout_date;
        if (!byDate.has(d)) byDate.set(d, { date: d, exercises: [] });
        byDate.get(d)!.exercises.push({
          name: row.exercise_name,
          load_type: row.load_type,
          load_g: row.load_g,
          reps: row.reps,
        });
      });
      setWorkoutHistory(Array.from(byDate.values()));
    }

    setLoading(false);
  };

  useEffect(() => { refresh(); }, [athleteId]);

  /* ── Computed stats (last 30 days for summary) ── */
  const stats = useMemo(() => {
    const last30 = metrics.slice(0, 30);
    const weights = last30.filter((m) => m.weight_g != null).map((m) => m.weight_g! / 1000);
    const stepsList = last30.filter((m) => m.steps != null).map((m) => m.steps!);
    const kcalList = last30.filter((m) => m.kcal != null).map((m) => m.kcal!);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const latest = (arr: number[]) => arr.length > 0 ? arr[0] : null;
    const trend = (arr: number[]) => {
      if (arr.length < 2) return 0;
      return arr[0] - arr[arr.length - 1];
    };

    // Count workouts in last 30 days
    const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd");
    const recentWorkouts = workoutHistory.filter((w) => w.date >= thirtyDaysAgo);

    return {
      currentWeight: latest(weights),
      weightTrend: trend(weights),
      avgSteps: avg(stepsList),
      avgKcal: avg(kcalList),
      workoutCount: recentWorkouts.length,
      totalWorkouts: workoutHistory.length,
    };
  }, [metrics, workoutHistory]);

  const athleteName = displayName(profile);

  const handleCreateProgram = async () => {
    if (!athleteId) return;
    setCreating(true);
    try {
      const title = `${t("program.newProgram")} - ${format(new Date(), "dd/MM/yyyy")}`;
      const p = await createProgram(athleteId, title);
      await refresh();
      setEditingProgram(p);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProgram(id);
      setEditingProgram(null);
      toast.success(t("program.deleted"));
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ── Program editor view ── */
  if (editingProgram) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-32">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setEditingProgram(null); refresh(); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} /> {t("program.backToList")}
            </button>
            <button
              onClick={() => handleDelete(editingProgram.id)}
              className="text-xs font-black uppercase tracking-wider text-destructive/60 hover:text-destructive"
            >
              {t("program.deleteProgram")}
            </button>
          </div>
          <ProgramEditor program={editingProgram} onBack={() => { setEditingProgram(null); refresh(); }} />
        </motion.div>
      </div>
    );
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0.3) return <TrendingUp size={14} className="text-primary" />;
    if (value < -0.3) return <TrendingDown size={14} className="text-destructive" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  function loadDisplay(lt: string, lg: number | null) {
    if (lt === "PDC") return "PDC";
    if (lt === "PDC_PLUS") return `PDC+${(lg ?? 0) / 1000}`;
    return `${(lg ?? 0) / 1000}`;
  }

  const visibleMetrics = metricsExpanded ? metrics : metrics.slice(0, 10);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-32">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/coach")} className="p-2 rounded-xl glass hover:bg-muted/50">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-noto-title text-xl text-primary">{athleteName}</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {t("coach.fullHistory")}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex glass rounded-xl p-1">
          {(["overview", "training", "programs"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? t("coach.overview") : tab === "training" ? t("coach.training") : t("coach.programs")}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <>
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <Weight size={16} className="text-metric-weight" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("dashboard.weight")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {stats.currentWeight != null ? stats.currentWeight.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">kg</span>
                  {stats.currentWeight != null && <TrendIcon value={stats.weightTrend} />}
                </div>
                {stats.weightTrend !== 0 && stats.currentWeight != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {stats.weightTrend > 0 ? "+" : ""}{stats.weightTrend.toFixed(1)} kg
                  </p>
                )}
              </GlassCard>

              <GlassCard className="p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <Dumbbell size={16} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("coach.workouts")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{stats.workoutCount}</span>
                  <span className="text-xs text-muted-foreground">/ 30j</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {stats.totalWorkouts} {t("coach.totalSessions")}
                </p>
              </GlassCard>

              <GlassCard className="p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <Footprints size={16} className="text-metric-steps" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("coach.avgSteps")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {stats.avgSteps != null ? Math.round(stats.avgSteps).toLocaleString() : "—"}
                  </span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-metric-kcal" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t("coach.avgKcal")}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    {stats.avgKcal != null ? Math.round(stats.avgKcal).toLocaleString() : "—"}
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* ── Metrics history ── */}
            <GlassCard className="p-5 rounded-3xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                {t("coach.metricsHistory")} ({metrics.length})
              </h3>
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("coach.noData")}</p>
              ) : (
                <>
                  <div className="space-y-1">
                    {visibleMetrics.map((m) => (
                      <div key={m.date} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground w-16">
                          {format(new Date(m.date), "dd/MM")}
                        </span>
                        <div className="flex items-center gap-4 flex-1">
                          {m.weight_g != null && (
                            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                              <Weight size={10} className="text-metric-weight" />
                              {(m.weight_g / 1000).toFixed(1)}
                            </div>
                          )}
                          {m.steps != null && (
                            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                              <Footprints size={10} className="text-metric-steps" />
                              {m.steps.toLocaleString()}
                            </div>
                          )}
                          {m.kcal != null && (
                            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                              <Flame size={10} className="text-metric-kcal" />
                              {m.kcal.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {metrics.length > 10 && (
                    <button
                      onClick={() => setMetricsExpanded(!metricsExpanded)}
                      className="w-full flex items-center justify-center gap-1 mt-3 text-[10px] font-black uppercase tracking-widest text-primary"
                    >
                      {metricsExpanded ? (
                        <><ChevronUp size={12} /> {t("coach.showLess")}</>
                      ) : (
                        <><ChevronDown size={12} /> {t("coach.showAll")} ({metrics.length})</>
                      )}
                    </button>
                  )}
                </>
              )}
            </GlassCard>
          </>
        ) : activeTab === "training" ? (
          /* ── Training history ── */
          <div className="space-y-3">
            {workoutHistory.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t("coach.noTrainingData")}</p>
              </div>
            ) : (
              workoutHistory.map((day) => (
                <GlassCard key={day.date} className="p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {format(new Date(day.date), "dd/MM/yyyy")}
                    </span>
                    <span className="text-[10px] font-bold text-primary ml-auto">
                      {day.exercises.length} {t("coach.exercisesCount")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                        <Dumbbell size={12} className="text-muted-foreground/60 shrink-0" />
                        <span className="text-xs font-bold text-foreground flex-1 truncate">{ex.name}</span>
                        <span className="text-[11px] font-black text-muted-foreground whitespace-nowrap">
                          {loadDisplay(ex.load_type, ex.load_g)} {ex.load_type !== "PDC" && ex.load_type !== "TEXT" && "kg"}
                        </span>
                        <span className="text-[11px] font-black text-primary whitespace-nowrap">
                          {ex.reps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        ) : (
          /* ── Programs tab ── */
          <div className="space-y-4">
            {/* Quick create button */}
            <button
              onClick={handleCreateProgram}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={16} />
              {creating ? t("program.creating") : t("coach.newProgram")}
            </button>

            {/* Program list */}
            {programs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("coach.noPrograms")}</p>
            ) : (
              <div className="space-y-2">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setEditingProgram(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-muted/50 transition-colors text-left"
                  >
                    <ClipboardList size={16} className="text-primary" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground truncate block">{p.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(p.updated_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/40" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
