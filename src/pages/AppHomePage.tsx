import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useTransform, useMotionValue } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2 } from "lucide-react";

import StatBubble from "../components/StatBubble";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { getOrCreateWorkout, getWorkoutExercises, addWorkoutExercise, deleteWorkoutExercise, WorkoutExerciseRow } from "../db/workouts";
import { listCatalogExercises, CatalogExercise } from "../db/catalog";

function getISODateFromParams(dateParam: string | null): string {
  if (dateParam && isValid(parseISO(dateParam))) return dateParam;
  return format(new Date(), "yyyy-MM-dd");
}

function ExerciseRow({
  ex,
  onDelete,
}: {
  ex: WorkoutExerciseRow;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-100, 0], [1, 0]);

  return (
    <motion.div
      key={ex.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative"
    >
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-rose-600 rounded-[1.5rem]" />

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) onDelete(ex.id);
        }}
        className="relative"
      >
        <GlassCard className="p-4 flex justify-between items-center border-white/5">
          <div className="flex items-center gap-4">
            <Dumbbell className="text-menthe" size={20} />
            <div>
              <p className="font-black text-white uppercase italic leading-none">{ex.exercise_name}</p>
              <p className="text-[11px] font-bold text-white/40 mt-1 uppercase">
                {ex.load_type === "PDC_PLUS"
                  ? `PDC + ${(ex.load_g ?? 0) / 1000}`
                  : `${(ex.load_g ?? 0) / 1000}`}{" "}
                kg • <span className="text-menthe">{ex.reps ?? 0} reps</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(ex.id)}
            className="p-2 text-white/10 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default function AppHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const dateISO = useMemo(() => getISODateFromParams(searchParams.get("date")), [searchParams]);
  const currentDate = useMemo(() => parseISO(dateISO), [dateISO]);

  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ reps: "", weight: "", load_type: "KG" as "KG" | "PDC_PLUS" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Assure un URL canonique (si date absente/invalide)
  useEffect(() => {
    const param = searchParams.get("date");
    if (!param || !isValid(parseISO(param))) {
      setSearchParams({ date: dateISO }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger le catalogue une seule fois
  useEffect(() => {
    let alive = true;
    listCatalogExercises()
      .then((cat) => {
        if (!alive) return;
        setCatalog(cat);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Charger données liées à la date (metrics + workout)
  useEffect(() => {
    let alive = true;

    async function loadData() {
      const [m, workout] = await Promise.all([getDailyMetricsByDate(dateISO), getOrCreateWorkout(dateISO)]);

      if (!alive) return;

      setMetrics({
        steps: m?.steps?.toString() || "",
        kcal: m?.kcal?.toString() || "",
        weight: m?.weight_g ? (m.weight_g / 1000).toString() : "",
      });

      const ex = await getWorkoutExercises(workout.id);
      if (!alive) return;
      setExercises(ex);
    }

    loadData().catch(() => {});
    return () => {
      alive = false;
    };
  }, [dateISO]);

  const updateMetric = async (key: "steps" | "kcal" | "weight", val: string) => {
    const newMetrics = { ...metrics, [key]: val };
    setMetrics(newMetrics);

    await upsertDailyMetrics({
      date: dateISO,
      steps: parseInt(newMetrics.steps) || 0,
      kcal: parseInt(newMetrics.kcal) || 0,
      weight_g: Math.round((parseFloat(newMetrics.weight) || 0) * 1000),
      note: null,
    });
  };

  const changeDate = (delta: number) => {
    const d = addDays(currentDate, delta);
    const nextISO = format(d, "yyyy-MM-dd");
    setSearchParams({ date: nextISO });
  };

  const onAdd = async () => {
    if (!searchTerm.trim()) return;

    const workout = await getOrCreateWorkout(dateISO);
    await addWorkoutExercise({
      workout_id: workout.id,
      exercise_name: searchTerm.trim(),
      reps: parseInt(newEx.reps) || 0,
      load_g: Math.round((parseFloat(newEx.weight) || 0) * 1000),
      load_type: newEx.load_type,
      sort_order: exercises.length,
    });

    const ex = await getWorkoutExercises(workout.id);
    setExercises(ex);
    setShowAddForm(false);
    setSearchTerm("");
    setNewEx({ reps: "", weight: "", load_type: "KG" });
    setShowSuggestions(false);
  };

  const handleDelete = async (id: string) => {
    await deleteWorkoutExercise(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

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
          </div>
          <button onClick={() => changeDate(1)} className="p-2 text-white/20 hover:text-white">
            <ChevronRight size={32} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-12">
        <StatBubble icon={Footprints} label="Pas" value={metrics.steps} onChange={(v) => updateMetric("steps", v)} accent />
        <StatBubble icon={Flame} label="Kcal" value={metrics.kcal} onChange={(v) => updateMetric("kcal", v)} colorClass="text-yellow-200" />
        <StatBubble icon={Weight} label="Poids" value={metrics.weight} onChange={(v) => updateMetric("weight", v)} unit="kg" colorClass="text-purple-500" />
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">Ma Séance</h2>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {exercises.map((ex) => (
              <ExerciseRow key={ex.id} ex={ex} onDelete={handleDelete} />
            ))}
          </AnimatePresence>

          {showAddForm ? (
            <GlassCard className="p-6 border-menthe/30 space-y-4">
              <input
                placeholder="Exercice..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold uppercase italic outline-none focus:border-menthe"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex bg-white/5 rounded-xl p-1 h-11">
                  {(["KG", "PDC_PLUS"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`flex-1 rounded-lg font-black text-[9px] uppercase ${
                        newEx.load_type === type ? "bg-menthe text-black" : "text-white/30"
                      }`}
                      onClick={() => setNewEx({ ...newEx, load_type: type })}
                    >
                      {type === "PDC_PLUS" ? "PDC+" : "KG"}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="kg"
                  className="bg-white/5 border border-white/10 rounded-xl px-2 text-center font-black outline-none"
                  value={newEx.weight}
                  onChange={(e) => setNewEx({ ...newEx, weight: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="reps"
                  className="bg-white/5 border border-white/10 rounded-xl px-2 text-center font-black outline-none"
                  value={newEx.reps}
                  onChange={(e) => setNewEx({ ...newEx, reps: e.target.value })}
                />
              </div>

              {/* Suggestions (optionnel, basique) */}
              {showSuggestions && searchTerm.trim().length > 0 && catalog.length > 0 && (
                <div className="max-h-48 overflow-auto no-scrollbar space-y-2">
                  {catalog
                    .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, 8)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSearchTerm(c.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-xs text-white/70 hover:border-menthe/40"
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowSuggestions(false);
                  }}
                  className="flex-1 py-3 bg-white/5 rounded-xl font-black uppercase text-xs"
                >
                  Annuler
                </button>
                <button type="button" onClick={onAdd} className="flex-1 py-3 bg-menthe rounded-xl font-black uppercase text-xs text-black">
                  Valider
                </button>
              </div>
            </GlassCard>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-white/20"
            >
              <Plus size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-2">Nouveau mouvement</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
