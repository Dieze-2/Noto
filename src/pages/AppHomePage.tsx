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
  const [newLoadType, setNewLoadType] = useState<"KG" | "PDC" | "PDC_PLUS">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");

  useEffect(() => {
    async function load() {
      const m = await getDailyMetricsByDate(dateStr);
      setMetrics(m ? {
        steps: m.steps?.toString() ?? "",
        kcal: m.kcal?.toString() ?? "",
        weight: m.weight_g ? (m.weight_g / 1000).toString() : "",
        note: m.note ?? ""
      } : { steps: "", kcal: "", weight: "", note: "" });
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const formatDisplayLoad = (type: string, grams: number | null) => {
    if (type === "PDC") return "PDC";
    const val = grams ? grams / 1000 : 0;
    const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(1).replace('.', ',');
    return type === "PDC_PLUS" ? `PDC + ${formatted}` : `${formatted} KG`;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6">
      {/* Branding Logo */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-10 bg-menthe rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.3)]">
          <span className="text-black font-black text-xl italic">B</span>
        </div>
      </div>

      <nav className="flex items-center justify-between glass-card p-2 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 font-black text-white text-xl">←</button>
        <div className="text-center">
          <span className="page-subtitle !mb-0">Journal</span>
          <p className="font-black capitalize text-white">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 font-black text-white text-xl">→</button>
      </nav>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2.5rem]">
          <label className="text-[10px] font-black uppercase text-menthe mb-2 block tracking-widest text-center">Poids</label>
          <div className="flex items-center justify-center gap-1">
            <input type="text" inputMode="decimal" value={metrics.weight} onChange={e => {
                const val = e.target.value;
                setMetrics(prev => ({...prev, weight: val}));
                upsertDailyMetrics({ date: dateStr, weight_g: kgToGramsInt(parseDecimalFlexible(val) ?? 0) });
              }} className="text-3xl text-center w-24" placeholder="0.0" />
            <span className="text-[10px] font-black opacity-30 mt-2">KG</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[2.5rem]">
          <label className="text-[10px] font-black uppercase text-menthe mb-2 block tracking-widest text-center">Pas</label>
          <input type="number" value={metrics.steps} onChange={e => {
              const val = e.target.value;
              setMetrics(prev => ({...prev, steps: val}));
              upsertDailyMetrics({ date: dateStr, steps: parseInt(val) || null });
            }} className="text-3xl text-center w-full" placeholder="0" />
        </div>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="bg-white/5 p-4 rounded-2xl">
           <label className="text-[10px] font-black uppercase text-menthe mb-1 block tracking-widest">Exercice</label>
           <input placeholder="Développé..." value={newName} onChange={e => setNewName(e.target.value)} className="w-full text-lg" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white/5 p-4 rounded-2xl">
             <label className="text-[10px] font-black uppercase text-menthe mb-1 block tracking-widest">Charge</label>
             <div className="flex gap-2">
               <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="text-xs">
                 <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC+</option>
               </select>
               <input type="text" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="w-full text-lg text-right" placeholder="0" />
             </div>
          </div>
          <div className="w-24 bg-white/5 p-4 rounded-2xl">
             <label className="text-[10px] font-black uppercase text-menthe mb-1 block text-center tracking-widest">Reps</label>
             <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-full text-lg text-center" placeholder="0" />
          </div>
        </div>

        <button onClick={async () => {
            if (!workoutId || !newName) return;
            await addWorkoutExercise({
              workout_id: workoutId, exercise_name: newName, load_type: newLoadType,
              load_g: newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0) : null,
              reps: parseInt(newReps) || null
            });
            setNewName(""); setNewLoadVal(""); setNewReps("");
            setExercises(await getWorkoutExercises(workoutId));
          }}
          className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg"
        >
          Enregistrer
        </button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-3xl">
            <div className="absolute inset-y-0 right-0 w-20 bg-rose-600 flex items-center justify-center">
              <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(e => e.id !== ex.id)); }} className="text-white font-black text-[10px] uppercase">Suppr.</button>
            </div>
            <div className="relative glass-card p-5 flex justify-between items-center transition-transform group-active:-translate-x-20 duration-300">
              <div>
                <h3 className="font-black text-white">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-widest">{formatDisplayLoad(ex.load_type, ex.load_g)} • {ex.reps} reps</p>
              </div>
              <span className="opacity-20 text-xs">← slide</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}