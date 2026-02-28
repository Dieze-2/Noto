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
      <header className="text-center">
        <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Tendances</h1>
      </header>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5 text-white">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="p-3">←</button>
        <div className="text-center font-black uppercase italic tracking-tighter">
          {format(days[0], 'd MMM', { locale: fr }).toUpperCase()} — {format(days[6], 'd MMM yyyy', { locale: fr }).toUpperCase()}
        </div>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="p-3">→</button>
      </div>
      
      <div className="p-6 rounded-[2.5rem] glass-card flex items-center justify-between border-b-2 border-menthe/30">
        <div>
          <p className="text-[10px] font-black uppercase text-white/30 italic">Poids Moyen</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{stats.avgW ? (stats.avgW / 1000).toFixed(1).replace('.', ',') : \"—\"}</span>
            <span className="text-sm font-bold text-white/20 uppercase tracking-tighter">kg</span>
          </div>
        </div>
        {stats.variation !== null && (
          <div className={`px-4 py-2 rounded-2xl ${stats.variation > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-menthe/10 text-menthe'}`}>
            <p className="text-xl font-black">{stats.variation > 0 ? '↑' : '↓'} {Math.abs(stats.variation).toFixed(2)}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[{t: 'Moyenne pas/jour', v: stats.avgS}, {t: 'Moyenne kcal/jour', v: stats.avgK}].map(s => (
          <div key={s.t} className="glass-card p-5 rounded-[2rem] text-center">
             <p className="text-[9px] font-black text-menthe uppercase mb-1 tracking-widest">{s.t}</p>
             <p className="text-lg font-black text-white">{s.v ? s.v.toLocaleString() : \"—\"}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} onClick={() => navigate(`/?date=${isoDate(d)}`)} className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 opacity-20'}`}>
                  <span className="text-[8px] uppercase leading-none">{format(d, 'EEE', { locale: fr }).toUpperCase()}</span>
                  <span className="text-base">{format(d, 'd')}</span>
                </div>
                <div>
                  <p className="font-black text-white text-sm capitalize">{format(d, 'MMMM', { locale: fr })}</p>
                  <p className="text-[10px] font-black text-menthe uppercase tracking-widest">{m?.steps ? `${m.steps.toLocaleString()} pas` : \"\"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : \"—\"}</p>
                <p className="text-[9px] font-bold text-white/20 uppercase italic">{m?.kcal ? `${m.kcal} kcal` : \"\"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}