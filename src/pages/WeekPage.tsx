import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import Layout from "../components/Layout";
import GlassCard from "../components/GlassCard";
import StatBubble from "../components/StatBubble";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { gramsToKg, formatKgFR } from "../lib/numberFR";
import { Footprints, Flame, Weight } from "lucide-react";

export default function WeekPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any[]>([]);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    getDailyMetricsRange(format(days[0], 'yyyy-MM-dd'), format(days[6], 'yyyy-MM-dd'))
      .then(setMetrics);
  }, []);

  // Calcul des moyennes
  const stats = useMemo(() => {
    const valid = metrics.filter(m => m.weight_g || m.steps);
    if (valid.length === 0) return { weight: 0, steps: 0, kcal: 0 };
    return {
      weight: valid.reduce((acc, m) => acc + (m.weight_g || 0), 0) / (valid.filter(m => m.weight_g).length || 1),
      steps: Math.round(valid.reduce((acc, m) => acc + (m.steps || 0), 0) / valid.length),
      kcal: Math.round(valid.reduce((acc, m) => acc + (m.kcal || 0), 0) / valid.length),
    };
  }, [metrics]);

  return (
    <Layout title="Semaine" subtitle="Moyennes & Historique">
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatBubble icon={Footprints} label="Moy. Pas" value={stats.steps.toLocaleString('fr-FR')} />
        <StatBubble icon={Flame} label="Moy. Kcal" value={stats.kcal} />
        <StatBubble icon={Weight} label="Moy. Poids" value={stats.weight ? formatKgFR(gramsToKg(stats.weight), 1) : "—"} unit="kg" />
      </div>

      <div className="space-y-3">
        {days.map(day => {
          const dStr = format(day, 'yyyy-MM-dd');
          const m = metrics.find(x => x.date === dStr);
          return (
            <GlassCard 
              key={dStr} 
              onClick={() => navigate(`/?date=${dStr}`)}
              className={`flex items-center gap-4 p-4 active:scale-95 transition-transform ${isToday(day) ? 'border-menthe/30' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center ${isToday(day) ? 'bg-menthe text-black' : 'bg-white/5 text-white/40'}`}>
                <span className="text-[10px] font-black uppercase">{format(day, 'EEE', { locale: fr })}</span>
                <span className="text-lg font-black">{format(day, 'd')}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm capitalize text-white">{format(day, 'EEEE', { locale: fr })}</p>
                <p className="text-[10px] font-black text-menthe uppercase">
                  {m?.steps ? `${m.steps} pas` : "Repos"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-white text-sm">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Layout>
  );
}