import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, Plus, ChevronLeft, ChevronRight, Dumbbell, Trash2 } from "lucide-react";
import AppShell from "../components/AppShell";
import StatBubble from "../components/StatBubble";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { getOrCreateWorkout, getWorkoutExercises, deleteWorkoutExercise } from "../db/workouts";

export default function AppHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const dateStr = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);

  const [metrics, setMetrics] = useState({ steps: "", kcal: "", weight: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const m = await getDailyMetricsByDate(dateStr);
      if (m) {
        setMetrics({
          steps: m.steps?.toString() || "",
          kcal: m.kcal?.toString() || "",
          weight: m.weight_g ? (m.weight_g / 1000).toString() : ""
        });
      } else {
        setMetrics({ steps: "", kcal: "", weight: "" });
      }

      const workout = await getOrCreateWorkout(dateStr);
      if (workout) {
        const ex = await getWorkoutExercises(workout.id);
        setExercises(ex);
      }
      setLoading(false);
    }
    loadData();
  }, [dateStr]);

  // Sauvegarde automatique des métriques
  const updateMetric = async (key: string, value: string) => {
    const newMetrics = { ...metrics, [key]: value };
    setMetrics(newMetrics);
    
    await upsertDailyMetrics({
      date: dateStr,
      steps: key === 'steps' ? parseInt(value) || 0 : parseInt(newMetrics.steps) || 0,
      kcal: key === 'kcal' ? parseInt(value) || 0 : parseInt(newMetrics.kcal) || 0,
      weight_g: key === 'weight' ? parseFloat(value) * 1000 || 0 : parseFloat(newMetrics.weight) * 1000 || 0
    });
  };

  const changeDate = (days: number) => {
    const newDate = addDays(currentDate, days);
    setCurrentDate(newDate);
    setSearchParams({ date: format(newDate, "yyyy-MM-dd") });
  };

  const handleDeleteExercise = async (id: string) => {
    await deleteWorkoutExercise(id);
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <div className="flex items-center justify-between w-full">
            <button onClick={() => changeDate(-1)} className="p-2 text-white/20 hover:text-menthe transition-colors"><ChevronLeft size={28}/></button>
            <div className="text-center">
              <h1 className="title-xl lowercase font-black text-white leading-tight">{format(currentDate, "EEEE d", { locale: fr })}</h1>
              <p className="subtitle-xs text-white/40 uppercase tracking-[0.2em] font-bold">{format(currentDate, "MMMM yyyy", { locale: fr })}</p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 text-white/20 hover:text-menthe transition-colors"><ChevronRight size={28}/></button>
          </div>
        </div>

        {/* KPI avec Inputs invisibles pour saisie directe */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="relative">
            <StatBubble icon={Footprints} label="Pas" value={metrics.steps || "--"} accent />
            <input type="number" value={metrics.steps} onChange={(e) => updateMetric('steps', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </div>
          <div className="relative">
            <StatBubble icon={Flame} label="Kcal" value={metrics.kcal || "--"} colorClass="text-orange-500" />
            <input type="number" value={metrics.kcal} onChange={(e) => updateMetric('kcal', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </div>
          <div className="relative">
            <StatBubble icon={Weight} label="Poids" value={metrics.weight || "--"} unit="kg" colorClass="text-purple-500" />
            <input type="number" step="0.1" value={metrics.weight} onChange={(e) => updateMetric('weight', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </div>
        </div>

        {/* Section Séance */}
        <div className="flex flex-col items-center pb-20">
          <h2 className="font-black italic uppercase text-xl mb-6 tracking-tighter self-start px-2 border-l-4 border-menthe ml-2">Ma Séance</h2>
          
          <div className="w-full space-y-3">
            <AnimatePresence mode="popLayout">
              {exercises.length > 0 ? (
                exercises.map((ex) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <GlassCard className="flex items-center justify-between p-4 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <Dumbbell size={18} className="text-menthe opacity-70" />
                        </div>
                        <div>
                          <p className="font-black uppercase italic text-sm text-white">{ex.exercise_name}</p>
                          <p className="text-xs font-bold text-white/40">
                            <span className="text-menthe">{ex.reps}</span> reps • {ex.load_g / 1000}kg
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteExercise(ex.id)}
                        className="p-2 text-white/10 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </GlassCard>
                  </motion.div>
                ))
              ) : (
                <GlassCard className="w-full py-12 flex flex-col items-center border-dashed border-white/10">
                  <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black mb-6">Aucun exercice</p>
                </GlassCard>
              )}
            </AnimatePresence>

            {/* Bouton Ajouter flottant ou centré sous la liste */}
            <div className="flex justify-center pt-4">
              <button 
                className="w-14 h-14 bg-menthe text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,163,0.3)] active:scale-90 transition-all hover:scale-110"
                onClick={() => window.location.hash = "/catalog"} // Redirection vers catalogue
              >
                <Plus size={30} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}