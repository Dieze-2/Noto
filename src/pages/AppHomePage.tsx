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
  
  // Formulaire (Valeurs par défaut supprimées)
  const [newName, setNewName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [newLoadType, setNewLoadType] = useState<"KG" | "PDC_PLUS" | "TEXT">("KG");
  const [newLoadVal, setNewLoadVal] = useState("");
  const [newReps, setNewReps] = useState("");
  const [newComment, setNewComment] = useState(""); // Champ Note pour les séries suivantes

  // UI State
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
    const kg = gramsToKg(grams || 0);
    const val = kg % 1 === 0 ? kg.toString() : formatKgFR(kg, 1).replace(',', '.');
    return type === "KG" ? `${val} KG` : type === "PDC_PLUS" ? `PDC + ${val} KG` : type;
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-8 overflow-x-hidden text-lg">
      <div className="flex justify-center py-6">
        <div className="w-28 h-28 relative rounded-full border border-white/10 overflow-hidden shadow-2xl">
            <img src="./logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Navigation Swipe corrigée */}
      <div 
        className="flex items-center justify-between bg-white/5 p-3 rounded-2xl touch-pan-y"
        onTouchStart={(e) => setHeaderTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (headerTouchStartX === null) return;
          const diff = e.changedTouches[0].clientX - headerTouchStartX;
          if (diff > 60) setCurrentDate(subDays(currentDate, 1));
          if (diff < -60) setCurrentDate(addDays(currentDate, 1));
          setHeaderTouchStartX(null);
        }}
      >
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-4 text-2xl text-white">←</button>
        <div className="text-center text-white font-black uppercase italic tracking-tighter text-xl">
            {format(currentDate, 'd MMMM yyyy', { locale: fr })}
        </div>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-4 text-2xl text-white">→</button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {['steps', 'kcal', 'weight'].map((m) => (
          <div key={m} className="glass-card p-5 rounded-3xl border-b-2 border-white/10">
            <p className="text-[10px] font-black text-white/40 uppercase mb-2">{m === 'weight' ? 'Poids (kg)' : m}</p>
            <input 
              type="text" 
              inputMode={m === 'weight' ? "decimal" : "numeric"}
              value={(metrics as any)[m]} 
              onChange={e => saveMetrics({[m]: e.target.value})} 
              className="w-full bg-transparent text-2xl font-black text-white outline-none" placeholder="-" 
            />
          </div>
        ))}
      </div>

      {/* Formulaire */}
      <section className="glass-card p-8 rounded-[2.5rem] space-y-5 border-b-4 border-menthe relative">
        <input 
          placeholder="Nom de l'exercice..." 
          value={newName} 
          onChange={async (e) => {
            setNewName(e.target.value);
            if (e.target.value.length > 1) {
                const all = await listCatalogExercises();
                setSuggestions(all.filter(i => i.name.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5));
            } else setSuggestions([]);
          }} 
          className="w-full bg-white/5 p-5 rounded-2xl font-bold text-white text-xl outline-none" 
        />
        
        {suggestions.length > 0 && (
          <div className="absolute z-50 left-8 right-8 top-24 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map(s => (
              <div key={s.id} onClick={async () => { 
                setNewName(s.name); setSuggestions([]);
                const last = await getLastExerciseByName(s.name);
                if(last) { setNewLoadType(last.load_type as any); }
              }} className="p-5 text-white font-bold border-b border-white/5 active:bg-menthe active:text-black text-lg">{s.name}</div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <select value={newLoadType} onChange={e => setNewLoadType(e.target.value as any)} className="bg-white/5 p-5 rounded-2xl font-bold text-white outline-none text-base">
            <option value="KG">KG</option><option value="PDC_PLUS">PDC +</option><option value="TEXT">TXT</option>
          </select>
          <input placeholder="Charge" inputMode="decimal" value={newLoadVal} onChange={e => setNewLoadVal(e.target.value)} className="bg-white/5 p-5 rounded-2xl font-bold text-white text-xl outline-none" />
          <input placeholder="Reps" inputMode="numeric" value={newReps} onChange={e => setNewReps(e.target.value)} className="bg-white/5 p-5 rounded-2xl font-bold text-white text-xl outline-none" />
        </div>

        <textarea 
          placeholder="Notes pour les séries suivantes (ex: S2: 10kg x 8, S3: PDC x 12...)" 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          className="w-full bg-white/5 p-5 rounded-2xl font-medium text-white text-base outline-none min-h-[100px]"
        />

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
        }} className="w-full bg-menthe text-black py-6 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform">Enregistrer</button>
      </section>

      {/* Liste des exercices */}
      <div className="space-y-6">
        {exercises.map(ex => (
          <div key={ex.id} className="relative overflow-hidden rounded-[2rem] bg-rose-600/20">
            <div className={`absolute inset-y-0 right-0 w-20 flex items-center justify-center transition-opacity ${showDeleteId === ex.id ? 'opacity-100' : 'opacity-0'}`}>
                <button onClick={async () => { await deleteWorkoutExercise(ex.id); setExercises(prev => prev.filter(i => i.id !== ex.id)); }} className="w-12 h-12 rounded-full bg-rose-600 text-white text-xl">✕</button>
            </div>
            
            <div 
              className="relative glass-card p-6 flex flex-col gap-2 transition-transform duration-300"
              style={{ transform: showDeleteId === ex.id ? 'translateX(-80px)' : 'translateX(0px)' }}
              onClick={() => setShowDeleteId(showDeleteId === ex.id ? null : ex.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-black text-white uppercase italic text-xl">{ex.exercise_name}</h3>
                <span className="text-xs font-black text-menthe uppercase tracking-tighter bg-menthe/10 px-3 py-1 rounded-full">Série Master</span>
              </div>
              
              <p className="text-lg font-black text-white/90">
                  {formatLoadLabel(ex.load_type, ex.load_g)} • <span className="text-menthe">{ex.reps} reps</span>
              </p>

              {ex.comment && (
                <div className="mt-2 p-4 bg-white/5 rounded-xl border-l-2 border-menthe/30">
                  <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{ex.comment}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}