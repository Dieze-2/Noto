import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise, getLastExerciseByName } from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  
  // Saisie Exercice
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

  const handleSearch = async (val: string) => {
    setNewName(val);
    if (val.length > 1) {
      const cat = await listCatalogExercises();
      setSuggestions(cat.filter(i => i.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
      getLastExerciseByName(val).then(setLastPerf);
    } else {
      setSuggestions([]);
      setLastPerf(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-32 space-y-6">
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 font-black text-mineral-800 dark:text-white">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-sauge-600">Aujourd'hui</p>
          <p className="font-black capitalize text-mineral-900 dark:text-white">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 font-black text-mineral-800 dark:text-white">→</button>
      </nav>

      {/* Bio-Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 rounded-3xl">
          <label className="text-[9px] font-black uppercase text-sauge-600 mb-1 block">Poids (kg)</label>
          <input 
            type="text" inputMode="decimal" value={metrics.weight} 
            onChange={e => updateMetric('weight', e.target.value)}
            className="w-full bg-transparent font-black text-xl outline-none" placeholder="0.0" 
          />
        </div>
        <div className="glass-card p-4 rounded-3xl">
          <label className="text-[9px] font-black uppercase text-sauge-600 mb-1 block">Pas</label>
          <input 
            type="number" value={metrics.steps} 
            onChange={e => updateMetric('steps', e.target.value)}
            className="w-full bg-transparent font-black text-xl outline-none" placeholder="0" 
          />
        </div>
      </div>

      {/* Saisie Exercice */}
      <section className="glass-card p-6 rounded-[2.5rem] border-b-4 border-sauge-200 relative">
        <div className="relative">
          <input 
            placeholder="Exercice..." 
            value={newName} 
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-transparent text-xl font-black outline-none mb-2 placeholder:text-mineral-800/20 dark:text-white"
          />
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="absolute z-50 w-full bg-white dark:bg-mineral-800 shadow-2xl rounded-2xl overflow-hidden border border-sauge-100 top-10">
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => {setNewName(s.name); setSuggestions([]);}} className="w-full p-4 text-left text-xs font-black hover:bg-sauge-50 dark:hover:bg-mineral-700 uppercase tracking-widest">
                    {s.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {lastPerf && (
          <div className="mb-4 p-3 bg-sauge-100/30 dark:bg-sauge-900/20 rounded-2xl text-[10px] font-bold text-sauge-600 dark:text-sauge-200">
            Dernier : {lastPerf.load_type} {lastPerf.load_g ? formatKgFR(gramsToKg(lastPerf.load_g), 1) : ""} x {lastPerf.reps}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-sauge-200 dark:bg-mineral-700 p-3 rounded-xl font-black text-xs appearance-none px-4">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC+</option>
          </select>
          <input placeholder="Charge" type="text" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 p-3 rounded-xl font-black" />
          <input placeholder="Reps" type="number" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-16 p-3 rounded-xl font-black text-center" />
        </div>
        
        <textarea 
          placeholder="Séries secondaires..." 
          value={subSeries} onChange={e => setSubSeries(e.target.value)}
          className="w-full p-4 rounded-2xl text-xs min-h-[80px] outline-none mb-4"
        />
        
        <button 
          onClick={async () => {
            if (!workoutId || !newName) return;
            await addWorkoutExercise({
              workout_id: workoutId, exercise_name: newName, load_type: newLoadType,
              load_g: newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0) : null,
              reps: parseInt(newReps) || null, comment: subSeries || null
            });
            setNewName(""); setExercises(await getWorkoutExercises(workoutId)); setLastPerf(null);
          }}
          className="w-full bg-mineral-800 dark:bg-sauge-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
        >
          Enregistrer
        </button>
      </section>

      {/* Liste des exercices du jour */}
      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-3xl border-l-4 border-sauge-500 flex justify-between items-center">
            <div>
              <h3 className="font-black text-mineral-900 dark:text-white">{ex.exercise_name}</h3>
              {ex.comment && <p className="text-[10px] text-mineral-500 mt-1 whitespace-pre-wrap">{ex.comment}</p>}
            </div>
            <div className="text-right">
              <span className="text-sauge-600 dark:text-sauge-200 font-black text-xs">
                {ex.load_type} {ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : ""} • {ex.reps}
              </span>
              <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(e => e.id !== ex.id)); }} className="block text-[8px] font-black text-rose-500 uppercase mt-1">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}