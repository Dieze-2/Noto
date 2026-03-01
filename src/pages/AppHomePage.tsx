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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const d = await getDailyMetricsByDate(dateStr);
      setMetrics({ steps: d?.steps?.toString() || "", kcal: d?.kcal?.toString() || "", weight: d?.weight_g ? formatKgFR(gramsToKg(d.weight_g), 1).replace(',', '.') : "", note: d?.note || "" });
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const handleSearch = async (val: string) => {
    setNewName(val);
    if (val.length > 0) {
      const all = await listCatalogExercises();
      setSuggestions(all.filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
    } else { setSuggestions([]); }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6 overflow-x-hidden"
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (!touchStartX) return;
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (diff > 80) setCurrentDate(subDays(currentDate, 1));
        if (diff < -80) setCurrentDate(addDays(currentDate, 1));
      }}
    >
      <div className="flex justify-center"><img src="./logo.png" alt="Logo" className="w-auto h-auto object-contain" /></div>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter">{format(currentDate, 'd MMMM yyyy', { locale: fr })}</div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-white">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] grid grid-cols-3 gap-3">
        {['weight', 'steps', 'kcal'].map((f) => (
          <div key={f} className="space-y-1">
            <label className="text-[9px] font-black uppercase pl-2 opacity-40 text-white">{f}</label>
            <input type="text" inputMode="decimal" value={(metrics as any)[f]} onChange={e => setMetrics({...metrics, [f]: e.target.value})} onBlur={async () => {
              await upsertDailyMetrics({ date: dateStr, steps: parseInt(metrics.steps) || null, kcal: parseInt(metrics.kcal) || null, weight_g: kgToGramsInt(parseDecimalFlexible(metrics.weight)), note: metrics.note || null });
            }} className="w-full bg-white/5 p-4 rounded-2xl font-black text-white outline-none" />
          </div>
        ))}
      </section>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
        <div className="relative">
          <input placeholder="Exercice..." value={newName} onChange={e => handleSearch(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-black border border-white/10 rounded-2xl max-h-48 overflow-y-auto">
              {suggestions.map(s => (
                <button key={s.id} onClick={() => { setNewName(s.name); setSuggestions([]); }} className="w-full p-4 text-left text-sm font-bold text-white hover:bg-menthe hover:text-black">{s.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl font-bold text-white outline-none">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC +</option>
          </select>
          <input placeholder="Charge" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          <input placeholder="Reps" inputMode="numeric" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-20 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        </div>
        <button onClick={async () => {
          if(!workoutId || !newName) return;
          await addWorkoutExercise({ workout_id: workoutId, exercise_name: newName, load_type: newLoadType, load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), reps: parseInt(newReps) || null });
          setNewName(""); setNewLoadVal(""); setNewReps(""); setExercises(await getWorkoutExercises(workoutId));
        }} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-3xl bg-gradient-to-l from-rose-900/40 to-transparent border-r-4 border-rose-600/20">
            <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-rose-500 uppercase opacity-60">Suppr.</span>
            </div>
            <div 
              className="relative glass-card p-5 flex justify-between items-center transition-transform duration-300 touch-pan-x group-active:-translate-x-20 md:hover:-translate-x-20"
              onClick={async (e) => {
                 // Action clic pour PC si on glisse
                 if(window.innerWidth > 768) {
                    if (window.confirm("Supprimer ?")) {
                        await deleteWorkoutExercise(ex.id);
                        setExercises(prev => prev.filter(item => item.id !== ex.id));
                    }
                 }
              }}
              onTouchEndCapture={async (e) => {
                 // Déclenchement suppression si slide mobile complet
                 const style = window.getComputedStyle(e.currentTarget);
                 const matrix = new WebKitCSSMatrix(style.transform);
                 if (matrix.m41 <= -70) {
                    await deleteWorkoutExercise(ex.id);
                    setExercises(prev => prev.filter(item => item.id !== ex.id));
                 }
              }}
            >
              <div>
                <h3 className="font-black text-white">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-widest">{ex.load_type.replace('_',' ')} • {ex.reps} reps</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}