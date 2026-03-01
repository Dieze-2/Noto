import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Footprints, Flame, Weight, TrendingUp } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import StatBubble from "../components/StatBubble";
import { getDailyMetricsRange } from "../db/dailyMetrics";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [metrics, setMetrics] = useState<any[]>([]);

  const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  useEffect(() => {
    async function load() {
      const data = await getDailyMetricsRange(format(days[0], "yyyy-MM-dd"), format(days[6], "yyyy-MM-dd"));
      setMetrics(data || []);
    }
    load();
  }, [anchorDate]);

  // Calcul des moyennes
  const averages = useMemo(() => {
    const validMetrics = metrics.filter(m => m.steps || m.kcal || m.weight_g);
    if (validMetrics.length === 0) return { steps: 0, kcal: 0, weight: 0 };
    
    return {
      steps: Math.round(validMetrics.reduce((acc, m) => acc + (m.steps || 0), 0) / validMetrics.length),
      kcal: Math.round(validMetrics.reduce((acc, m) => acc + (m.kcal || 0), 0) / validMetrics.length),
      weight: (validMetrics.reduce((acc, m) => acc + (m.weight_g || 0), 0) / validMetrics.length / 1000).toFixed(1)
    };
  }, [metrics]);

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-10 pb-20">
        <header className="flex items-end justify-between mb-8 px-2">
          <div>
            <h1 className="title-xl">Semaine</h1>
            <p className="subtitle-xs text-menthe">du {format(start, "d MMMM", { locale: fr })}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAnchorDate(subDays(anchorDate, 7))} className="p-3 bg-white/5 rounded-2xl"><ChevronLeft size={20}/></button>
            <button onClick={() => setAnchorDate(addDays(anchorDate, 7))} className="p-3 bg-white/5 rounded-2xl"><ChevronRight size={20}/></button>
          </div>
        </header>

        {/* Section Moyennes */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatBubble icon={TrendingUp} label="Moy. Pas" value={averages.steps} accent />
          <StatBubble icon={TrendingUp} label="Moy. Kcal" value={averages.kcal} colorClass="text-yellow-400" />
          <StatBubble icon={TrendingUp} label="Moy. Poids" value={averages.weight} colorClass="text-purple-500" />
        </div>

        <div className="space-y-3">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const active = isToday(day);
            const m = metrics.find(item => item.date === dateStr);

            return (
              <GlassCard 
                key={dateStr} 
                onClick={() => navigate(`/?date=${dateStr}`)} // Correction : redirige vers l'accueil avec la date
                className={`flex items-center justify-between p-4 cursor-pointer transition-all ${active ? 'border-menthe/40 bg-menthe/5' : 'border-white/5'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${active ? 'bg-menthe text-black' : 'bg-zinc-900 text-white/40'}`}>
                    <span className="text-[9px] uppercase">{format(day, "EEE", { locale: fr })}</span>
                    <span className="text-lg">{format(day, "d")}</span>
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm">{format(day, "EEEE", { locale: fr })}</p>
                    <div className="flex gap-3 mt-1.5 opacity-50">
                      <Footprints size={14} className={m?.steps ? "text-menthe" : "text-white/10"} />
                      <Flame size={14} className={m?.kcal ? "text-yellow-400" : "text-white/10"} />
                      <Weight size={14} className={m?.weight_g ? "text-purple-500" : "text-white/10"} />
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/10" />
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}