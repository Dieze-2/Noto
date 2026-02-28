import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { 
  addWorkoutExercise, 
  getOrCreateWorkout, 
  getWorkoutExercises, 
  deleteWorkoutExercise,
  getLastExerciseByName // Assure-toi que cette fonction existe dans workouts.ts
} from "../db/workouts";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);

  // Formulaire Exercice Master
  const [newName, setNewName] = useState("");
  const [newLoadType, setNewLoadType] = useState<"KG" | "PDC" | "PDC_PLUS">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [subSeries, setSubSeries] = useState("");
  
  // État pour l'historique rapide
  const [lastPerf, setLastPerf] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
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
      setLoading(false);
    }
    load();
  }, [dateStr]);

  // Chercher la dernière perf quand on tape le nom
  const checkHistory = async (name: string) => {
    setNewName(name);
    if (name.length > 2) {
      const last = await getLastExerciseByName(name);
      setLastPerf(last);
    } else {
      setLastPerf(null);
    }
  };

  const handleAddMasterExercise = async () => {
    if (!workoutId || !newName) return;
    const loadG = newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0) : null;
    
    await addWorkoutExercise({
      workout_id: workoutId,
      exercise_name: newName,
      load_type: newLoadType,
      load_g: loadG,
      reps: parseInt(newReps) || null,
      comment: subSeries.trim() || null,
    });
    
    setNewName(""); setNewLoadVal(""); setNewReps(""); setSubSeries(""); setLastPerf(null);
    setExercises(await getWorkoutExercises(workoutId));
  };

  const saveMetrics = async () => {
    const wG = metrics.weight ? kgToGramsInt(parseDecimalFlexible(metrics.weight) ?? 0) : null;
    await upsertDailyMetrics({
      date: dateStr,
      steps: parseInt(metrics.steps) || null,
      kcal: parseInt(metrics.kcal) || null,
      weight_g: wG,
      note: metrics.note || null
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-32 space-y-8">
      {/* Navigation Date */}
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 text-mineral-700 font-bold">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-sauge-500">
            {format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "Aujourd'hui" : "Archives"}
          </p>
          <p className="font-bold capitalize text-mineral-900 dark:text-white">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 text-mineral-700 font-bold">→</button>
      </nav>

      {/* Métriques Rapides */}
      <section className="grid grid-cols-2 gap-4">
        <MetricBox label="Poids" value={metrics.weight} unit="kg" icon="⚖️" 
          onChange={(v: string) => setMetrics({...metrics, weight: v})} onBlur={saveMetrics} />
        <MetricBox label="Pas" value={metrics.steps} unit="steps" icon="👣"
          onChange={(v: string) => setMetrics({...metrics, steps: v})} onBlur={saveMetrics} />
      </section>

      {/* Saisie avec Historique Contextuel */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-t-4 border-t-sauge-500">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-mineral-700">Nouvel Exercice</h2>
          {lastPerf && (
            <span className="text-[9px] font-bold bg-sauge-500 text-white px-2 py-1 rounded-full animate-bounce">
              Historique trouvé
            </span>
          )}
        </div>

        <input 
          placeholder="Nom de l'exercice..." 
          value={newName} 
          onChange={e => checkHistory(e.target.value)}
          className="w-full bg-sauge-100/30 dark:bg-mineral-900/50 p-4 rounded-2xl outline-none font-bold text-mineral-900 dark:text-white"
        />

        {/* Panneau Historique Rapide */}
        {lastPerf && (
          <div className="bg-sauge-100/50 dark:bg-mineral-800/50 p-4 rounded-2xl border border-sauge-200/50">
            <p className="text-[9px] font-black uppercase text-sauge-600 mb-2">Dernière fois ({lastPerf.date}) :</p>
            <p className="text-sm font-bold">
              {lastPerf.load_type} {lastPerf.load_g ? formatKgFR(gramsToKg(lastPerf.load_g), 1) : ""} × {lastPerf.reps}
            </p>
            {lastPerf.comment && <pre className="text-[10px] mt-1 opacity-60 italic">{lastPerf.comment}</pre>}
          </div>
        )}

        <div className="flex gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)}
            className="bg-sauge-200 dark:bg-mineral-800 p-3 rounded-xl text-xs font-black text-mineral-900 dark:text-sauge-100">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC+</option>
          </select>
          <input placeholder="Charge" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)}
            className="flex-1 bg-sauge-100/30 dark:bg-mineral-900/50 p-3 rounded-xl text-center font-bold" />
          <input placeholder="Reps" value={newReps} onChange={e => setNewReps(e.target.value)}
            className="w-20 bg-sauge-100/30 dark:bg-mineral-900/50 p-3 rounded-xl text-center font-bold" />
        </div>
        
        <textarea 
          placeholder="Séries secondaires (PDC + 20kg : 10 reps...)"
          value={subSeries} onChange={e => setSubSeries(e.target.value)}
          className="w-full bg-sauge-50/20 dark:bg-mineral-900/30 p-4 rounded-2xl text-xs min-h-[100px] outline-none italic border border-dashed border-sauge-200"
        />
        
        <button onClick={handleAddMasterExercise}
          className="w-full bg-mineral-900 dark:bg-sauge-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sauge-500/20 active:scale-95 transition-all">
          Valider la séance
        </button>
      </section>

      {/* Log du jour */}
      <div className="space-y-4">
        {exercises.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-3xl relative">
             <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-mineral-900 dark:text-white">{ex.exercise_name}</h3>
                  <p className="text-sauge-500 font-bold text-xs uppercase tracking-wider">
                    {ex.load_type} {ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : ""} • {ex.reps} REPS
                  </p>
                </div>
                <button onClick={() => deleteWorkoutExercise(ex.id).then(() => setExercises(prev => prev.filter(p => p.id !== ex.id)))} className="text-mineral-700/30 hover:text-rose-500 transition-colors">✕</button>
             </div>
             {ex.comment && (
               <div className="mt-3 p-4 bg-sauge-50/50 dark:bg-black/20 rounded-2xl text-[11px] font-medium leading-relaxed border-l-4 border-sauge-200">
                 <pre className="whitespace-pre-wrap font-sans">{ex.comment}</pre>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBox({ label, value, unit, icon, onChange, onBlur }: any) {
  return (
    <div className="glass-card p-5 rounded-[2rem] group focus-within:ring-2 ring-sauge-500/30 transition-all">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-mineral-700/40">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <input 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          onBlur={onBlur}
          className="w-full text-2xl font-black bg-transparent outline-none text-mineral-900 dark:text-white" 
          placeholder="0" 
        />
        <span className="text-[9px] font-black text-sauge-500 uppercase">{unit}</span>
      </div>
    </div>
  );
}