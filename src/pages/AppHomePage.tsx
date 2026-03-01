import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2, Check, X } from "lucide-react";
import AppShell from "../components/AppShell";
import StatBubble from "../components/StatBubble";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { getOrCreateWorkout, getWorkoutExercises, addWorkoutExercise, deleteWorkoutExercise } from "../db/workouts";
import { listCatalogExercises, CatalogExercise } from "../db/catalog";

export default function AppHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);

  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  
  // Formulaire
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", reps: "", weight: "", load_type: "KG" as "KG" | "PDC_PLUS" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      const [m, workout, cat] = await Promise.all([
        getDailyMetricsByDate(dateStr),
        getOrCreateWorkout(dateStr),
        listCatalogExercises()
      ]);

      setMetrics({
        steps: m?.steps?.toString() || "",
        kcal: m?.kcal?.toString() || "",
        weight: m?.weight_g ? (m.weight_g / 1000).toString() : ""
      });

      if (workout) {
        const ex = await getWorkoutExercises(workout.id);
        setExercises(ex);
      }
      setCatalog(cat);
    }
    loadData();
  }, [dateStr]);

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    return catalog.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [searchTerm, catalog]);

  const handleUpdateMetric = async (key: string, val: string) => {
    const updated = { ...metrics, [key]: val };
    setMetrics(updated);
    await upsertDailyMetrics({
      date: dateStr,
      steps: key === 'steps' ? parseInt(val) || 0 : parseInt(updated.steps) || 0,
      kcal: key === 'kcal' ? parseInt(val) || 0 : parseInt(updated.kcal) || 0,
      weight_g: key === 'weight' ? parseFloat(val) * 1000 || 0 : parseFloat(updated.weight) * 1000 || 0,
      note: null
    });
  };

  const onAdd = async () => {
    if (!searchTerm) return;
    const workout = await getOrCreateWorkout(dateStr);
    await addWorkoutExercise({
      workout_id: workout.id,
      exercise_name: searchTerm,
      reps: parseInt(newEx.reps) || 0,
      load_g: (parseFloat(newEx.weight) || 0) * 1000,
      load_type: newEx.load_type,
      sort_order: exercises.length
    });
    const ex = await getWorkoutExercises(workout.id);
    setExercises(ex);
    setShowAddForm(false);
    setSearchTerm("");
    setNewEx({ name: "", reps: "", weight: "", load_type: "KG" });
  };

  const changeDate = (days: number) => {
    const d = addDays(currentDate, days);
    setCurrentDate(d);
    setSearchParams({ date: format(d, "yyyy-MM-dd") });
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 pt-12">
        {/* Header avec Logo (Identique à ImportPage) */}
        <header className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 relative rounded-full border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden mb-8">
              <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
          </div>

          <motion.div 
            drag="x" dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => { if (info.offset.x > 50) changeDate(-1); if (info.offset.x < -50) changeDate(1); }}
            className="flex items-center justify-between w-full cursor-grab active:cursor-grabbing"
          >
            <button onClick={() => changeDate(-1)} className="p-2 text-white/20"><ChevronLeft size={32}/></button>
            <div className="text-center">
              <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">{format(currentDate, "EEEE d", { locale: fr })}</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">{format(currentDate, "MMMM yyyy", { locale: fr })}</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 text-white/20"><ChevronRight size={32}/></button>
          </motion.div>
        </header>

        {/* Métriques Saisissables */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          <div className="relative">
            <StatBubble icon={Footprints} label="Pas" value={metrics.steps || "--"} accent />
            <input type="number" className="absolute inset-0 opacity-0 w-full h-full" value={metrics.steps} onChange={(e) => handleUpdateMetric('steps', e.target.value)} />
          </div>
          <div className="relative">
            <StatBubble icon={Flame} label="Kcal" value={metrics.kcal || "--"} colorClass="text-yellow-200" />
            <input type="number" className="absolute inset-0 opacity-0 w-full h-full" value={metrics.kcal} onChange={(e) => handleUpdateMetric('kcal', e.target.value)} />
          </div>
          <div className="relative">
            <StatBubble icon={Weight} label="Poids" value={metrics.weight || "--"} unit="kg" colorClass="text-purple-500" />
            <input type="number" step="0.1" className="absolute inset-0 opacity-0 w-full h-full" value={metrics.weight} onChange={(e) => handleUpdateMetric('weight', e.target.value)} />
          </div>
        </div>

        {/* Séance */}
        <div className="pb-32">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-8 text-center">Ma Séance</h2>
          
          <div className="space-y-4">
            {exercises.map((ex) => (
              <GlassCard key={ex.id} className="p-5 flex justify-between items-center group relative overflow-hidden">
                <div className="flex items-center gap-5">
                  <Dumbbell className="text-menthe" size={24} />
                  <div>
                    <p className="font-black text-lg text-white uppercase italic leading-none">{ex.exercise_name}</p>
                    <p className="text-xs font-bold text-white/40 mt-1 uppercase tracking-wider">
                      {ex.reps} reps • {ex.load_g / 1000}kg <span className="text-menthe/50">[{ex.load_type === 'PDC_PLUS' ? 'PDC+' : 'KG'}]</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteWorkoutExercise(ex.id)} className="text-rose-500/30 hover:text-rose-500 transition-colors p-2"><Trash2 size={18} /></button>
              </GlassCard>
            ))}

            {showAddForm ? (
              <GlassCard className="p-6 border-menthe/30 animate-in fade-in slide-in-from-bottom-4">
                <div className="relative mb-4">
                  <input 
                    placeholder="Chercher un exercice..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold uppercase italic text-sm outline-none focus:border-menthe"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl mt-1 overflow-hidden">
                      {filteredSuggestions.map(s => (
                        <button key={s.id} className="w-full text-left px-4 py-3 hover:bg-menthe hover:text-black font-bold uppercase italic text-xs transition-colors" onClick={() => setSearchTerm(s.name)}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase mb-1 block">Reps</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black outline-none" value={newEx.reps} onChange={(e) => setNewEx({...newEx, reps: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase mb-1 block">Charge</label>
                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black outline-none" value={newEx.weight} onChange={(e) => setNewEx({...newEx, weight: e.target.value})} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex bg-white/5 rounded-xl p-1 flex-1">
                    {(["KG", "PDC_PLUS"] as const).map(type => (
                      <button key={type} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${newEx.load_type === type ? 'bg-menthe text-black' : 'text-white/30'}`} onClick={() => setNewEx({...newEx, load_type: type})}>
                        {type === "PDC_PLUS" ? "PDC +" : "KG"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddForm(false)} className="p-3 bg-white/5 rounded-xl text-rose-500"><X size={20}/></button>
                    <button onClick={onAdd} className="p-3 bg-menthe rounded-xl text-black"><Check size={20} strokeWidth={3}/></button>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="w-full py-8 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center group hover:border-menthe/20 transition-all mt-4">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-menthe group-hover:text-black transition-all">
                  <Plus size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-4 group-hover:text-menthe transition-all">Ajouter Exercice</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}