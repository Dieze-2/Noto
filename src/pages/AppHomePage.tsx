import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise, getLastExerciseByName } from "../db/workouts";
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
  
  // Formulaire
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"PDC" | "PDC_PLUS" | "KG" | "TEXT">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newSets, setNewSets] = useState("1"); // Champ séries secondaires

  // UI State
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [headerTouchStartX, setHeaderTouchStartX] = useState<number | null>(null);
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

  const groupedExercises = useMemo(() => {
    const groups: any[] = [];
    exercises.forEach(ex => {
      const last = groups[groups.length - 1];
      if (last && last.exercise_name === ex.exercise_name) {
        last.sets.push(ex);
      } else {
        groups.push({ ...ex, sets: [ex] });
      }
    });
    return groups;
  }, [exercises]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-6 overflow-x-hidden">
      <div className="flex justify-center py-4">
        <div className="w-24 h-24 relative rounded-full border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
            <img src="./logo.png" alt="Logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
        </div>
      </div>
      
      {/* Header avec Navigation Swipe */}
      <div 
        className="flex items-center justify-between bg-white/5 p-2 rounded-2xl touch-pan-y"
        onTouchStart={(e) => setHeaderTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (headerTouchStartX === null) return;
          const diff = e.changedTouches[0].clientX - headerTouchStartX;
          if (diff > 50) setCurrentDate(subDays(currentDate, 1));
          if (diff < -50) setCurrentDate(addDays(currentDate, 1));
          setHeaderTouchStartX(null);
        }}
      >
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-3 text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-3 text-white">→</button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {['steps', 'kcal', 'weight'].map((m) => (
          <div key={m} className="glass-card p-4 rounded-3xl border-b-2 border-white/10">
            <p className="text-[8px] font-black text-white/40 uppercase mb-1">{m === 'weight' ? 'Poids (kg)' : m}</p>
            <input 
              type={m === 'weight' ? "text" : "number"} 
              value={(metrics as any)[m]} 
              onChange={e => saveMetrics({[m]: e.target.value})} 
              className="w-full bg-transparent text-xl font-black text-white outline-none" placeholder="0" 
            />
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe relative">
        <input 
          placeholder="Exercice..." 
          value={newName} 
          onChange={async (e) => {
            setNewName(e.target.value);
            if (e.target.value.length > 1) {
                const all = await listCatalogExercises();
                setSuggestions(all.filter(i => i.name.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
            } else setSuggestions([]);
          }} 
          className="w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" 
        />
        
        {suggestions.length > 0 && (
          <div className="absolute z-50 left-6 right-6 top-20 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map(s => (
              <div key={s.id} onClick={async () => { 
                setNewName(s.name); setSuggestions([]);
                const last = await getLastExerciseByName(s.name);
                if(last) { setNewLoadType(last.load_type); setNewLoadVal(gramsToKg(last.load_g || 0).toString()); }
              }} className="p-4 text-white font-bold border-b border-white/5 active:bg-menthe active:text-black">{s.name}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-4 rounded-2xl font-bold text-white outline-none text-xs">
            <option value="KG">KG</option><option value="PDC">PDC</option><option value="PDC_PLUS">PDC +</option>
          </select>
          <input placeholder="Charge" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="col-span-1 bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          <input placeholder="Reps" inputMode="numeric" value={newReps} onChange={e => setNewReps(e.target.value)} className="bg-white/5 p-4 rounded-2xl font-bold text-white outline-none" />
          <input placeholder="Séries" inputMode="numeric" value={newSets} onChange={e => setNewSets(e.target.value)} className="bg-white/5 p-4 rounded-2xl font-bold text-menthe outline-none" />
        </div>

        <button onClick={async () => {
          if(!workoutId || !newName) return;
          const setsCount = parseInt(newSets) || 1;
          for(let i=0; i<setsCount; i++) {
            await addWorkoutExercise({ 
                workout_id: workoutId, 
                exercise_name: newName, 
                load_type: newLoadType, 
                load_g: kgToGramsInt(parseDecimalFlexible(newLoadVal) || 0), 
                reps: parseInt(newReps) || null 
            });
          }
          setNewName(""); setNewLoadVal(""); setNewReps(""); setNewSets("1"); setExercises(await getWorkoutExercises(workoutId));
        }} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">Enregistrer</button>
      </section>

      {/* Liste des exercices avec Slide réactif et bouton rotatif */}
      <div className="space-y-4">
        {groupedExercises.map(group => (
          <div key={group.id} className="space-y-1">
            {group.sets.map((ex: any, idx: number) => (
              <div key={ex.id} className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-r from-transparent from-80% to-rose-600/40">
                <div className={`absolute inset-y-0 right-0 w-16 flex items-center justify-center transition-all duration-300 ${showDeleteId === ex.id ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation();
                        await deleteWorkoutExercise(ex.id); 
                        setExercises(prev => prev.filter(item => item.id !== ex.id)); 
                      }} 
                      className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center transform transition-transform duration-500 hover:rotate-90 active:rotate-[180deg]"
                    >
                      ✕
                    </button>
                </div>
                
                <div 
                  className="relative glass-card p-5 flex justify-between items-center transition-transform duration-300 ease-out"
                  style={{ transform: showDeleteId === ex.id ? 'translateX(-64px)' : 'translateX(0px)' }}
                  onClick={() => setShowDeleteId(showDeleteId === ex.id ? null : ex.id)}
                  onTouchStart={(e) => { setTouchStartX(e.touches[0].clientX); e.currentTarget.style.transition = 'none'; }}
                  onTouchMove={(e) => {
                    if (touchStartX === null) return;
                    const diff = e.touches[0].clientX - touchStartX;
                    if (diff < 0) e.currentTarget.style.transform = `translateX(${Math.max(diff, -100)}px)`;
                  }}
                  onTouchEnd={(e) => {
                    const el = e.currentTarget;
                    el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    const matrix = new WebKitCSSMatrix(window.getComputedStyle(el).transform);
                    if (matrix.m41 < -40) { setShowDeleteId(ex.id); el.style.transform = `translateX(-64px)`; } 
                    else { setShowDeleteId(null); el.style.transform = `translateX(0px)`; }
                    setTouchStartX(null);
                  }}
                >
                  <div className={idx > 0 ? "opacity-50 scale-95 origin-left pl-4 border-l border-white/10" : ""}>
                    <h3 className="font-black text-white uppercase italic text-sm">{ex.exercise_name}</h3>
                    <p className="text-[10px] font-black text-menthe uppercase tracking-widest">
                        {formatLoadLabel(ex.load_type, ex.load_g)} • {ex.reps} reps
                    </p>
                  </div>
                  {idx === 0 && group.sets.length > 1 && (
                    <span className="bg-white/10 px-2 py-1 rounded-lg text-[8px] font-black text-white/40 uppercase">{group.sets.length} séries</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}