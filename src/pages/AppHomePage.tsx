import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import {
  addWorkoutExercise,
  getOrCreateWorkout,
  getWorkoutExercises,
  deleteWorkoutExercise,
} from "../db/workouts";
import type { WorkoutExerciseRow } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

type LoadType = "PDC" | "PDC_PLUS" | "KG" | "TEXT";

export default function TodayPage() {
  const date = useMemo(() => todayISO(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Metrics
  const [stepsStr, setStepsStr] = useState("");
  const [kcalStr, setKcalStr] = useState("");
  const [weightKgStr, setWeightKgStr] = useState("");
  const [note, setNote] = useState("");

  // Workout
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);
  const [catalog, setCatalog] = useState<{ name: string }[]>([]);

  // New exercise form
  const [newExName, setNewExName] = useState("");
  const [newLoadType, setNewLoadType] = useState<LoadType>("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [m, cat] = await Promise.all([
          getDailyMetricsByDate(date),
          listCatalogExercises(),
        ]);
        setCatalog(cat);
        if (m) {
          setStepsStr(m.steps?.toString() ?? "");
          setKcalStr(m.kcal?.toString() ?? "");
          setWeightKgStr(m.weight_g ? gramsToKg(m.weight_g).toString() : "");
          setNote(m.note ?? "");
        }
        const w = await getOrCreateWorkout(date);
        setWorkoutId(w.id);
        setExercises(await getWorkoutExercises(w.id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    init();
  }, [date]);

  async function handleSaveMetrics() {
    setSaving(true);
    try {
      const wGrams = weightKgStr ? kgToGramsInt(parseDecimalFlexible(weightKgStr) ?? 0) : null;
      await upsertDailyMetrics({
        date,
        steps: stepsStr.trim() ? parseInt(stepsStr) : null,
        kcal: kcalStr.trim() ? parseInt(kcalStr) : null,
        weight_g: wGrams,
        note: note.trim() || null,
      });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleAddExercise() {
    if (!workoutId || !newExName.trim()) return;
    try {
      const loadG = (newLoadType === "KG" || newLoadType === "PDC_PLUS")
        ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0)
        : null;
      await addWorkoutExercise({
        workout_id: workoutId,
        exercise_name: newExName.trim(),
        load_type: newLoadType,
        load_g: loadG,
        load_text: newLoadType === "TEXT" ? newLoadVal : null,
        reps: newReps.trim() ? parseInt(newReps) : null,
      });
      setNewExName(""); setNewLoadVal(""); setNewReps("");
      setExercises(await getWorkoutExercises(workoutId));
    } catch (e: any) { alert(e.message); }
  }

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Initialisation...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-10 antialiased">
      {/* Header Minimaliste */}
      <header className="flex justify-between items-end px-2">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-500 uppercase mb-1">Aujourd'hui</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Statistiques</h1>
        </div>
        <button
          onClick={handleSaveMetrics}
          disabled={saving}
          className="relative px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
      </header>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-2 gap-4">
        <MetricCard 
            label="Pas" 
            value={stepsStr} 
            onChange={setStepsStr} 
            placeholder="0" 
            unit="steps"
            icon="👣"
        />
        <MetricCard 
            label="Calories" 
            value={kcalStr} 
            onChange={setKcalStr} 
            placeholder="0" 
            unit="kcal"
            icon="🔥"
        />
        <div className="col-span-2">
          <MetricCard 
              label="Poids Corporel" 
              value={weightKgStr} 
              onChange={setWeightKgStr} 
              placeholder="00.0" 
              unit="kg"
              icon="⚖️"
          />
        </div>
      </section>

      {/* Note du jour - Glassmorphism Card */}
      <div className="group relative overflow-hidden rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 p-1 transition-all focus-within:ring-2 ring-indigo-500/30">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Une réflexion sur la séance ?"
          className="w-full bg-transparent p-4 text-sm text-slate-700 dark:text-slate-200 outline-none min-h-[100px] placeholder:text-slate-400"
        />
      </div>

      {/* Workout Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Entraînement</h2>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {exercises.length} Exos
            </span>
        </div>

        <div className="space-y-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:translate-x-1">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{ex.exercise_name}</h3>
                <p className="text-sm font-medium text-slate-400">
                    <span className="text-indigo-500">{renderLoad(ex)}</span>
                    {ex.reps && <span className="ml-2">× {ex.reps} reps</span>}
                </p>
              </div>
              <button onClick={() => deleteWorkoutExercise(ex.id).then(() => getWorkoutExercises(workoutId!).then(setExercises))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire ajout rapide */}
        <div className="p-6 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 space-y-4">
          <input
            list="catalog-list"
            placeholder="Nom de l'exercice..."
            value={newExName}
            onChange={(e) => setNewExName(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-inner outline-none focus:ring-2 ring-indigo-500/20 transition-all dark:text-white"
          />
          <datalist id="catalog-list">
            {catalog.map(c => <option key={c.name} value={c.name} />)}
          </datalist>

          <div className="flex gap-3">
            <select
              value={newLoadType}
              onChange={(e) => setNewLoadType(e.target.value as LoadType)}
              className="bg-white dark:bg-slate-900 px-3 py-3 rounded-2xl text-xs font-bold text-indigo-600 uppercase tracking-wider outline-none"
            >
              <option value="KG">KG</option>
              <option value="PDC">PDC</option>
              <option value="PDC_PLUS">PDC+</option>
              <option value="TEXT">T-XT</option>
            </select>
            <input
              placeholder="Charge"
              value={newLoadVal}
              onChange={(e) => setNewLoadVal(e.target.value)}
              disabled={newLoadType === "PDC"}
              className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-2xl outline-none text-center font-bold text-slate-700 dark:text-white"
            />
            <input
              placeholder="Reps"
              type="number"
              value={newReps}
              onChange={(e) => setNewReps(e.target.value)}
              className="w-20 bg-white dark:bg-slate-900 p-3 rounded-2xl outline-none text-center font-bold text-slate-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleAddExercise}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all"
          >
            Ajouter au log
          </button>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, onChange, placeholder, unit, icon }: any) {
    return (
        <div className="relative group bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all focus-within:border-indigo-500/50">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
                <span className="text-lg opacity-60 group-focus-within:opacity-100 transition-opacity">{icon}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full text-2xl font-black bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{unit}</span>
            </div>
        </div>
    );
}

function renderLoad(ex: WorkoutExerciseRow): string {
  if (ex.load_type === "PDC") return "Poids du corps";
  if (ex.load_type === "PDC_PLUS") return `Lesté ${ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : "?"}kg`;
  if (ex.load_type === "KG") return `${ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : "?"}kg`;
  return ex.load_text ?? "-";
}