import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, addDays, format } from "date-fns";
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
      const s = rows.filter(m => m.steps).map(m => m.steps as number);
      return {
        avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null,
        avgS: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null
      };
    };
    const c = calc(metrics);
    const p = calc(prevMetrics);
    const v = (c.avgW && p.avgW) ? ((c.avgW - p.avgW) / p.avgW) * 100 : null;
    return { ...c, variation: v };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-6">
      <header>
        <span className="page-subtitle">Performances</span>
        <h1 className="page-title">Historique</h1>
        <div className="flex items-center gap-4 mt-6">
          <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-10 h-10 rounded-full glass-card flex items-center justify-center font-black">←</button>
          <span className="text-[10px] font-black text-menthe uppercase tracking-widest flex-1 text-center">Semaine du {format(days[0], 'd MMMM', { locale: fr })}</span>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-10 h-10 rounded-full glass-card flex items-center justify-center font-black">→</button>
        </div>
      </header>

      {/* Poids réduit & Variation augmentée */}
      <div className="p-6 rounded-[2.5rem] bg-black text-white border-b-2 border-menthe shadow-2xl flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Moyenne Poids</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">{stats.avgW ? formatKgFR(gramsToKg(stats.avgW), 1) : "—"}</span>
            <span className="text-sm font-bold opacity-30 uppercase">kg</span>
          </div>
        </div>
        {stats.variation !== null && (
          <div className={`text-right px-4 py-3 rounded-2xl ${stats.variation > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-menthe/10 text-menthe'}`}>
            <p className="text-[8px] font-black uppercase mb-1">Variation</p>
            <p className="text-2xl font-black">{stats.variation > 0 ? '↑' : '↓'} {Math.abs(stats.variation).toFixed(2)}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-[2rem]">
          <p className="text-[9px] font-black text-menthe uppercase mb-1">Moyenne Pas</p>
          <p className="text-xl font-black text-white">{stats.avgS ? `${stats.avgS.toLocaleString()} / j` : "—"}</p>
        </div>
        <div className="glass-card p-4 rounded-[2rem]">
           <p className="text-[9px] font-black text-menthe uppercase mb-1">Activité</p>
           <p className="text-xl font-black text-white">{metrics.filter(m => m.weight_g).length} Jours</p>
        </div>
      </div>

      <div className="space-y-3">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} onClick={() => navigate(`/?date=${isoDate(d)}`)} className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 opacity-20'}`}>
                  <span className="text-[8px] uppercase leading-none">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-base">{format(d, 'd')}</span>
                </div>
                <p className="font-black text-white text-sm capitalize">{format(d, 'MMMM', { locale: fr })}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "—"}</p>
                <p className="text-[9px] font-black text-menthe uppercase">{m?.steps ? `${m.steps.toLocaleString()} pas` : ""}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}