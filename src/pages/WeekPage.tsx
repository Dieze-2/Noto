import { useEffect, useMemo, useState } from "react";
import { subDays, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<DailyMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const current = await getDailyMetricsRange(isoDate(days[0]), isoDate(days[6]));
      const prev = await getDailyMetricsRange(isoDate(subDays(days[0], 7)), isoDate(subDays(days[6], 7)));
      setMetrics(current);
      setPrevMetrics(prev);
      setLoading(false);
    }
    load();
  }, [days]);

  const stats = useMemo(() => {
    const calc = (rows: DailyMetricsRow[]) => {
      const w = rows.filter(m => m.weight_g).map(m => m.weight_g as number);
      return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
    };
    const currentAvg = calc(metrics);
    const prevAvg = calc(prevMetrics);
    const variation = (currentAvg && prevAvg) ? ((currentAvg - prevAvg) / prevAvg) * 100 : null;
    return { currentAvg, variation };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <h1 className="text-4xl font-black text-mineral-950 dark:text-white tracking-tighter">Performances</h1>
        <div className="flex items-center gap-4 mt-6">
          <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-black">←</button>
          <span className="text-xs font-black text-sauge-600 dark:text-menthe-flash uppercase tracking-[0.2em] flex-1 text-center">
            Semaine du {format(days[0], 'd MMMM', { locale: fr })}
          </span>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-black">→</button>
        </div>
      </header>

      {/* Hero Card Poids avec Badge Variation */}
      <div className="p-8 rounded-[3rem] bg-mineral-900 dark:bg-mineral-950 text-white shadow-2xl relative border-b-4 border-sauge-600 dark:border-menthe-flash">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Moyenne Hebdomadaire</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black">{stats.currentAvg ? formatKgFR(gramsToKg(stats.currentAvg), 1) : "—"}</span>
              <span className="text-2xl font-bold opacity-30">KG</span>
            </div>
          </div>
          {stats.variation !== null && (
            <div className={`px-4 py-2 rounded-2xl font-black text-xs ${stats.variation > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-menthe-flash/20 text-menthe-flash'}`}>
              {stats.variation > 0 ? '▲' : '▼'} {Math.abs(stats.variation).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Timeline avec texte très foncé en mode clair */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-mineral-900/40 dark:text-white/30 uppercase tracking-[0.3em] px-2">Détails Journaliers</h3>
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} className="glass-card p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-mineral-900 dark:bg-menthe-flash text-white dark:text-mineral-950' : 'bg-sauge-100 dark:bg-mineral-900 opacity-30'}`}>
                  <span className="text-[9px] uppercase">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-lg">{format(d, 'd')}</span>
                </div>
                <p className="font-black text-mineral-950 dark:text-white text-base capitalize">{format(d, 'MMMM', { locale: fr })}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-mineral-950 dark:text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
                <p className="text-[10px] font-black text-sauge-600 dark:text-menthe-flash uppercase tracking-widest">{m?.steps ? `${m.steps.toLocaleString()} pas` : ""}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}