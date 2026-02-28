import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, addDays, format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<DailyMetricsRow[]>([]);

  useEffect(() => {
    async function load() {
      const current = await getDailyMetricsRange(isoDate(days[0]), isoDate(days[6]));
      const prev = await getDailyMetricsRange(isoDate(subDays(days[0], 7)), isoDate(subDays(days[6], 7)));
      setMetrics(current);
      setPrevMetrics(prev);
    }
    load();
  }, [days]);

  const stats = useMemo(() => {
    const calc = (rows: DailyMetricsRow[]) => {
      const w = rows.filter(m => m.weight_g).map(m => m.weight_g as number);
      const k = rows.filter(m => m.kcal).map(m => m.kcal as number);
      return {
        avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null,
        avgK: k.length ? Math.round(k.reduce((a, b) => a + b, 0) / k.length) : null
      };
    };
    const c = calc(metrics);
    const p = calc(prevMetrics);
    const v = (c.avgW && p.avgW) ? ((c.avgW - p.avgW) / p.avgW) * 100 : null;
    return { ...c, variation: v };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter text-center uppercase italic">Historique</h1>
        <div className="flex items-center gap-4 mt-6">
          <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-black">←</button>
          <span className="text-xs font-black text-menthe uppercase tracking-[0.2em] flex-1 text-center">
            Semaine du {format(days[0], 'd MMMM', { locale: fr })}
          </span>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-black">→</button>
        </div>
      </header>

      <div className="p-8 rounded-[3rem] bg-black text-white shadow-2xl relative border-b-4 border-menthe">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2 italic">Moyenne Hebdomadaire</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black">{stats.avgW ? formatKgFR(gramsToKg(stats.avgW), 1) : "—"}</span>
              <span className="text-2xl font-bold opacity-30">KG</span>
            </div>
          </div>
          {stats.variation !== null && (
            <div className={`px-4 py-2 rounded-2xl font-black text-[10px] ${stats.variation > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-menthe/20 text-menthe'}`}>
              {stats.variation > 0 ? '▲' : '▼'} {Math.abs(stats.variation).toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-[2rem]">
          <p className="text-[9px] font-black text-menthe uppercase tracking-widest mb-1">Énergie / Jour</p>
          <p className="text-2xl font-black text-white">{stats.avgK ? `${stats.avgK} kcal` : "—"}</p>
        </div>
        <div className="glass-card p-6 rounded-[2rem]">
           <p className="text-[9px] font-black text-menthe uppercase tracking-widest mb-1">Statut</p>
           <p className="text-2xl font-black text-white">{metrics.filter(m => m.weight_g).length} / 7 Jours</p>
        </div>
      </div>

      <div className="space-y-4">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} 
              onClick={() => navigate(`/?date=${isoDate(d)}`)}
              className="glass-card p-5 rounded-3xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black shadow-[0_0_15px_rgba(0,255,163,0.2)]' : 'bg-white/5 opacity-20'}`}>
                  <span className="text-[9px] uppercase">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-lg">{format(d, 'd')}</span>
                </div>
                <div>
                   <p className="font-black text-white text-base capitalize">{format(d, 'MMMM', { locale: fr })}</p>
                   <p className="text-[10px] font-bold text-white/40 uppercase">{m?.kcal ? `${m.kcal} kcal` : "Aucune donnée"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
                <p className="text-[10px] font-black text-menthe uppercase">{m?.steps ? `${m.steps.toLocaleString()} pas` : ""}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}