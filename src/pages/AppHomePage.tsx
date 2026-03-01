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
  
  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"PDC" | "PDC_PLUS" | "KG" | "TEXT">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const d = await getDailyMetricsByDate(dateStr);
      setMetrics({ 
        steps: d?.steps?.toString() || "", 
        kcal: d?.kcal?.toString() || "", 
        weight: d?.weight_g ? formatKgFR(gramsToKg(d.weight_g), 1).replace(',', '.') : "" 
      });
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const saveMetrics = async (newVal: any) => {
    const updated = { ...metrics, ...newVal };
    setMetrics(updated);
    await upsertDailyMetrics({
      date: dateStr,
      steps: parseInt(updated.steps) || null,
      kcal: parseInt(updated.kcal) || null,
      weight_g: kgToGramsInt(parseDecimalFlexible(updated.weight)),
      note: null
    });
  };

  const formatLoadLabel = (type: string, grams: number | null) => {
    if (!grams && type !== "PDC") return type;
    const kg = gramsToKg(grams || 0);
    const val = kg % 1 === 0 ? kg.toString() : formatKgFR(kg, 1).replace(',', '.');
    return type === "KG" ? `${val} KG` : type === "PDC_PLUS" ? `PDC + ${val} KG` : type;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6 overflow-x-hidden">
      <div className="flex justify-center py-4">
        <div className="w-24 h-24 relative rounded-full border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
            <img src="./logo.png" alt="Logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
        </div>
      </div>

      {/* Rétablissement des Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-3xl border-b-2 border-white/10">
          <p className="text-[8px] font-black text-white/40 uppercase mb-1">Pas</p>
          <input type="number" value={metrics.steps} onChange={e => saveMetrics({steps: e.target.value})} className="w-full bg-transparent text-xl font-black text-white outline-none" placeholder="0" />
        </div>
        <div className="glass-card p-4 rounded-3xl border-b-2 border-white/10">
          <p className="text-[8px] font-black text-white/40 uppercase mb-1">Kcal</p>
          <input type="number" value={metrics.kcal} onChange={e => saveMetrics({kcal: e.target.value})} className="w-full bg-transparent text-xl font-black text-white outline-none" placeholder="0" />
        </div>
        <div className="glass-card p-4 rounded-3xl border-b-2 border-white/10">
          <p className="text-[8px] font-black text-white/40 uppercase mb-1">Poids (kg)</p>
          <input type="text" value={metrics.weight} onChange={e => saveMetrics({weight: e.target.value})} className="w-full bg-transparent text-xl font-black text-white outline-none" placeholder="0.0" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter">{format(currentDate, 'd MMMM yyyy', { locale: fr })}</div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-white">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe relative">
        <input placeholder="Exercice..." value={newName} onChange={e => {
            setNewName(e.target.value);
            if (e.target.value.length > 1) {
                listCatalogExercises().then(all => setSuggestions(all.filter(i => i.name.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5)));
            } else setSuggestions([]);
        }} className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        
        {suggestions.length > 0 && (
          <div className="absolute z-50 left-6 right-6 top-20 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map(s => (
              <div key={s.id} onClick={() => { setNewName(s.name); setSuggestions([]); }} className="p-4 text-white font-bold border-b border-white/5 active:bg-menthe active:text-black">{s.name}</div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl font-bold text-white outline-none">
            <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC +</option>
          </select>
          <input placeholder="Charge" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          <input placeholder="Reps" inputMode="numeric" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-20 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        </div>
        <button onClick={async () => {
          if(!workoutId || !newName) return;
          await addWorkoutExercise({ workout_id: workoutId, exercise_name: newName, load_type: newLoadType, load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), reps: parseInt(newReps) || null });
          setNewName(""); setNewLoadVal(""); setNewReps(""); setSuggestions([]); setExercises(await getWorkoutExercises(workoutId));
        }} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-r from-transparent from-90% to-rose-600/80">
            <div className={`absolute inset-y-0 right-0 w-16 flex items-center justify-center transition-opacity ${showDeleteId === ex.id ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
                <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(item => item.id !== ex.id)); }} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
            </div>
            
            <div 
              className="relative glass-card p-5 flex justify-between items-center transition-transform duration-200"
              style={{ transform: showDeleteId === ex.id ? 'translateX(-64px)' : 'translateX(0px)' }}
              onClick={() => setShowDeleteId(showDeleteId === ex.id ? null : ex.id)}
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchMove={(e) => {
                if (touchStartX === null) return;
                const diff = e.touches[0].clientX - touchStartX;
                if (diff < 0) e.currentTarget.style.transform = `translateX(${diff}px)`;
              }}
              onTouchEnd={async (e) => {
                const el = e.currentTarget;
                const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
                if (Math.abs(matrix.m41) > el.offsetWidth * 0.4) { // Sensibilité rétablie (40% pour supprimer)
                    await deleteWorkoutExercise(ex.id);
                    setExercises(prev => prev.filter(item => item.id !== ex.id));
                } else {
                    el.style.transition = 'transform 0.3s ease';
                    el.style.transform = `translateX(0px)`;
                }
                setTouchStartX(null);
              }}
            >
              <div>
                <h3 className="font-black text-white uppercase italic">{ex.exercise_name}</h3>
                <p className="text-[10px] font-black text-menthe uppercase tracking-widest">
                    {formatLoadLabel(ex.load_type, ex.load_g)} • {ex.reps} reps
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}