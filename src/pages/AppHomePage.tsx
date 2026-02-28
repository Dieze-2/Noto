import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise, getLastExerciseByName } from "../db/workouts";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function TodayPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "", note: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
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

  const handleDelete = async (id: string) => {
    await deleteWorkoutExercise(id);
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-32 space-y-6">
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-2 font-black text-mineral-800 dark:text-white">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-sauge-600">Bio-Log</p>
          <p className="font-black capitalize">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-2 font-black text-mineral-800 dark:text-white">→</button>
      </nav>

      {/* Saisie (Simplifiée pour focus) */}
      <section className="glass-card p-6 rounded-[2.5rem] border-b-4 border-sauge-200">
        <input 
          placeholder="Exercice..." 
          value={newName} 
          onChange={e => {
            setNewName(e.target.value);
            if(e.target.value.length > 2) getLastExerciseByName(e.target.value).then(setLastPerf);
          }}
          className="w-full bg-transparent text-xl font-black outline-none mb-4 placeholder:text-mineral-800/20"
        />
        {lastPerf && (
          <div className="mb-4 p-3 bg-sauge-100/50 rounded-2xl text-[10px] font-bold text-sauge-600">
            Dernier : {lastPerf.load_type} {lastPerf.load_g ? formatKgFR(gramsToKg(lastPerf.load_g), 1) : ""} x {lastPerf.reps}
          </div>
        )}
        <div className="flex gap-2 mb-4">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-sauge-200 p-3 rounded-xl font-black text-xs">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC+</option>
          </select>
          <input placeholder="Charge" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 bg-sauge-100 p-3 rounded-xl font-black" />
          <input placeholder="Reps" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-16 bg-sauge-100 p-3 rounded-xl font-black text-center" />
        </div>
        <textarea 
          placeholder="Séries secondaires..." 
          value={subSeries} onChange={e => setSubSeries(e.target.value)}
          className="w-full bg-sauge-50/50 p-4 rounded-2xl text-xs min-h-[80px] outline-none mb-4"
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
          className="w-full bg-mineral-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          Enregistrer
        </button>
      </section>

      {/* Liste avec Swipe to Delete */}
      <div className="space-y-3">
        <AnimatePresence>
          {exercises.map(ex => (
            <motion.div 
              key={ex.id}
              initial={{ x: 0 }}
              exit={{ x: -500, opacity: 0 }}
              drag="x"
              dragConstraints={{ right: 0, left: -100 }}
              onDragEnd={(_, info) => { if (info.offset.x < -60) handleDelete(ex.id); }}
              className="relative group cursor-grab active:cursor-grabbing"
            >
              {/* Fond de suppression (rouge) */}
              <div className="absolute inset-0 bg-rose-500 rounded-3xl flex items-center justify-end px-6 text-white font-black text-xs">
                SUPPRIMER
              </div>
              
              {/* Carte exercice */}
              <motion.div className="relative glass-card p-5 rounded-3xl border-l-4 border-sauge-500">
                <div className="flex justify-between">
                  <h3 className="font-black text-mineral-900 dark:text-white">{ex.exercise_name}</h3>
                  <span className="text-sauge-600 font-black text-xs">{ex.load_type} {ex.load_g ? formatKgFR(gramsToKg(ex.load_g), 1) : ""} • {ex.reps}</span>
                </div>
                {ex.comment && <pre className="mt-2 text-[10px] opacity-60 font-medium whitespace-pre-wrap">{ex.comment}</pre>}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}