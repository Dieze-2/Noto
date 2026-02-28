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
  const [catalog, setCatalog] = useState<{ name: string; youtube_url?: string | null }[]>([]);

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
        const exList = await getWorkoutExercises(w.id);
        setExercises(exList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [date]);

  async function handleSaveMetrics() {
    setSaving(true);
    try {
      const s = stepsStr.trim() ? parseInt(stepsStr) : null;
      const k = kcalStr.trim() ? parseInt(kcalStr) : null;
      // Correction erreur TS77: ajout de ?? 0 pour éviter le type null
      const wGrams = weightKgStr ? kgToGramsInt(parseDecimalFlexible(weightKgStr) ?? 0) : null;

      await upsertDailyMetrics({
        date,
        steps: isNaN(s as number) ? null : s,
        kcal: isNaN(k as number) ? null : k,
        weight_g: wGrams,
        note: note.trim() || null,
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExercise() {
    if (!workoutId || !newExName.trim()) return;
    try {
      // Correction erreur TS91: ajout de ?? 0
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

      setNewExName("");
      setNewLoadVal("");
      setNewReps("");
      setExercises(await getWorkoutExercises(workoutId));
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleDeleteExercise(id: string) {
    if (!workoutId || !confirm("Supprimer ?")) return;
    try {
      await deleteWorkoutExercise(id);
      setExercises(await getWorkoutExercises(workoutId));
    } catch (e: any) {
      alert(e.message);
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Aujourd'hui</h1>
        <button
          onClick={handleSaveMetrics}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
      </header>

      {/* Métriques */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pas</label>
            <input
              type="number"
              value={stepsStr}
              onChange={(e) => setStepsStr(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kcal</label>
            <input
              type="number"
              value={kcalStr}
              onChange={(e) => setKcalStr(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poids (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              value={weightKgStr}
              onChange={(e) => setWeightKgStr(e.target.value)}
              className="w-full text-lg font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors"
              placeholder="0,0"
            />
          </div>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note du jour..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm dark:text-slate-200 outline-none min-h-[80px]"
        />
      </section>

      {/* Entraînement */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white px-1">Entraînement</h2>

        <div className="space-y-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
              <div>
                <div className="font-bold dark:text-white">{ex.exercise_name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {renderLoad(ex)} {ex.reps ? `× ${ex.reps}` : ""}
                </div>
              </div>
              <button
                onClick={() => handleDeleteExercise(ex.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Ajouter exercice */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3">
          <input
            list="catalog-list"
            placeholder="Nom de l'exercice..."
            value={newExName}
            onChange={(e) => setNewExName(e.target.value)}
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-sm outline-none border-none"
          />
          <datalist id="catalog-list">
            {catalog.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>

          <div className="flex gap-2">
            <select
              value={newLoadType}
              onChange={(e) => setNewLoadType(e.target.value as LoadType)}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-sm outline-none border-none text-sm"
            >
              <option value="KG">KG</option>
              <option value="PDC">PDC</option>
              <option value="PDC_PLUS">PDC+</option>
              <option value="TEXT">Texte</option>
            </select>
            <input
              placeholder="Charge"
              value={newLoadVal}
              onChange={(e) => setNewLoadVal(e.target.value)}
              disabled={newLoadType === "PDC"}
              className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-sm outline-none border-none text-sm disabled:opacity-50"
            />
            <input
              placeholder="Reps"
              type="number"
              value={newReps}
              onChange={(e) => setNewReps(e.target.value)}
              className="w-20 p-3 rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-sm outline-none border-none text-sm"
            />
          </div>
          <button
            onClick={handleAddExercise}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
          >
            Ajouter l'exercice
          </button>
        </div>
      </section>
    </div>
  );
}

function renderLoad(ex: WorkoutExerciseRow): string {
  if (ex.load_type === "PDC") return "PDC";
  if (ex.load_type === "PDC_PLUS") return `PDC + ${ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : "?"}kg`;
  if (ex.load_type === "KG") return `${ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : "?"}kg`;
  return ex.load_text ?? "-";
}