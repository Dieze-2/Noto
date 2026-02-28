import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchor] = useState(() => new Date());
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
      const k = rows.filter(m => m.kcal).map(m => m.kcal as number);
      return {
        avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null,
        avgS: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null,
        avgK: k.length ? Math.round(k.reduce((a, b) => a + b, 0) / k.length) : null
      };
    };
    const curr = calc(metrics);
    const last = calc(prevMetrics);
    const variation = (curr.avgW && last.avgW) ? ((curr.avgW - last.avgW) / last.avgW) * 100 : null;
    return { ...curr, variation };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-6">
      <header><span className="page-subtitle">Analyses</span><h1 className="page-title">Cette Semaine</h1></header>

      <div className="p-8 rounded-[3rem] bg-black border-b-4 border-menthe flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Poids Moyen</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-white">{stats.avgW ? (stats.avgW / 1000).toFixed(1).replace('.', ',') : "—"}</span>
            <span className="text-xl font-bold text-white/20">KG</span>
          </div>
        </div>
        {stats.variation !== null && (
          <div className={`text-right px-5 py-3 rounded-2xl ${stats.variation > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-menthe/10 text-menthe'}`}>
            <p className="text-[10px] font-black uppercase mb-1 tracking-tighter">Variation</p>
            <p className="text-2xl font-black">{stats.variation > 0 ? '↑' : '↓'} {Math.abs(stats.variation).toFixed(2)}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-[2.5rem] text-center shadow-lg">
           <p className="text-[10px] font-black text-menthe uppercase mb-2 tracking-widest">Moyenne Pas</p>
           <p className="text-2xl font-black text-white">{stats.avgS?.toLocaleString('fr-FR') || "—"}</p>
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] text-center shadow-lg">
           <p className="text-[10px] font-black text-menthe uppercase mb-2 tracking-widest">Moyenne Kcal</p>
           <p className="text-2xl font-black text-white">{stats.avgK?.toLocaleString('fr-FR') || "—"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} onClick={() => navigate(`/?date=${isoDate(d)}`)} className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'bg-white/5 opacity-20'}`}>
                  <span className="text-[8px] uppercase leading-none">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-base">{format(d, 'd')}</span>
                </div>
                <p className="font-black text-white text-sm capitalize">{format(d, 'MMMM', { locale: fr })}</p>
              </div>
              <p className="font-black text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}