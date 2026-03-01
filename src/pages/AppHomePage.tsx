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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  const handleSave = async () => {
    if(!workoutId || !newName) return;
    await addWorkoutExercise({
      workout_id: workoutId,
      exercise_name: newName,
      load_type: newLoadType,
      load_g: (newLoadType === 'KG' || newLoadType === 'BODYWEIGHT') ? kgToGramsInt(parseDecimalFlexible(newLoadVal)) : null,
      reps: parseInt(newReps) || 0
    });
    setNewName(""); setNewLoadVal(""); setNewReps(""); setSuggestions([]);
    setExercises(await getWorkoutExercises(workoutId));
  };

  return (
    <div 
      className="min-h-screen bg-black text-white p-4 pb-32"
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if(!touchStartX) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if(diff > 80) setCurrentDate(addDays(currentDate, 1));
        if(diff < -80) setCurrentDate(subDays(currentDate, 1));
        setTouchStartX(null);
      }}
    >
      <header className="flex flex-col items-center mb-6 pt-4">
        <h1 className="title-xl">{format(currentDate, 'dd MMM', { locale: fr })}</h1>
        <p className="subtitle-xs">{format(currentDate, 'EEEE', { locale: fr })}</p>
      </header>

      {/* THREE CARDS LAYOUT */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="neo-glass p-4 flex flex-col items-center text-center">
          <span className="text-xl mb-1">⚖️</span>
          <p className="text-[8px] font-black uppercase text-menthe/50 mb-1">Poids</p>
          <input type="text" inputMode="decimal" value={metrics.weight} onChange={e => updateMetric("weight", e.target.value)} className="bg-transparent text-lg font-black w-full text-center outline-none" placeholder="--" />
        </div>
        <div className="neo-glass p-4 flex flex-col items-center text-center border-t-2 border-menthe/30">
          <span className="text-xl mb-1">👟</span>
          <p className="text-[8px] font-black uppercase text-menthe/50 mb-1">Pas</p>
          <input type="number" value={metrics.steps} onChange={e => updateMetric("steps", e.target.value)} className="bg-transparent text-lg font-black w-full text-center outline-none" placeholder="--" />
        </div>
        <div className="neo-glass p-4 flex flex-col items-center text-center">
          <span className="text-xl mb-1">🔥</span>
          <p className="text-[8px] font-black uppercase text-menthe/50 mb-1">Kcal</p>
          <input type="number" value={metrics.kcal} onChange={e => updateMetric("kcal", e.target.value)} className="bg-transparent text-lg font-black w-full text-center outline-none" placeholder="--" />
        </div>
      </div>

      <section className="neo-glass p-6 mb-8 shadow-2xl">
        <div className="relative mb-4 border-b border-white/10 pb-2">
          <input 
            placeholder="NOM DU MOUVEMENT" 
            value={newName} 
            onChange={async (e) => {
              const v = e.target.value; setNewName(v);
              if(v.length >= 1) {
                const list = await listCatalogExercises();
                setSuggestions(list.filter(ex => ex.name.toLowerCase().includes(v.toLowerCase())).slice(0, 5));
              } else setSuggestions([]);
            }} 
            className="w-full bg-transparent text-xl font-black italic uppercase outline-none" 
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 neo-glass border border-menthe/30 overflow-hidden">
              {suggestions.map(s => (
                <button key={s.id} onClick={async () => {
                  setNewName(s.name); setSuggestions([]);
                  const last = await getLastExerciseByName(s.name);
                  if(last) { 
                    setNewLoadType(last.load_type); 
                    setNewLoadVal(last.load_g ? gramsToKg(last.load_g).toString().replace('.',',') : ""); 
                    setNewReps(last.reps?.toString() || ""); 
                  }
                }} className="w-full text-left p-4 text-[10px] font-black uppercase border-b border-white/5 last:border-0 hover:bg-menthe hover:text-black">
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => setNewLoadType(curr => curr === "KG" ? "BODYWEIGHT" : curr === "BODYWEIGHT" ? "CALISTHENICS" : "KG")} className="bg-white/5 rounded-xl text-[9px] font-black uppercase">
            {newLoadType === "BODYWEIGHT" ? "PDC +" : newLoadType}
          </button>
          <input type="text" inputMode="decimal" placeholder="CHARGE" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="bg-white/5 rounded-xl p-3 text-center font-black outline-none border border-white/5 focus:border-menthe/30" />
          <input type="number" placeholder="REPS" value={newReps} onChange={e => setNewReps(e.target.value)} className="bg-white/5 rounded-xl p-3 text-center font-black outline-none border border-white/5 focus:border-menthe/30" />
        </div>
        <button onClick={handleSave} className="w-full btn-primary">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-rose-600/20">
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
                <h3 className="font-black text-white uppercase italic text-lg leading-tight">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-[0.2em] mt-1">
                  {ex.load_type === 'KG' ? `${formatKgFR(gramsToKg(ex.load_g || 0), 1)} kg` : 
                   ex.load_type === 'BODYWEIGHT' ? `PDC + ${formatKgFR(gramsToKg(ex.load_g || 0), 1)} kg` : "CALISTHENICS"} 
                  <span className="text-white/40 mx-2">/</span> {ex.reps} reps
                </p>
              </div>
              <span className="opacity-20 text-[8px] font-black uppercase">Swipe ←</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}