import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useExternalRef } from "framer-motion";
import { Footprints, Flame, Weight, Plus, Trash2, Video, stickyNote } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

import Layout from "../components/Layout";
import GlassCard from "../components/GlassCard";
import StatBubble from "../components/StatBubble";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { addWorkoutExercise, getWorkoutExercises, deleteWorkoutExercise } from "../db/workouts";
import { gramsToKg, formatKgFR } from "../lib/numberFR";

export default function AppHomePage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const currentDate = dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date();
  const dateStr = useMemo(() => format(currentDate, 'yyyy-MM-dd'), [currentDate]);

  const [metrics, setMetrics] = useState({ steps: 0, kcal: 0, weight_g: 0 });
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const m = await getDailyMetricsByDate(dateStr);
      if (m) setMetrics({ steps: m.steps || 0, kcal: m.kcal || 0, weight_g: m.weight_g || 0 });
      
      const ex = await getWorkoutExercises(dateStr);
      setExercises(ex || []);
      setLoading(false);
    }
    loadData();
  }, [dateStr]);

  const handleAddSet = async (baseEx: any) => {
    // Ajoute une nouvelle série basée sur l'exercice existant
    const newSet = {
      exercise_name: baseEx.exercise_name,
      load_g: baseEx.load_g,
      reps: baseEx.reps,
      load_type: baseEx.load_type,
      date: dateStr,
      workout_id: baseEx.workout_id
    };
    const added = await addWorkoutExercise(newSet);
    if (added) setExercises([...exercises, added]);
  };

  const handleDelete = async (id: string) => {
    await deleteWorkoutExercise(id);
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  return (
    <Layout>
      {/* Header avec Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 glass-card p-1">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-2xl" />
        </div>
        <h1 className="page-title text-2xl">{format(currentDate, "EEEE d MMMM", { locale: fr })}</h1>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatBubble icon={Footprints} label="Pas" value={metrics.steps.toLocaleString('fr-FR')} accent />
        <StatBubble icon={Flame} label="Kcal" value={metrics.kcal} />
        <StatBubble icon={Weight} label="Poids" value={metrics.weight_g ? formatKgFR(gramsToKg(metrics.weight_g), 1) : "—"} unit="kg" />
      </div>

      {/* Exercices */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="title-brutal text-lg">Ma Séance</h2>
          <button className="bg-menthe text-black p-2 rounded-full active:scale-90 transition-transform">
            <Plus size={20} />
          </button>
        </div>

        <AnimatePresence>
          {exercises.map((ex) => (
            <ExerciseCard 
              key={ex.id} 
              ex={ex} 
              onDelete={() => handleDelete(ex.id)} 
              onAddSet={() => handleAddSet(ex)}
            />
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

function ExerciseCard({ ex, onDelete, onAddSet }: { ex: any, onDelete: () => void, onAddSet: () => void }) {
  const threshold = window.innerWidth * 0.6; // Seuil de 60%

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      {/* Fond rouge pour la suppression */}
      <div className="absolute inset-0 bg-rose-600 flex items-center justify-end px-8">
        <Trash2 className="text-white" size={24} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -window.innerWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -threshold) {
            onDelete();
          }
        }}
        className="relative glass-card p-5 flex flex-col gap-3"
        style={{ x: 0 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-white uppercase italic text-lg leading-tight">{ex.exercise_name}</h3>
            <p className="text-menthe font-black text-sm">
              {ex.load_g > 0 ? `${gramsToKg(ex.load_g)}kg` : "PDC"} <span className="text-white/40 mx-1">•</span> {ex.reps} reps
            </p>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onAddSet(); }}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:bg-menthe active:text-black transition-colors"
             >
               <Plus size={18} />
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}