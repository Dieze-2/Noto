import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2, Check, X, Copy } from "lucide-react";
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
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ reps: "", weight: "", load_type: "KG" as "KG" | "PDC_PLUS" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const changeDate = (days: number) => {
    const d = addDays(currentDate, days);
    setCurrentDate(d);
    setSearchParams({ date: format(d, "yyyy-MM-dd") });
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
    refreshExercises(workout.id);
    setShowAddForm(false);
    setSearchTerm("");
  };

  const duplicateSet = async (ex: any) => {
    const workout = await getOrCreateWorkout(dateStr);
    await addWorkoutExercise({
      workout_id: workout.id,
      exercise_name: ex.exercise_name,
      reps: ex.reps,
      load_g: ex.load_g,
      load_type: ex.load_type,
      sort_order: exercises.length
    });
    refreshExercises(workout.id);
  };

  const refreshExercises = async (id: string) => {
    const ex = await getWorkoutExercises(id);
    setExercises(ex);
  };

  const handleDelete = async (id: string) => {
    await deleteWorkoutExercise(id);
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
        <header className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 relative rounded-full border border-white/10 overflow-hidden mb-8 shadow-2xl">
              <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
          </div>

          <motion.div 
            drag="x" dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => { if (info.offset.x > 50) changeDate(-1); if (info.offset.x < -50) changeDate(1); }}
            className="flex items-center justify-between w-full cursor-grab active:cursor-grabbing bg-white/5 py-4 rounded-3xl border border-white/5"
          >
            <button onClick={() => changeDate(-1)} className="p-2 text-white/20 hover:text-white"><ChevronLeft size={32}/></button>
            <div className="text-center">
              <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">{format(currentDate, "EEEE d", { locale: fr })}</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{format(currentDate, "MMMM yyyy", { locale: fr })}</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 text-white/20 hover:text-white"><ChevronRight size={32}/></button>
          </motion.div>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-12">
          <StatBubble icon={Footprints} label="Pas" value={metrics.steps || "--"} accent />
          <StatBubble icon={Flame} label="Kcal" value={metrics.kcal || "--"} colorClass="text-yellow-200" />
          <StatBubble icon={Weight} label="Poids" value={metrics.weight || "--"} unit="kg" colorClass="text-purple-500" />
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter text-center">Ma Séance</h2>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {exercises.map((ex) => (
                <motion.div
                  key={ex.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                  drag="x"
                  dragConstraints={{ left: -100, right: 0 }}
                  onDragEnd={(_, info) => { if (info.offset.x < -70) handleDelete(ex.id); }}
                  className="relative group"
                >
                  {/* Fond de suppression au swipe */}
                  <div className="absolute inset-0 bg-rose-500 rounded-[1.5rem] flex items-center justify-end px-6 text-white font-black italic uppercase text-[10px] tracking-widest">
                    Supprimer
                  </div>

                  <motion.div className="relative">
                    <GlassCard className="p-4 flex justify-between items-center border-white/5 group-active:scale-[0.98] transition-transform">
                      <div className="flex items-center gap-4">
                        <Dumbbell className="text-menthe" size={20} />
                        <div>
                          <p className="font-black text-white uppercase italic leading-none">{ex.exercise_name}</p>
                          <p className="text-[11px] font-bold text-white/40 mt-1 uppercase">
                            {ex.load_type === 'PDC_PLUS' ? `PDC + ${ex.load_g / 1000}` : `${ex.load_g / 1000}`} kg • <span className="text-menthe">{ex.reps} reps</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => duplicateSet(ex)} className="p-2 text-white/20 hover:text-menthe transition-colors"><Copy size={18} /></button>
                        <button onClick={() => handleDelete(ex.id)} className="p-2 text-white/20 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </GlassCard>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>

            {showAddForm ? (
              <GlassCard className="p-6 border-menthe/30 space-y-4">
                <div className="relative">
                  <input 
                    placeholder="Exercice..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold uppercase italic outline-none focus:border-menthe"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl mt-1 shadow-2xl overflow-hidden">
                      {filteredSuggestions.map(s => (
                        <button key={s.id} className="w-full text-left px-4 py-3 hover:bg-menthe hover:text-black font-bold uppercase italic text-xs" 
                          onClick={() => { setSearchTerm(s.name); setShowSuggestions(false); }}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex bg-white/5 rounded-xl p-1 h-11">
                    {(["KG", "PDC_PLUS"] as const).map(type => (
                      <button key={type} className={`flex-1 rounded-lg font-black text-[9px] uppercase transition-all ${newEx.load_type === type ? 'bg-menthe text-black' : 'text-white/30'}`} onClick={() => setNewEx({...newEx, load_type: type})}>
                        {type === "PDC_PLUS" ? "PDC+" : "KG"}
                      </button>
                    ))}
                  </div>
                  <input type="number" placeholder="kg" className="bg-white/5 border border-white/10 rounded-xl px-2 text-center font-black outline-none h-11" value={newEx.weight} onChange={(e) => setNewEx({...newEx, weight: e.target.value})} />
                  <input type="number" placeholder="reps" className="bg-white/5 border border-white/10 rounded-xl px-2 text-center font-black outline-none h-11" value={newEx.reps} onChange={(e) => setNewEx({...newEx, reps: e.target.value})} />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-black uppercase text-xs text-white/40">Annuler</button>
                  <button onClick={onAdd} className="flex-1 py-3 bg-menthe rounded-xl font-black uppercase text-xs text-black">Valider</button>
                </div>
              </GlassCard>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-white/20 hover:border-menthe/20 hover:text-menthe transition-all">
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Nouveau mouvement</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}