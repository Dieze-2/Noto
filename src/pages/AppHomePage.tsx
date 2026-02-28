import { useEffect, useMemo, useState } from "react";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise } from "../db/workouts";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";

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
      <nav className="flex items-center justify-between glass-card p-4 rounded-[2rem]">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 font-black text-black dark:text-white">←</button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-sauge-deep dark:text-menthe-flash">Aujourd'hui</p>
          <p className="font-black capitalize text-black dark:text-white text-lg">{format(currentDate, 'EEEE d MMMM', { locale: fr })}</p>
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 font-black text-black dark:text-white">→</button>
      </nav>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2rem]">
          <label className="text-[9px] font-black uppercase text-sauge-deep dark:text-menthe-flash mb-2 block">Poids corporel</label>
          <div className="flex items-baseline gap-1">
            <input type="text" inputMode="decimal" value={metrics.weight} onChange={e => updateMetric('weight', e.target.value)}
              className="w-full bg-transparent font-black text-2xl text-black dark:text-white outline-none" placeholder="0.0" />
            <span className="text-[10px] font-black opacity-40 text-black dark:text-white">KG</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-[2rem]">
          <label className="text-[9px] font-black uppercase text-sauge-deep dark:text-menthe-flash mb-2 block">Activité Pas</label>
          <input type="number" value={metrics.steps} onChange={e => updateMetric('steps', e.target.value)}
            className="w-full bg-transparent font-black text-2xl text-black dark:text-white outline-none" placeholder="0" />
        </div>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="bg-black/5 dark:bg-black/20 p-4 rounded-2xl">
           <label className="text-[9px] font-black uppercase text-sauge-deep dark:text-menthe-flash mb-1 block">Mouvement</label>
           <input placeholder="Ex: Développé Couché" value={newName} onChange={e => setNewName(e.target.value)}
             className="w-full bg-transparent font-black text-lg text-black dark:text-white outline-none" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-black/5 dark:bg-black/20 p-4 rounded-2xl">
             <label className="text-[9px] font-black uppercase text-sauge-deep dark:text-menthe-flash mb-1 block">Charge</label>
             <div className="flex gap-2">
               <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-transparent font-black text-xs text-black dark:text-white uppercase outline-none">
                 <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC+</option>
               </select>
               <input type="text" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)}
                 className="w-full bg-transparent font-black text-lg text-black dark:text-white text-right outline-none" placeholder="0" />
             </div>
          </div>
          <div className="w-24 bg-black/5 dark:bg-black/20 p-4 rounded-2xl">
             <label className="text-[9px] font-black uppercase text-sauge-deep dark:text-menthe-flash mb-1 block text-center">Reps</label>
             <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
               className="w-full bg-transparent font-black text-lg text-black dark:text-white text-center outline-none" placeholder="0" />
          </div>
        </div>

        <button onClick={async () => {
            if (!workoutId || !newName) return;
            await addWorkoutExercise({
              workout_id: workoutId, exercise_name: newName, load_type: newLoadType,
              load_g: newLoadType !== "PDC" ? kgToGramsInt(parseDecimalFlexible(newLoadVal) ?? 0) : null,
              reps: parseInt(newReps) || null
            });
            setNewName(""); setExercises(await getWorkoutExercises(workoutId));
          }}
          className="w-full bg-black dark:bg-menthe-flash text-white dark:text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          Enregistrer Performance
        </button>
      </section>
    </div>
  );
}