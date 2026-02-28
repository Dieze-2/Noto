import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import {
  addWorkoutExercise,
  getOrCreateWorkout,
  getWorkoutExercises,
  deleteWorkoutExercise, // On va l'ajouter juste après dans workouts.ts
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

  // New Exercise Form
  const [newName, setNewName] = useState("");
  const [newLoadType, setNewLoadType] = useState<LoadType>("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const m = await getDailyMetricsByDate(date);
        if (m) {
          setStepsStr(m.steps?.toString() ?? "");
          setKcalStr(m.kcal?.toString() ?? "");
          setWeightKgStr(m.weight_g ? formatKgFR(gramsToKg(m.weight_g), 1).replace(',', '.') : "");
          setNote(m.note ?? "");
        }

        const w = await getOrCreateWorkout(date);
        setWorkoutId(w.id);
        const exs = await getWorkoutExercises(w.id);
        setExercises(exs);

        const cat = await listCatalogExercises();
        setCatalog(cat);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [date]);

  const handleSaveMetrics = async () => {
    setSaving(true);
    try {
      const s = parseInt(stepsStr) || null;
      const k = parseInt(kcalStr) || null;
      const wGrams = weightKgStr ? kgToGramsInt(parseDecimalFlexible(weightKgStr)) : null;
      await upsertDailyMetrics({ date, steps: s, kcal: k, weight_g: wGrams, note });
      alert("Enregistré !");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExercise = async () => {
    if (!workoutId || !newName) return;
    try {
      const loadG = (newLoadType === "KG" || newLoadType === "PDC_PLUS") 
        ? kgToGramsInt(parseDecimalFlexible(newLoadVal)) 
        : null;
      const loadText = newLoadType === "TEXT" ? newLoadVal : null;
      const reps = parseInt(newReps) || null;

      await addWorkoutExercise({
        workout_id: workoutId,
        exercise_name: newName,
        load_type: newLoadType,
        load_g: loadG,
        load_text: loadText,
        reps,
        comment: newComment,
        sort_order: exercises.length,
      });

      // Reset & Reload
      setNewName("");
      setNewLoadVal("");
      setNewReps("");
      setNewComment("");
      const updated = await getWorkoutExercises(workoutId);
      setExercises(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEx = async (id: string) => {
    if (!confirm("Supprimer cet exercice ?")) return;
    try {
      await deleteWorkoutExercise(id);
      setExercises(prev => prev.filter(ex => ex.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Chargement du jour...</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Aujourd'hui</h1>
        <p className="text-slate-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {/* SECTION METRIQUES */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">📊 Métriques</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 uppercase">Pas</label>
            <input 
              type="number" value={stepsStr} onChange={e => setStepsStr(e.target.value)}
              className="border-b-2 border-slate-100 focus:border-blue-500 outline-none py-1 text-lg" placeholder="0"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 uppercase">Kcal</label>
            <input 
              type="number" value={kcalStr} onChange={e => setKcalStr(e.target.value)}
              className="border-b-2 border-slate-100 focus:border-blue-500 outline-none py-1 text-lg" placeholder="0"
            />
          </div>
          <div className="flex flex-col col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase">Poids (kg)</label>
            <input 
              type="text" inputMode="decimal" value={weightKgStr} onChange={e => setWeightKgStr(e.target.value)}
              className="border-b-2 border-slate-100 focus:border-blue-500 outline-none py-1 text-lg" placeholder="0,0"
            />
          </div>
        </div>
        <button 
          onClick={handleSaveMetrics} disabled={saving}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Mettre à jour les métriques"}
        </button>
      </section>

      {/* SECTION ENTRAINEMENT */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">🏋️ Entraînement</h2>
        
        {/* Liste des exercices */}
        <div className="space-y-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-800">{ex.exercise_name}</div>
                <div className="text-sm text-slate-600 mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded mr-2">{renderLoad(ex)}</span>
                  {ex.reps && <span>× {ex.reps} reps</span>}
                </div>
                {ex.comment && <div className="text-xs text-slate-400 mt-2 italic">{ex.comment}</div>}
              </div>
              <button onClick={() => handleDeleteEx(ex.id)} className="text-slate-300 hover:text-red-500 p-1">
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire ajout */}
        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <input 
            list="catalog-list" placeholder="Nom de l'exercice..."
            value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full p-2 rounded-lg border-slate-200 border outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="catalog-list">
            {catalog.map(c => <option key={c.name} value={c.name} />)}
          </datalist>

          <div className="flex gap-2">
            <select 
              value={newLoadType} onChange={e => setNewLoadType(e.target.value as LoadType)}
              className="p-2 rounded-lg border-slate-200 border bg-white"
            >
              <option value="KG">KG</option>
              <option value="PDC">PDC</option>
              <option value="PDC_PLUS">PDC+</option>
              <option value="TEXT">Texte</option>
            </select>
            <input 
              placeholder="Charge" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)}
              disabled={newLoadType === "PDC"}
              className="flex-1 p-2 rounded-lg border-slate-200 border outline-none"
            />
            <input 
              placeholder="Reps" type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
              className="w-20 p-2 rounded-lg border-slate-200 border outline-none"
            />
          </div>
          <button 
            onClick={handleAddExercise}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            + Ajouter l'exercice
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