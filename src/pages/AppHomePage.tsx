import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";
import { subDays, addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function TodayPage() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") ? parseISO(searchParams.get("date")!) : new Date();
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  
  // States pour la saisie
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
        weight: m.weight_g ? gramsToKg(m.weight_g).toString() : "",
        note: m.note ?? ""
      } : { steps: "", kcal: "", weight: "", note: "" });
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  // Suggestions d'exercices
  useEffect(() => {
    if (newName.length > 1) {
      listCatalogExercises(newName).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [newName]);

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
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 font-black text-white">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-menthe">Date sélectionnée</p>
          <p className="font-black capitalize text-white text-lg">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 font-black text-white">→</button>
      </nav>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2rem]">
          <label className="text-[9px] font-black uppercase text-menthe mb-2 block">Poids corporel</label>
          <div className="flex items-baseline gap-1">
            <input type="text" inputMode="decimal" value={metrics.weight} onChange={e => updateMetric('weight', e.target.value)}
              className="w-full text-2xl" placeholder="0.0" />
            <span className="text-[10px] font-black opacity-40">KG</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[2rem]">
          <label className="text-[9px] font-black uppercase text-menthe mb-2 block">Activité Pas</label>
          <input type="number" value={metrics.steps} onChange={e => updateMetric('steps', e.target.value)}
            className="w-full text-2xl" placeholder="0" />
        </div>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 relative">
        <div className="bg-white/5 p-4 rounded-2xl relative">
           <label className="text-[9px] font-black uppercase text-menthe mb-1 block">Exercice</label>
           <input placeholder="Ex: Développé Couché" value={newName} onChange={e => setNewName(e.target.value)}
             className="w-full text-lg" />
           {/* Suggestions UI */}
           {suggestions.length > 0 && (
             <div className="absolute left-0 right-0 top-full mt-2 bg-mineral-950 border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl">
               {suggestions.map(s => (
                 <button key={s.id} onClick={() => {setNewName(s.name); setSuggestions([]);}}
                   className="w-full text-left p-4 hover:bg-menthe hover:text-black font-bold text-sm border-b border-white/5">
                   {s.name}
                 </button>
               ))}
             </div>
           )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white/5 p-4 rounded-2xl">
             <label className="text-[9px] font-black uppercase text-menthe mb-1 block">Charge</label>
             <div className="flex gap-2">
               <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="text-xs uppercase">
                 <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC+</option>
               </select>
               <input type="text" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)}
                 className="w-full text-lg text-right" placeholder="0" />
             </div>
          </div>
          <div className="w-24 bg-white/5 p-4 rounded-2xl">
             <label className="text-[9px] font-black uppercase text-menthe mb-1 block text-center">Reps</label>
             <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
               className="w-full text-lg text-center" placeholder="0" />
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
          className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,163,0.3)] active:scale-95 transition-transform"
        >
          Enregistrer Performance
        </button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-3xl border-l-4 border-menthe flex justify-between items-center">
            <div>
              <h3 className="font-black text-white">{ex.exercise_name}</h3>
              <p className="text-[10px] font-bold text-menthe uppercase">{ex.load_type} {ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : ""} • {ex.reps} reps</p>
            </div>
            <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(e => e.id !== ex.id)); }} 
              className="text-rose-500 font-black text-[9px] uppercase p-2">Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}