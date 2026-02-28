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
      const k = rows.filter(m => m.kcal).map(m => m.kcal as number);
      return {
        avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null,
        avgS: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null,
        avgK: k.length ? Math.round(k.reduce((a, b) => a + b, 0) / k.length) : null
      };
    };
    const cur = calc(metrics);
    const old = calc(prevMetrics);
    const diff = (cur.avgW && old.avgW) ? ((cur.avgW - old.avgW) / old.avgW) * 100 : null;
    return { ...cur, variation: diff };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-6">
      <header>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Tendances</h1>
      </header>

      {/* Sélecteur type HomePage */}
      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="p-3 text-white">←</button>
        <div className="text-center font-black text-white">
          <p className="text-[10px] uppercase text-menthe tracking-widest">Semaine du</p>
          <p>{format(days[0], 'd MMM', { locale: fr })} au {format(days[6], 'd MMM yyyy', { locale: fr })}</p>
        </div>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="p-3 text-white">→</button>
      </div>
      
      <div className="glass-card p-5 rounded-[2rem] flex items-center justify-between border-b-2 border-white/5">
        <div>
          <p className="text-[10px] font-black uppercase text-white/30 italic tracking-widest">Poids Moyen</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.avgW ? (stats.avgW / 1000).toFixed(1).replace('.', ',') : "—"}</span>
            <span className="text-sm font-bold text-white/20 uppercase">kg</span>
          </div>
        </div>
        {stats.variation !== null && (
          <div className={`px-4 py-2 rounded-xl font-black text-xs ${stats.variation > 0 ? 'text-rose-400' : 'text-menthe'}`}>
            {stats.variation > 0 ? '↑' : '↓'} {Math.abs(stats.variation).toFixed(2)}%
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2rem] text-center">
           <p className="text-[10px] font-black text-menthe uppercase mb-1">Moyenne pas/jour</p>
           <p className="text-xl font-black text-white">{stats.avgS ? stats.avgS.toLocaleString() : "—"}</p>
        </div>
        <div className="glass-card p-5 rounded-[2rem] text-center">
           <p className="text-[10px] font-black text-menthe uppercase mb-1">Moyenne kcal/jour</p>
           <p className="text-xl font-black text-white">{stats.avgK ? stats.avgK.toLocaleString() : "—"}</p>
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
                <p className="text-[10px] font-black text-menthe uppercase">{m?.steps ? `${m.steps.toLocaleString()} pas` : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}