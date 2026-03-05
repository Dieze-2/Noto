import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useTransform, useMotionValue } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2, Sparkles, X } from "lucide-react";

import StatBubble from "../components/StatBubble";
import GlassCard from "../components/GlassCard";

import { getDailyMetricsByDate, saveDailyMetrics } from "../db/dailyMetrics";
import {
  getOrCreateWorkout,
  getWorkoutExercises,
  addWorkoutExercise,
  deleteWorkoutExercise,
  getExerciseSets,
  addExerciseSet,
  deleteExerciseSet,
  WorkoutExerciseRow,
  WorkoutExerciseSetRow,
} from "../db/workouts";
import { listCatalogExercises, CatalogExercise } from "../db/catalog";
import { getEventsOverlappingRange, EventRow } from "../db/events";

const MAX_DOTS = 4;
const METRICS_DEBOUNCE_MS = 600;

function getISODateFromParams(dateParam: string | null): string {
  if (dateParam && isValid(parseISO(dateParam))) return dateParam;
  return format(new Date(), "yyyy-MM-dd");
}
function isHex6(x: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(x);
}
function toIntOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}
function toGramsOrNull(kgText: string): number | null {
  const t = kgText.trim();
  if (!t) return null;
  const n = parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000);
}

function MasterRow({
  ex,
  sets,
  onDeleteMaster,
  onDeleteSet,
  onOpenAddSet,
}: {
  ex: WorkoutExerciseRow;
  sets: WorkoutExerciseSetRow[];
  onDeleteMaster: (id: string) => void;
  onDeleteSet: (id: string) => void;
  onOpenAddSet: (ex: WorkoutExerciseRow) => void;
}) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-100, 0], [1, 0]);

  return (
    <motion.div layout className="relative">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-rose-600 rounded-[1.5rem]" />

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) onDeleteMaster(ex.id);
        }}
        className="relative"
      >
        <GlassCard className="p-4 border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <Dumbbell className="text-menthe shrink-0" size={20} />
              <div className="min-w-0">
                <p className="font-black text-white uppercase italic leading-none truncate">{ex.exercise_name}</p>
                <p className="text-[11px] font-bold text-white/40 mt-1 uppercase">
                  {ex.load_type === "PDC_PLUS"
                    ? `PDC + ${(ex.load_g ?? 0) / 1000}`
                    : ex.load_type === "PDC"
                      ? `PDC`
                      : `${(ex.load_g ?? 0) / 1000}`}{" "}
                  {ex.load_type === "TEXT" ? "" : "kg"} • <span className="text-menthe">{ex.reps ?? 0} reps</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAddSet(ex)}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[10px] hover:border-menthe/40"
              >
                +SET
              </button>
              <button onClick={() => onDeleteMaster(ex.id)} className="p-2 text-white/10 hover:text-rose-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {sets.length > 0 && (
            <div className="mt-3 space-y-2">
              {sets.map((s) => (
                <SetRow key={s.id} setRow={s} onDelete={onDeleteSet} />
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function SetRow({ setRow, onDelete }: { setRow: WorkoutExerciseSetRow; onDelete: (id: string) => void }) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-90, 0], [1, 0]);

  return (
    <motion.div layout className="relative">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-rose-600 rounded-2xl" />
      <motion.div
        drag="x"
        dragConstraints={{ left: -90, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) onDelete(setRow.id);
        }}
        className="relative"
      >
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase italic tracking-widest text-white/50">SET</p>
            <p className="text-[11px] font-black uppercase italic text-white/80">
              {setRow.load_type === "PDC_PLUS"
                ? `PDC + ${(setRow.load_g ?? 0) / 1000}`
                : setRow.load_type === "PDC"
                  ? `PDC`
                  : `${(setRow.load_g ?? 0) / 1000}`}{" "}
              {setRow.load_type === "TEXT" ? "" : "kg"} • {setRow.reps} reps
            </p>
          </div>

          <button onClick={() => onDelete(setRow.id)} className="p-2 text-white/10 hover:text-rose-500">
            <Trash2 size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AppHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const dateISO = useMemo(() => getISODateFromParams(searchParams.get("date")), [searchParams]);
  const currentDate = useMemo(() => parseISO(dateISO), [dateISO]);

  // Metrics (debounce + delete when null)
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const debounceTimerRef = useRef<number | null>(null);
  const pendingRef = useRef(metrics);
  const inFlightRef = useRef<Promise<any> | null>(null);
  const dateRef = useRef(dateISO);

  useEffect(() => { dateRef.current = dateISO; }, [dateISO]);

  function cancelDebounce() {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function buildPayload(date: string, m: { steps: string; kcal: string; weight: string }) {
    return {
      date,
      steps: toIntOrNull(m.steps),
      kcal: toIntOrNull(m.kcal),
      weight_g: toGramsOrNull(m.weight),
      note: null as string | null,
    };
  }

  async function flushMetricsForDate(date: string) {
    cancelDebounce();
    const snap = pendingRef.current;
    const payload = buildPayload(date, snap);

    const run = async () => {
      if (inFlightRef.current) {
        try { await inFlightRef.current; } catch {}
      }
      inFlightRef.current = saveDailyMetrics(payload);
      await inFlightRef.current;
    };

    await run();
  }

  function scheduleFlush(next: { steps: string; kcal: string; weight: string }) {
    pendingRef.current = next;
    cancelDebounce();
    const dateCaptured = dateISO;
    debounceTimerRef.current = window.setTimeout(() => {
      if (dateRef.current !== dateCaptured) return;
      flushMetricsForDate(dateCaptured).catch(() => {});
    }, METRICS_DEBOUNCE_MS);
  }

  useEffect(() => () => cancelDebounce(), []);

  const updateMetric = (key: "steps" | "kcal" | "weight", val: string) => {
    const next = { ...pendingRef.current, [key]: val };
    setMetrics(next);
    scheduleFlush(next);
  };

  const changeDate = async (delta: number) => {
    await flushMetricsForDate(dateISO).catch(() => {});
    const d = addDays(currentDate, delta);
    setSearchParams({ date: format(d, "yyyy-MM-dd") });
  };

  // Workout data
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [masters, setMasters] = useState<WorkoutExerciseRow[]>([]);
  const [setsByMaster, setSetsByMaster] = useState<Record<string, WorkoutExerciseSetRow[]>>({});
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [dayEvents, setDayEvents] = useState<EventRow[]>([]);

  // Drawer add master
  const [masterOpen, setMasterOpen] = useState(false);
  const [masterForm, setMasterForm] = useState({
    exercise_name: "",
    load_type: "KG" as "KG" | "PDC_PLUS",
    weight: "",
    reps: "",
  });

  // Suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Drawer add set
  const [setOpen, setSetOpen] = useState(false);
  const [setTarget, setSetTarget] = useState<WorkoutExerciseRow | null>(null);
  const [newSet, setNewSet] = useState({ reps: "", weight: "", load_type: "KG" as "KG" | "PDC_PLUS" });

  function openAddSetDrawer(ex: WorkoutExerciseRow) {
    setSetTarget(ex);
    setNewSet({ reps: "", weight: "", load_type: ex.load_type === "PDC_PLUS" ? "PDC_PLUS" : "KG" });
    setSetOpen(true);
  }

  function closeAddSetDrawer() {
    setSetOpen(false);
    setSetTarget(null);
  }

  useEffect(() => {
    const param = searchParams.get("date");
    if (!param || !isValid(parseISO(param))) {
      setSearchParams({ date: dateISO }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    listCatalogExercises().then((c) => alive && setCatalog(c)).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    cancelDebounce();

    async function load() {
      const [m, workout, evs] = await Promise.all([
        getDailyMetricsByDate(dateISO),
        getOrCreateWorkout(dateISO),
        getEventsOverlappingRange(dateISO, dateISO),
      ]);

      if (!alive) return;

      const nextMetrics = {
        steps: m?.steps != null ? String(m.steps) : "",
        kcal: m?.kcal != null ? String(m.kcal) : "",
        weight: m?.weight_g != null ? String(m.weight_g / 1000) : "",
      };
      setMetrics(nextMetrics);
      pendingRef.current = nextMetrics;

      setDayEvents(evs ?? []);

      setWorkoutId(workout.id);

      const ex = await getWorkoutExercises(workout.id);
      if (!alive) return;
      setMasters(ex);

      const entries = await Promise.all(
        ex.map(async (master) => {
          const sets = await getExerciseSets(master.id);
          return [master.id, sets] as const;
        })
      );
      if (!alive) return;
      setSetsByMaster(Object.fromEntries(entries));
    }

    load().catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  const deleteMaster = async (id: string) => {
    await deleteWorkoutExercise(id);
    setMasters((prev) => prev.filter((e) => e.id !== id));
    setSetsByMaster((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const onAddSet = async () => {
    if (!setTarget) return;
    const reps = toIntOrNull(newSet.reps);
    if (reps == null) return;

    const existing = setsByMaster[setTarget.id] ?? [];
    await addExerciseSet({
      workout_exercise_id: setTarget.id,
      reps,
      load_type: newSet.load_type,
      load_g: toGramsOrNull(newSet.weight),
      sort_order: existing.length,
    });

    const sets = await getExerciseSets(setTarget.id);
    setSetsByMaster((prev) => ({ ...prev, [setTarget.id]: sets }));
    closeAddSetDrawer();
  };

  const deleteSet = async (setId: string) => {
    await deleteExerciseSet(setId);
    setSetsByMaster((prev) => {
      const copy: Record<string, WorkoutExerciseSetRow[]> = {};
      for (const k of Object.keys(prev)) copy[k] = prev[k].filter((s) => s.id !== setId);
      return copy;
    });
  };

  const openMasterDrawer = () => {
    setMasterForm({ exercise_name: "", load_type: "KG", weight: "", reps: "" });
    setShowSuggestions(false);
    setMasterOpen(true);
  };

  const closeMasterDrawer = () => {
    setMasterOpen(false);
  };

  const onAddMaster = async () => {
    if (!workoutId) return;

    const name = masterForm.exercise_name.trim();
    if (!name) return;

    const reps = toIntOrNull(masterForm.reps);
    if (reps == null) return;

    await addWorkoutExercise({
      workout_id: workoutId,
      exercise_name: name,
      reps,
      load_g: toGramsOrNull(masterForm.weight),
      load_type: masterForm.load_type,
      sort_order: masters.length,
    });

    const ex = await getWorkoutExercises(workoutId);
    setMasters(ex);

    const nextMap = { ...setsByMaster };
    for (const m of ex) if (!nextMap[m.id]) nextMap[m.id] = await getExerciseSets(m.id);
    setSetsByMaster(nextMap);

    closeMasterDrawer();
  };

  const primary = dayEvents[0] ?? null;
  const primaryColor = primary?.color && isHex6(primary.color) ? primary.color : "#FFA94D";

  const masterReps = toIntOrNull(masterForm.reps);
  const masterCanValidate = masterForm.exercise_name.trim().length > 0 && masterReps !== null;

  const setReps = toIntOrNull(newSet.reps);
  const setCanValidate = setReps !== null;


  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex flex-col items-center mb-10">
        <div className="w-32 h-32 relative rounded-full border border-white/10 overflow-hidden mb-8 shadow-2xl">
          <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) changeDate(-1);
            if (info.offset.x < -50) changeDate(1);
          }}
          className="flex items-center justify-between w-full cursor-grab active:cursor-grabbing bg-white/5 py-4 rounded-3xl border border-white/5"
        >
          <button onClick={() => changeDate(-1)} className="p-2 text-white/20 hover:text-white">
            <ChevronLeft size={32} />
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">
              {format(currentDate, "EEEE d", { locale: fr })}
            </h1>

            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </p>

            {dayEvents.length > 0 && (
              <button type="button" onClick={() => navigate("/week?note=1")} className="mt-2" aria-label="Ouvrir le planning">
                <div className="flex flex-col items-center gap-1">
                  {dayEvents.slice(0, MAX_DOTS).map((ev) => {
                    const c = isHex6(ev.color) ? ev.color : "#FFFFFF";
                    return (
                      <div key={ev.id} className="flex items-center justify-center gap-2">
                        <Sparkles size={12} style={{ color: primaryColor }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-[10px] font-black uppercase italic tracking-widest" style={{ color: c }}>
                          {ev.title}
                        </span>
                      </div>
                    );
                  })}
                  {dayEvents.length > MAX_DOTS && (
                    <div className="text-[10px] font-black uppercase italic tracking-widest text-white/30">
                      +{dayEvents.length - MAX_DOTS}
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>

          <button onClick={() => changeDate(1)} className="p-2 text-white/20 hover:text-white">
            <ChevronRight size={32} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-12">
        <StatBubble name="steps" icon={Footprints} label="Pas" value={metrics.steps} onChange={(v) => updateMetric("steps", v)} onBlur={() => flushMetricsForDate(dateISO).catch(() => {})} accent inputMode="numeric" placeholder="" />
        <StatBubble name="kcal" icon={Flame} label="Kcal" value={metrics.kcal} onChange={(v) => updateMetric("kcal", v)} onBlur={() => flushMetricsForDate(dateISO).catch(() => {})} colorClass="text-yellow-200" inputMode="numeric" placeholder="" />
        <StatBubble name="weight" icon={Weight} label="Kg" value={metrics.weight} onChange={(v) => updateMetric("weight", v)} onBlur={() => flushMetricsForDate(dateISO).catch(() => {})} colorClass="text-purple-500" inputMode="decimal" placeholder="" />
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">Ma Séance</h2>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {masters.map((ex) => (
              <MasterRow
                key={ex.id}
                ex={ex}
                sets={setsByMaster[ex.id] ?? []}
                onDeleteMaster={deleteMaster}
                onDeleteSet={deleteSet}
                onOpenAddSet={openAddSetDrawer}
              />
            ))}
          </AnimatePresence>

          <button
            onClick={openMasterDrawer}
            className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-white/20"
          >
            <Plus size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Nouveau mouvement</span>
          </button>
        </div>
      </div>

      {/* DRAWER ADD MASTER */}
      <AnimatePresence>
        {masterOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer"
              onClick={closeMasterDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                const shouldClose = info.offset.y > 90 || info.velocity.y > 600;
                if (shouldClose) closeMasterDrawer();
              }}
              initial={{ y: 700 }}
              animate={{ y: 0 }}
              exit={{ y: 700 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2.5rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-[0_-30px_80px_rgba(0,0,0,0.75)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase italic tracking-widest text-white/70">Ajouter Exercice</h2>
                    <button type="button" onClick={closeMasterDrawer} className="p-2 text-white/30 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-6 max-h-[75vh] overflow-auto no-scrollbar space-y-4">
                    <div className="glass-card p-6 rounded-[2rem] space-y-4 border border-white/10">
                      <input
                        placeholder="Exercice..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold uppercase italic outline-none focus:border-menthe"
                        value={masterForm.exercise_name}
                        onChange={(e) => {
                          setMasterForm({ ...masterForm, exercise_name: e.target.value });
                          setShowSuggestions(true);
                        }}
                      />

                      {showSuggestions && masterForm.exercise_name.trim().length > 0 && (
                        <div className="max-h-48 overflow-auto no-scrollbar space-y-2">
                          {catalog
                            .filter((c) => c.name.toLowerCase().includes(masterForm.exercise_name.toLowerCase()))
                            .slice(0, 8)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setMasterForm({ ...masterForm, exercise_name: c.name });
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-xs text-white/70 hover:border-menthe/40"
                              >
                                {c.name}
                              </button>
                            ))}
                        </div>
                      )}

                      <div className="flex bg-white/5 rounded-xl p-1 h-11">
                        {(["KG", "PDC_PLUS"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`flex-1 rounded-lg font-black text-[9px] uppercase ${
                              masterForm.load_type === type ? "bg-menthe text-black" : "text-white/30"
                            }`}
                            onClick={() => setMasterForm({ ...masterForm, load_type: type })}
                          >
                            {type === "PDC_PLUS" ? "PDC+" : "KG"}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="kg"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black outline-none"
                          value={masterForm.weight}
                          onChange={(e) => setMasterForm({ ...masterForm, weight: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="reps*"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black outline-none"
                          value={masterForm.reps}
                          onChange={(e) => setMasterForm({ ...masterForm, reps: e.target.value })}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!masterCanValidate}
                        onClick={onAddMaster}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                          masterCanValidate ? "bg-menthe text-black" : "bg-white/5 text-white/20 border border-white/10"
                        }`}
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER ADD SET */}
      <AnimatePresence>
        {setOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer"
              onClick={closeAddSetDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                const shouldClose = info.offset.y > 90 || info.velocity.y > 600;
                if (shouldClose) closeAddSetDrawer();
              }}
              initial={{ y: 700 }}
              animate={{ y: 0 }}
              exit={{ y: 700 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2.5rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-[0_-30px_80px_rgba(0,0,0,0.75)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase italic tracking-widest text-white/70">Ajouter Set</h2>
                    <button type="button" onClick={closeAddSetDrawer} className="p-2 text-white/30 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-6 max-h-[75vh] overflow-auto no-scrollbar space-y-4">
                    <div className="glass-card p-6 rounded-[2rem] space-y-4 border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {setTarget?.exercise_name ?? ""}
                      </p>

                      <div className="flex bg-white/5 rounded-xl p-1 h-11">
                        {(["KG", "PDC_PLUS"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`flex-1 rounded-lg font-black text-[9px] uppercase ${
                              newSet.load_type === type ? "bg-menthe text-black" : "text-white/30"
                            }`}
                            onClick={() => setNewSet({ ...newSet, load_type: type })}
                          >
                            {type === "PDC_PLUS" ? "PDC+" : "KG"}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="kg"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black outline-none"
                          value={newSet.weight}
                          onChange={(e) => setNewSet({ ...newSet, weight: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="reps*"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-black outline-none"
                          value={newSet.reps}
                          onChange={(e) => setNewSet({ ...newSet, reps: e.target.value })}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!setCanValidate}
                        onClick={onAddSet}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                          setCanValidate ? "bg-menthe text-black" : "bg-white/5 text-white/20 border border-white/10"
                        }`}
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
