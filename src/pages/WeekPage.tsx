import { useEffect, useMemo, useState } from "react";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";
import { getEventsOverlappingRange } from "../db/events";

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getDailyMetricsRange(isoDate(days[0]), isoDate(days[6]));
      setMetrics(data);
      setLoading(false);
    }
    load();
  }, [days]);

  // --- POINT 3 : LOGIQUE DE CALCUL DES MOYENNES ---
  const stats = useMemo(() => {
    const weights = metrics.filter(m => m.weight_g).map(m => m.weight_g as number);
    const steps = metrics.filter(m => m.steps).map(m => m.steps as number);
    
    const avgWeightG = weights.length 
      ? weights.reduce((a, b) => a + b, 0) / weights.length 
      : null;
      
    const avgSteps = steps.length 
      ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) 
      : null;

    return { avgWeightG, avgSteps };
  }, [metrics]);

  if (loading) return <div className="p-10 text-center text-mineral-700 animate-pulse font-black uppercase text-xs tracking-widest">Analyse bio-métrique...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="flex flex-col gap-1 px-2">
        <h1 className="text-3xl font-black text-mineral-900 dark:text-white">Performances</h1>
        <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => setAnchor(subDays(anchor, 7))} 
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-mineral-700 hover:bg-sauge-200 transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-black text-sauge-500 uppercase tracking-widest">
                Semaine du {format(days[0], 'd MMMM', { locale: fr })}
            </span>
            <button 
              onClick={() => setAnchor(addDays(anchor, 7))} 
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-mineral-700 hover:bg-sauge-200 transition-colors"
            >
              →
            </button>
        </div>
      </header>

      {/* Highlights Bento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-mineral-800 to-mineral-900 text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Moyenne Poids Hebdo</p>
            <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-black">
                  {stats.avgWeightG ? formatKgFR(gramsToKg(stats.avgWeightG), 1) : "—"}
                </span>
                <span className="text-xl font-bold opacity-50 mb-2">kg</span>
            </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem]">
            <p className="text-[10px] font-black text-mineral-700/50 uppercase tracking-widest mb-2">Pas / Jour</p>
            <p className="text-2xl font-black text-mineral-900 dark:text-sauge-100">
              {stats.avgSteps?.toLocaleString('fr-FR') ?? "—"}
            </p>
        </div>

        <div className="glass-card p-6 rounded-[2rem]">
            <p className="text-[10px] font-black text-mineral-700/50 uppercase tracking-widest mb-2">Jours Actifs</p>
            <p className="text-2xl font-black text-sauge-500">
              {metrics.length} / 7
            </p>
        </div>
      </div>

      {/* Timeline Journalière */}
      <div className="space-y-3">
        <h3 className="px-2 text-[10px] font-black text-mineral-700/40 uppercase tracking-[0.2em]">Détails de la période</h3>
        {days.map(d => {
            const m = metrics.find(x => x.date === isoDate(d));
            return (
                <div key={d.toString()} className="glass-card flex items-center justify-between p-5 rounded-3xl transition-all hover:translate-x-1">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-sauge-500 text-white shadow-lg shadow-sauge-500/20' : 'bg-sauge-100 dark:bg-mineral-800 text-mineral-700/30'}`}>
                            <span className="text-[8px] uppercase">{format(d, 'EEE', { locale: fr })}</span>
                            <span className="text-sm">{format(d, 'd')}</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-mineral-900 dark:text-white">{format(d, 'MMMM', { locale: fr })}</p>
                            <p className="text-[10px] font-medium text-mineral-700/50 italic truncate max-w-[150px]">
                              {m?.note || "Pas de note"}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-mineral-900 dark:text-sauge-100">
                          {m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}
                        </p>
                        <p className="text-[10px] font-bold text-sauge-500">
                          {m?.steps ? `${m.steps.toLocaleString()} pas` : ""}
                        </p>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
}