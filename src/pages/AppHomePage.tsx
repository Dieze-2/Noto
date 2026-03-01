import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2, Check } from "lucide-react";
import AppShell from "../components/AppShell";
import StatBubble from "../components/StatBubble";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { getOrCreateWorkout, getWorkoutExercises, addWorkoutExercise, deleteWorkoutExercise } from "../db/workouts";

export default function AppHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);

  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", reps: "", weight: "" });

  useEffect(() => {
    async function loadData() {
      const m = await getDailyMetricsByDate(dateStr);
      setMetrics({
        steps: m?.steps?.toString() || "",
        kcal: m?.kcal?.toString() || "",
        weight: m?.weight_g ? (m.weight_g / 1000).toString() : ""
      });

      const workout = await getOrCreateWorkout(dateStr);
      if (workout) {
        const ex = await getWorkoutExercises(workout.id);
        setExercises(ex);
      }
    }
    loadData();
  }, [dateStr]);

  const handleAddExercise = async () => {
    if (!newEx.name) return;
    const workout = await getOrCreateWorkout(dateStr);
    await addWorkoutExercise({
      workout_id: workout.id,
      exercise_name: newEx.name,
      reps: parseInt(newEx.reps) || 0,
      load_g: (parseFloat(newEx.weight) || 0) * 1000,
      sort_order: exercises.length
    });
    // Refresh
    const ex = await getWorkoutExercises(workout.id);
    setExercises(ex);
    setShowAddForm(false);
    setNewEx({ name: "", reps: "", weight: "" });
  };

  const changeDate = (days: number) => {
    const newDate = addDays(currentDate, days);
    setCurrentDate(newDate);
    setSearchParams({ date: format(newDate, "yyyy-MM-dd") });
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Logo - Utilisation du chemin absolu /logo.png */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mb-6" />
          
          <div className="flex items-center justify-between w-full">
            <button onClick={() => changeDate(-1)} className="p-2 text-white/20"><ChevronLeft size={28}/></button>
            <div className="text-center">
              <h1 className="title-xl lowercase font-black text-white">{format(currentDate, "EEEE d", { locale: fr })}</h1>
              <p className="subtitle-xs text-white/40 uppercase tracking-widest">{format(currentDate, "MMMM yyyy", { locale: fr })}</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 text-white/20"><ChevronRight size={28}/></button>
          </div>
        </div>

        {/* Swipe Area - Correction Framer Motion */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) changeDate(-1);
            if (info.offset.x < -80) changeDate(1);
          }}
          className="grid grid-cols-3 gap-3 mb-12 cursor-grab active:cursor-grabbing"
        >
          <StatBubble icon={Footprints} label="Pas" value={metrics.steps || "--"} accent />
          <StatBubble icon={Flame} label="Kcal" value={metrics.kcal || "--"} colorClass="text-yellow-400" />
          <StatBubble icon={Weight} label="Poids" value={metrics.weight || "--"} unit="kg" colorClass="text-purple-500" />
        </motion.div>

        {/* Ma Séance */}
        <div className="flex flex-col items-center pb-20">
          <h2 className="font-black italic uppercase text-2xl mb-6 tracking-tighter self-start">Ma Séance</h2>
          
          <div className="w-full space-y-3">
            {exercises.map((ex) => (
              <GlassCard key={ex.id} className="p-4 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-menthe/10 flex items-center justify-center text-menthe">
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm text-white">{ex.exercise_name}</p>
                    <p className="text-xs font-bold text-white/40 italic">
                      <span className="text-menthe">{ex.reps}</span> reps @ <span className="text-white">{ex.load_g / 1000}kg</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteWorkoutExercise(ex.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </GlassCard>
            ))}

            {/* Formulaire d'ajout rapide */}
            <AnimatePresence>
              {showAddForm ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <GlassCard className="p-4 border-menthe/30 space-y-4">
                    <input 
                      autoFocus
                      placeholder="Nom de l'exercice..."
                      className="w-full bg-transparent border-b border-white/10 py-2 font-bold uppercase italic focus:border-menthe outline-none"
                      value={newEx.name}
                      onChange={(e) => setNewEx({...newEx, name: e.target.value})}
                    />
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase font-black text-white/30">Charge (kg)</label>
                        <input type="number" className="w-full bg-transparent border-b border-white/10 py-1 outline-none font-black" 
                          value={newEx.weight} onChange={(e) => setNewEx({...newEx, weight: e.target.value})} />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] uppercase font-black text-white/30">Répétitions</label>
                        <input type="number" className="w-full bg-transparent border-b border-white/10 py-1 outline-none font-black" 
                          value={newEx.reps} onChange={(e) => setNewEx({...newEx, reps: e.target.value})} />
                      </div>
                      <button onClick={handleAddExercise} className="bg-menthe text-black p-3 rounded-xl self-end">
                        <Check size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <div className="flex justify-center">
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="w-14 h-14 bg-menthe text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:scale-110 transition-all"
                  >
                    <Plus size={30} strokeWidth={3} />
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppShell>
  );
}