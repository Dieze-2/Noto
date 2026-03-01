import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsByDate } from "../db/dailyMetrics";
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
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"PDC" | "PDC_PLUS" | "KG" | "TEXT">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newComment, setNewComment] = useState("");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const w = await getOrCreateWorkout(dateStr);
      setWorkoutId(w.id);
      setExercises(await getWorkoutExercises(w.id));
    }
    load();
  }, [dateStr]);

  const handleSearch = async (val: string) => {
    setNewName(val);
    if (val.length > 1) {
      const all = await listCatalogExercises();
      setSuggestions(all.filter(i => i.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else { setSuggestions([]); }
  };

  const formatLoadLabel = (type: string, grams: number | null) => {
    if (!grams && type !== "PDC") return type;
    const kg = gramsToKg(grams || 0);
    const val = kg % 1 === 0 ? kg.toString() : formatKgFR(kg, 1).replace(',', '.');
    if (type === "KG") return `${val} KG`;
    if (type === "PDC_PLUS") return `PDC + ${val} KG`;
    return type;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6 overflow-x-hidden">
      {/* Logo réduit Circulaire */}
      <div className="flex justify-center py-4">
        <div className="w-24 h-24 relative rounded-full border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
            <img src="./logo.png" alt="Logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter">{format(currentDate, 'd MMMM yyyy', { locale: fr })}</div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-white">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe relative">
        <input placeholder="Exercice..." value={newName} onChange={e => handleSearch(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        
        {/* Suggestions actives */}
        {suggestions.length > 0 && (
          <div className="absolute z-50 left-6 right-6 top-20 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map(s => (
              <div key={s.id} onClick={() => { setNewName(s.name); setSuggestions([]); }} className="p-4 text-white font-bold border-b border-white/5 active:bg-menthe active:text-black">{s.name}</div>
            ))}
          </div>
        )}

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
          await addWorkoutExercise({ 
            workout_id: workoutId, exercise_name: newName, load_type: newLoadType, 
            load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), reps: parseInt(newReps) || null, comment: newComment || null
          });
          setNewName(""); setNewLoadVal(""); setNewReps(""); setSuggestions([]); setExercises(await getWorkoutExercises(workoutId));
        }} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-r from-transparent from-90% to-rose-600/80">
            {/* Bouton Supprimer (Visible sur PC/Hover ou Swipe) */}
            <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(item => item.id !== ex.id)); }} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
            </div>
            
            <div 
              className="relative glass-card p-5 flex justify-between items-center transition-transform duration-200 touch-pan-x"
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchMove={(e) => {
                if (touchStartX === null) return;
                const diff = e.touches[0].clientX - touchStartX;
                if (diff < 0) e.currentTarget.style.transform = `translateX(${diff}px)`;
              }}
              onTouchEnd={async (e) => {
                const el = e.currentTarget;
                const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
                if (Math.abs(matrix.m41) > el.offsetWidth * 0.75) {
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
                <h3 className="font-black text-white">{ex.exercise_name}</h3>
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