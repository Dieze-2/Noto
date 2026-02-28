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
  const [visibleNote, setVisibleNote] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <header>
          <span className="page-subtitle">Tendances</span>
          <h1 className="page-title italic">Cette semaine</h1>
        </header>
        <div className="flex gap-2">
          <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">←</button>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">→</button>
        </div>
      </div>
      
      {/* Card Poids (Hauteur réduite et fond glass-card) */}
      <div className="p-6 rounded-[2.5rem] glass-card flex items-center justify-between border-b-2 border-menthe/30">
        <div>
          <p className="text-[9px] font-black uppercase text-white/30 italic">Poids Moyen</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">{stats.avgW ? (stats.avgW / 1000).toFixed(1).replace('.', ',') : "—"}</span>
            <span className="text-xs font-bold text-white/20 uppercase">kg</span>
          </div>
        </div>
        {stats.variation !== null && (
          <div className={`text-right px-4 py-2 rounded-2xl ${stats.variation > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-menthe/10 text-menthe'}`}>
            <p className="text-[10px] font-black">{stats.variation > 0 ? '↑' : '↓'} {Math.abs(stats.variation).toFixed(2)}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[2rem] text-center">
           <p className="text-[9px] font-black text-menthe uppercase mb-1">Moyenne pas/jour</p>
           <p className="text-lg font-black text-white">{stats.avgS ? stats.avgS.toLocaleString() : "—"}</p>
        </div>
        <div className="glass-card p-5 rounded-[2rem] text-center">
           <p className="text-[9px] font-black text-menthe uppercase mb-1">Moyenne kcal/jour</p>
           <p className="text-lg font-black text-white">{stats.avgK ? stats.avgK.toLocaleString() : "—"}</p>
        </div>
      </div>

      <div className="space-y-3">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <div key={d.toString()} className="space-y-1">
              <div onClick={() => navigate(`/?date=${isoDate(d)}`)} className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 opacity-20'}`}>
                    <span className="text-[12px]">{format(d, 'd')}</span>
                  </div>
                  <p className="font-black text-white text-xs uppercase">{format(d, 'EEEE', { locale: fr })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-black text-white text-sm">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "—"}</p>
                  </div>
                  {m?.note && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setVisibleNote(visibleNote === m.id ? null : m.id); }}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black text-menthe uppercase"
                    >Note</button>
                  )}
                </div>
              </div>
              {/* Note glissante */}
              {visibleNote === m?.id && (
                <div className="bg-white/5 mx-4 p-4 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                  <p className="text-[11px] text-white/60 italic font-medium">"{m.note}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}