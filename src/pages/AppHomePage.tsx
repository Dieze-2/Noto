import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";
import { subDays, addDays, format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export default function TodayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"PDC" | "PDC_PLUS" | "KG" | "TEXT">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");

  useEffect(() => {
    async function load() {
      const d = await getDailyMetricsByDate(dateStr);
      if (d) {
        setMetrics({
          steps: d.steps?.toString() || "",
          kcal: d.kcal?.toString() || "",
          weight: d.weight_g ? formatKgFR(gramsToKg(d.weight_g), 1).replace(',', '.') : "",
          note: d.note || ""
        });
      } else {
        setMetrics({ steps: "", kcal: "", weight: "", note: "" });
      }

      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      const ex = await getWorkoutExercises(w.id);
      setExercises(ex);
    }
    load();
  }, [dateStr]);

  const handleSaveMetrics = async () => {
    await upsertDailyMetrics({
      date: dateStr,
      steps: parseInt(metrics.steps) || null,
      kcal: parseInt(metrics.kcal) || null,
      weight_g: kgToGramsInt(parseDecimalFlexible(metrics.weight)),
      note: metrics.note || null
    });
  };

  const formatDisplayLoad = (type: string, grams: number | null) => {
    if (type === "PDC") return "PDC";
    if (type === "PDC_PLUS") return `PDC + ${gramsToKg(grams || 0)}kg`;
    return `${formatKgFR(gramsToKg(grams || 0), 1)} kg`;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6">
      <div className="flex justify-center py-2">
        <img src="/icons/android-chrome-192x192.png" alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5 text-white font-black">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3">←</button>
        <div className="text-center">
          <p className="text-[10px] uppercase text-menthe tracking-widest">{format(currentDate, 'EEEE', { locale: fr })}</p>
          <p>{format(currentDate, 'd MMMM yyyy', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase pl-2 opacity-40">Poids</label>
            <input type="number" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} onBlur={handleSaveMetrics} className="w-full bg-white/5 p-4 rounded-2xl font-black text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase pl-2 opacity-40">Pas</label>
            <input type="number" value={metrics.steps} onChange={e => setMetrics({...metrics, steps: e.target.value})} onBlur={handleSaveMetrics} className="w-full bg-white/5 p-4 rounded-2xl font-black text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase pl-2 opacity-40">Kcal</label>
            <input type="number" value={metrics.kcal} onChange={e => setMetrics({...metrics, kcal: e.target.value})} onBlur={handleSaveMetrics} className="w-full bg-white/5 p-4 rounded-2xl font-black text-white" />
          </div>
        </div>
      </section>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
        <div className="relative">
          <input placeholder="Exercice..." value={newName} onChange={async (e) => { setNewName(e.target.value); if(e.target.value.length > 1) setSuggestions(await listCatalogExercises(e.target.value)); else setSuggestions([]); }} className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {suggestions.map(s => <button key={s.id} onClick={() => { setNewName(s.name); setSuggestions([]); }} className="w-full p-4 text-left text-sm font-bold border-b border-white/5 text-white">{s.name}</button>)}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl font-bold text-xs text-white">
            <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC+</option>
          </select>
          <input placeholder="Charge" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 bg-white/5 p-4 rounded-2xl font-bold text-white" />
          <input placeholder="Reps" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-20 bg-white/5 p-4 rounded-2xl font-bold text-white" />
        </div>
        <button onClick={async () => { if(!workoutId || !newName) return; await addWorkoutExercise({ workout_id: workoutId, exercise_name: newName, load_type: newLoadType, load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), reps: parseInt(newReps) || null }); setNewName(""); setExercises(await getWorkoutExercises(workoutId)); }} className="w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative overflow-hidden rounded-3xl group">
            <div className="absolute inset-y-0 right-0 w-20 bg-rose-600 flex items-center justify-center">
              <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(e => e.id !== ex.id)); }} className="text-white font-black text-[10px] uppercase w-full h-full">Suppr.</button>
            </div>
            {/* Le translate-x-[-80px] au hover/active permet de laisser le bouton cliquable */}
            <div className="relative glass-card p-5 flex justify-between items-center bg-black transition-transform duration-300 active:-translate-x-20 sm:group-hover:-translate-x-20">
              <div>
                <h3 className="font-black text-white">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-widest">{formatDisplayLoad(ex.load_type, ex.load_g)} • {ex.reps} reps</p>
              </div>
              <span className="text-white/20 text-[10px] font-black">←</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}