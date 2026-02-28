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
      const m = await getDailyMetricsByDate(dateStr);
      if (m) {
        setMetrics({
          steps: m.steps?.toString() ?? "",
          kcal: m.kcal?.toString() ?? "",
          weight: m.weight_g ? formatKgFR(gramsToKg(m.weight_g), 1).replace(',', '.') : "",
          note: m.note ?? ""
        });
      } else {
        setMetrics({ steps: "", kcal: "", weight: "", note: "" });
      }
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const formatDisplayLoad = (type: string, g: number | null) => {
    if (type === "PDC") return "PDC";
    if (!g) return "-";
    const kg = g / 1000;
    const val = Number.isInteger(kg) ? kg.toString() : kg.toFixed(1).replace('.', ',');
    return type === "PDC_PLUS" ? `PDC + ${val}` : `${val} KG`;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6">
      <div className="flex justify-center py-2">
        <img src="/icons/android-chrome-192x192.png" alt="Logo" className="w-12 h-12 object-contain" />
      </div>

      <div className="flex items-center justify-between bg-black/20 p-2 rounded-2xl border border-white/5">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-menthe">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-menthe">
            {format(currentDate, 'EEEE', { locale: fr })}
          </p>
          <p className="text-lg font-black text-white">{format(currentDate, 'dd MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-menthe">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] grid grid-cols-3 gap-4">
        <div className="text-center">
          <span className="text-[9px] font-black text-white/30 uppercase block mb-1">Poids</span>
          <input type="text" value={metrics.weight} onChange={e => setMetrics({...metrics, weight: e.target.value})} onBlur={async () => {
             const g = kgToGramsInt(parseDecimalFlexible(metrics.weight));
             await upsertDailyMetrics({ ...metrics, date: dateStr, steps: parseInt(metrics.steps) || null, kcal: parseInt(metrics.kcal) || null, weight_g: g, note: metrics.note || null });
          }} className="w-full bg-white/5 rounded-xl py-3 text-center text-white font-black" placeholder="00,0" />
        </div>
        <div className="text-center">
          <span className="text-[9px] font-black text-white/30 uppercase block mb-1">Pas</span>
          <input type="number" value={metrics.steps} onChange={e => setMetrics({...metrics, steps: e.target.value})} onBlur={async () => {
             await upsertDailyMetrics({ ...metrics, date: dateStr, steps: parseInt(metrics.steps) || null, kcal: parseInt(metrics.kcal) || null, weight_g: kgToGramsInt(parseDecimalFlexible(metrics.weight)), note: metrics.note || null });
          }} className="w-full bg-white/5 rounded-xl py-3 text-center text-white font-black" placeholder="0" />
        </div>
        <div className="text-center">
          <span className="text-[9px] font-black text-white/30 uppercase block mb-1">Kcal</span>
          <input type="number" value={metrics.kcal} onChange={e => setMetrics({...metrics, kcal: e.target.value})} onBlur={async () => {
             await upsertDailyMetrics({ ...metrics, date: dateStr, steps: parseInt(metrics.steps) || null, kcal: parseInt(metrics.kcal) || null, weight_g: kgToGramsInt(parseDecimalFlexible(metrics.weight)), note: metrics.note || null });
          }} className="w-full bg-white/5 rounded-xl py-3 text-center text-white font-black" placeholder="0" />
        </div>
      </section>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <input 
          value={newName} 
          onChange={async (e) => {
            setNewName(e.target.value);
            if(e.target.value.length > 1) setSuggestions(await listCatalogExercises(e.target.value));
            else setSuggestions([]);
          }}
          placeholder="Mouvement..." 
          className="w-full bg-white/5 p-4 rounded-2xl text-white font-bold" 
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0,3).map(s => (
              <button key={s.id} onClick={() => {setNewName(s.name); setSuggestions([]);}} className="bg-menthe/10 text-menthe text-[10px] font-black px-3 py-1 rounded-full uppercase">{s.name}</button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl text-white font-bold">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC +</option>
          </select>
          <input type="text" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} placeholder="Charge" className="bg-white/5 p-4 rounded-2xl text-white font-bold" />
        </div>
        <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)} placeholder="Répétitions" className="w-full bg-white/5 p-4 rounded-2xl text-white font-bold" />
        <button 
          onClick={async () => {
            if(!workoutId || !newName) return;
            await addWorkoutExercise({
              workout_id: workoutId,
              exercise_name: newName,
              load_type: newLoadType,
              load_g: newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal)) : null,
              reps: parseInt(newReps) || null
            });
            setNewName(""); setNewLoadVal(""); setNewReps("");
            setExercises(await getWorkoutExercises(workoutId));
          }}
          className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg"
        >
          Enregistrer Performance
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
              <span className="opacity-10 text-[8px] font-black uppercase">← Swipe</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}