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
  const [newComment, setNewComment] = useState(""); // Note de série
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
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6 overflow-x-hidden">
      {/* Logo réduit style Glass */}
      <div className="flex justify-center py-4">
        <div className="w-32 h-32 relative flex items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
            <img src="./logo.png" alt="Logo" className="w-20 h-20 object-contain filter drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]" />
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter">{format(currentDate, 'd MMMM yyyy', { locale: fr })}</div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-white">→</button>
      </div>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
        <input placeholder="Exercice..." value={newName} onChange={e => handleSearch(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        <div className="flex gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl font-bold text-white outline-none">
            <option value="KG">KG</option>
            <option value="PDC">PDC</option>
            <option value="PDC_PLUS">PDC +</option>
          </select>
          <input placeholder="Charge" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="flex-1 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          <input placeholder="Reps" inputMode="numeric" value={newReps} onChange={e => setNewReps(e.target.value)} className="w-20 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
        </div>
        <input placeholder="Note (ex: tempo, ressenti...)" value={newComment} onChange={e => setNewComment(e.target.value)} className="w-full bg-white/5 p-3 rounded-xl text-xs font-bold text-white/60 outline-none italic" />
        
        <button onClick={async () => {
          if(!workoutId || !newName) return;
          await addWorkoutExercise({ 
            workout_id: workoutId, 
            exercise_name: newName, 
            load_type: newLoadType, 
            load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), 
            reps: parseInt(newReps) || null,
            comment: newComment || null
          });
          setNewName(""); setNewLoadVal(""); setNewReps(""); setNewComment(""); setExercises(await getWorkoutExercises(workoutId));
        }} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
      </section>

      <div className="space-y-3">
        {exercises.map(ex => (
          <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-rose-600">
            {/* Background Action Supprimer */}
            <div className="absolute inset-0 flex items-center justify-end px-8">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Relâcher pour supprimer</span>
            </div>
            
            {/* Card glissante */}
            <div 
              className="relative glass-card p-5 flex justify-between items-center transition-transform duration-200 touch-pan-x"
              style={{ transform: 'translateX(0px)' }}
              onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
              onTouchMove={(e) => {
                if (touchStartX === null) return;
                const diff = e.touches[0].clientX - touchStartX;
                if (diff < 0) { // On ne slide que vers la gauche
                    const el = e.currentTarget;
                    el.style.transform = `translateX(${Math.max(diff, -window.innerWidth)}px)`;
                    el.style.transition = 'none';
                }
              }}
              onTouchEnd={async (e) => {
                const el = e.currentTarget;
                const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
                const currentTranslate = Math.abs(matrix.m41);
                const threshold = el.offsetWidth * 0.75; // 75% de la longueur

                if (currentTranslate > threshold) {
                    // Animation de sortie complète
                    el.style.transition = 'transform 0.3s ease-out';
                    el.style.transform = `translateX(-100%)`;
                    setTimeout(async () => {
                        await deleteWorkoutExercise(ex.id);
                        setExercises(prev => prev.filter(item => item.id !== ex.id));
                    }, 300);
                } else {
                    // Retour à la position initiale
                    el.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    el.style.transform = `translateX(0px)`;
                }
                setTouchStartX(null);
              }}
            >
              <div>
                <h3 className="font-black text-white">{ex.exercise_name}</h3>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-menthe uppercase tracking-widest">
                        {/* Correction affichage charge + type */}
                        {ex.load_type} {ex.load_g ? `(${formatKgFR(gramsToKg(ex.load_g), 1)} kg)` : ""} • {ex.reps} reps
                    </p>
                    {ex.comment && <span className="text-[9px] text-white/30 italic"> — {ex.comment}</span>}
                </div>
              </div>
              <div className="w-2 h-8 bg-white/10 rounded-full" /> {/* Indicateur visuel de grip */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}