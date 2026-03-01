import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise, getLastExerciseByName } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";
import { subDays, addDays, format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export default function TodayPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"KG" | "BODYWEIGHT" | "CALISTHENICS">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");

  useEffect(() => {
    async function load() {
      const m = await getDailyMetricsByDate(dateStr);
      setMetrics(m ? { steps: m.steps?.toString() || "", kcal: m.kcal?.toString() || "", weight: m.weight_g ? gramsToKg(m.weight_g).toString().replace('.', ',') : "" } : { steps: "", kcal: "", weight: "" });
      const wId = await getOrCreateWorkout(dateStr);
      setWorkoutId(wId);
      setExercises(await getWorkoutExercises(wId));
    }
    load();
  }, [dateStr]);

  const updateMetric = async (key: string, val: string) => {
    const next = { ...metrics, [key]: val };
    setMetrics(next);
    await upsertDailyMetrics({
      date: dateStr,
      steps: next.steps ? parseInt(next.steps) : null,
      kcal: next.kcal ? parseInt(next.kcal) : null,
      weight_g: next.weight ? kgToGramsInt(parseDecimalFlexible(next.weight)) : null
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      <header className="flex flex-col items-center mb-8 pt-4">
        <div className="flex items-center gap-6 mb-2">
          <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="text-white/20 text-2xl font-black">←</button>
          <h1 className="title-xl">{format(currentDate, 'dd MMM', { locale: fr })}</h1>
          <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="text-white/20 text-2xl font-black">→</button>
        </div>
        <p className="subtitle-xs">{format(currentDate, 'EEEE', { locale: fr })}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="neo-glass p-6">
          <p className="subtitle-xs">Poids</p>
          <input type="text" inputMode="decimal" placeholder="00,0" value={metrics.weight} onChange={e => updateMetric("weight", e.target.value)} className="bg-transparent text-4xl font-black italic w-full outline-none" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="neo-glass p-4 flex-1">
            <p className="subtitle-xs text-[8px]">Pas</p>
            <input type="number" value={metrics.steps} onChange={e => updateMetric("steps", e.target.value)} className="bg-transparent text-2xl font-black w-full outline-none" />
          </div>
          <div className="neo-glass p-4 flex-1">
            <p className="subtitle-xs text-[8px]">Kcal</p>
            <input type="number" value={metrics.kcal} onChange={e => updateMetric("kcal", e.target.value)} className="bg-transparent text-2xl font-black w-full outline-none" />
          </div>
        </div>
      </div>

      <section className="neo-glass p-6 mb-8 border-t-2 border-t-menthe/30">
        <div className="relative mb-4">
          <input placeholder="NOM DU MOUVEMENT" value={newName} onChange={async (e) => {
            const v = e.target.value; setNewName(v);
            if(v.length > 1) setSuggestions(await listCatalogExercises(v));
            else setSuggestions([]);
          }} className="w-full bg-transparent text-xl font-black italic uppercase outline-none" />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 neo-glass overflow-hidden shadow-2xl">
              {suggestions.map(s => (
                <button key={s.id} onClick={async () => {
                  setNewName(s.name); setSuggestions([]);
                  const last = await getLastExerciseByName(s.name);
                  if(last) { setNewLoadType(last.load_type); setNewLoadVal(gramsToKg(last.load_g || 0).toString().replace('.',',')); setNewReps(last.reps?.toString() || ""); }
                }} className="w-full text-left p-4 text-[10px] font-black uppercase hover:bg-menthe hover:text-black">
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => setNewLoadType(newLoadType === "KG" ? "BODYWEIGHT" : "KG")} className="bg-white/5 rounded-xl text-[9px] font-black">{newLoadType}</button>
          <input type="text" inputMode="decimal" placeholder="CHARGE" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="bg-white/5 rounded-xl p-3 text-center font-black outline-none" />
          <input type="number" placeholder="REPS" value={newReps} onChange={e => setNewReps(e.target.value)} className="bg-white/5 rounded-xl p-3 text-center font-black outline-none" />
        </div>
        <button onClick={async () => {
          if(!workoutId || !newName) return;
          await addWorkoutExercise({ workout_id: workoutId, exercise_name: newName, load_type: newLoadType, load_g: newLoadType === 'KG' ? kgToGramsInt(parseDecimalFlexible(newLoadVal)) : null, reps: parseInt(newReps) || 0 });
          setNewName(""); setNewLoadVal(""); setNewReps("");
          setExercises(await getWorkoutExercises(workoutId)); 
        }} className="w-full btn-primary">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-l from-rose-600/40 to-transparent">
            <div 
              className="relative neo-glass p-6 flex justify-between items-center transition-transform duration-500 group-active:-translate-x-full"
              onTransitionEnd={async (e) => {
                if(e.propertyName === 'transform') {
                  await deleteWorkoutExercise(ex.id);
                  setExercises(prev => prev.filter(i => i.id !== ex.id));
                }
              }}
            >
              <div>
                <h3 className="font-black text-white uppercase italic text-xl">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-widest">
                  {ex.load_type === 'KG' ? `${formatKgFR(gramsToKg(ex.load_g || 0), 1)} kg` : ex.load_type} • {ex.reps} reps
                </p>
              </div>
              <div className="text-white/20 text-xs italic">Swipe ←</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}