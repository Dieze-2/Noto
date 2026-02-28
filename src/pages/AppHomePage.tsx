import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise, getLastExerciseByName } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"KG" | "PDC" | "PDC_PLUS">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [subSeries, setSubSeries] = useState("");
  const [lastPerf, setLastPerf] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const m = await getDailyMetricsByDate(dateStr);
      setMetrics(m ? {
        steps: m.steps?.toString() ?? "",
        kcal: m.kcal?.toString() ?? "",
        weight: m.weight_g ? gramsToKg(m.weight_g).toString() : "",
        note: m.note ?? ""
      } : { steps: "", kcal: "", weight: "", note: "" });
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const updateMetric = async (key: keyof typeof metrics, val: string) => {
    const newMetrics = { ...metrics, [key]: val };
    setMetrics(newMetrics);
    await upsertDailyMetrics({
      date: dateStr,
      steps: parseInt(newMetrics.steps) || null,
      kcal: parseInt(newMetrics.kcal) || null,
      weight_g: kgToGramsInt(parseDecimalFlexible(newMetrics.weight) ?? 0),
      note: newMetrics.note
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-32 space-y-6">
      {/* Header avec contraste fort */}
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 font-black text-mineral-900 dark:text-white text-xl">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-sauge-600 dark:text-menthe-flash">Aujourd'hui</p>
          <p className="font-black capitalize text-mineral-900 dark:text-white text-lg">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 font-black text-mineral-900 dark:text-white text-xl">→</button>
      </nav>

      {/* Saisie Bio-Métriques Look Moderne */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2rem] border-b-2 border-sauge-200 dark:border-menthe-flash/20">
          <label className="text-[9px] font-black uppercase text-sauge-600 dark:text-menthe-flash/60 mb-2 block">Poids corporel</label>
          <div className="flex items-baseline gap-1">
            <input type="text" inputMode="decimal" value={metrics.weight} onChange={e => updateMetric('weight', e.target.value)}
              className="w-full bg-transparent font-black text-2xl text-mineral-950 dark:text-white" placeholder="0.0" />
            <span className="text-xs font-bold opacity-30">KG</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[2rem] border-b-2 border-sauge-200 dark:border-menthe-flash/20">
          <label className="text-[9px] font-black uppercase text-sauge-600 dark:text-menthe-flash/60 mb-2 block">Activité Pas</label>
          <input type="number" value={metrics.steps} onChange={e => updateMetric('steps', e.target.value)}
            className="w-full bg-transparent font-black text-2xl text-mineral-950 dark:text-white" placeholder="0" />
        </div>
      </div>

      {/* Saisie Exercice Unifiée */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="space-y-4">
          <div className="bg-sauge-50/50 dark:bg-mineral-950/40 p-4 rounded-2xl">
             <label className="text-[9px] font-black uppercase text-sauge-600 dark:text-menthe-flash/60 mb-1 block">Mouvement</label>
             <input placeholder="Ex: Développé Couché" value={newName} onChange={e => setNewName(e.target.value)}
               className="w-full bg-transparent font-black text-lg text-mineral-950 dark:text-white" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-sauge-50/50 dark:bg-mineral-950/40 p-4 rounded-2xl">
               <label className="text-[9px] font-black uppercase text-sauge-600 dark:text-menthe-flash/60 mb-1 block">Charge</label>
               <div className="flex gap-2">
                 <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-transparent font-black text-xs uppercase">
                   <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC+</option>
                 </select>
                 <input type="text" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)}
                   className="w-full bg-transparent font-black text-lg text-mineral-950 dark:text-white text-right" placeholder="0" />
               </div>
            </div>
            <div className="w-24 bg-sauge-50/50 dark:bg-mineral-950/40 p-4 rounded-2xl text-center">
               <label className="text-[9px] font-black uppercase text-sauge-600 dark:text-menthe-flash/60 mb-1 block">Reps</label>
               <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
                 className="w-full bg-transparent font-black text-lg text-mineral-950 dark:text-white text-center" placeholder="0" />
            </div>
          </div>
        </div>

        <button onClick={async () => {
            if (!workoutId || !newName) return;
            await addWorkoutExercise({
              workout_id: workoutId, exercise_name: newName, load_type: newLoadType,
              load_g: newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0) : null,
              reps: parseInt(newReps) || null, comment: subSeries || null
            });
            setNewName(""); setExercises(await getWorkoutExercises(workoutId));
          }}
          className="w-full bg-mineral-900 dark:bg-menthe-flash text-white dark:text-mineral-950 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl"
        >
          Enregistrer Performance
        </button>
      </section>

      {/* Liste avec texte foncé en mode clair */}
      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-3xl border-l-4 border-sauge-600 dark:border-menthe-flash flex justify-between items-center">
            <div>
              <h3 className="font-black text-mineral-950 dark:text-white">{ex.exercise_name}</h3>
              <p className="text-[10px] font-bold text-sauge-600 dark:text-menthe-flash/60 uppercase">{ex.load_type} {ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : ""} • {ex.reps} reps</p>
            </div>
            <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(e => e.id !== ex.id)); }} className="text-rose-500 font-black text-[9px] uppercase tracking-widest p-2">Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}