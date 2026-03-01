import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { getEventsOverlappingRange } from "../db/events";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const d1 = isoDate(days[0]), d2 = isoDate(days[6]);
      setMetrics(await getDailyMetricsRange(d1, d2));
      setEvents(await getEventsOverlappingRange(d1, d2));
    }
    load();
  }, [days]);

  const stats = useMemo(() => {
    const w = metrics.filter(m => m.weight_g).map(m => m.weight_g as number);
    return { avgW: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null };
  }, [metrics]);

  return (
    <div 
      className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-6"
      onTouchStart={e => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (!touchStart) return;
        const diff = e.changedTouches[0].clientX - touchStart;
        if (diff > 50) setAnchor(subDays(anchor, 7));
        if (diff < -50) setAnchor(addDays(anchor, 7));
      }}
    >
      <header className="text-center"><h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Tendances</h1></header>

      <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl text-white font-black uppercase italic tracking-tighter">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="p-3">←</button>
        <div>{format(days[0], 'd MMM', { locale: fr })} — {format(days[6], 'd MMM yyyy', { locale: fr })}</div>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="p-3">→</button>
      </div>
      
      <div className="p-5 rounded-[2.5rem] glass-card flex items-center justify-between border-b-2 border-menthe/20">
        <div>
          <p className="text-[10px] font-black uppercase text-white/30 italic">Poids Moyen</p>
          <span className="text-4xl font-black text-white">{stats.avgW ? (stats.avgW / 1000).toFixed(1).replace('.', ',') : "—"}</span>
        </div>
      </div>

      <div className="space-y-3">
        {days.map(d => {
          const date = isoDate(d);
          const m = metrics.find(x => x.date === date);
          const dayEvents = events.filter(e => date >= e.start_date && date <= e.end_date);
          return (
            <div key={date} onClick={() => navigate(`/?date=${date}`)} className="glass-card p-4 rounded-2xl flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 opacity-20'}`}>{format(d, 'd')}</div>
                  <p className="font-black text-white text-sm capitalize">{format(d, 'EEEE', { locale: fr })}</p>
                </div>
                <p className="font-black text-white">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
              </div>
              {dayEvents.map(e => (
                <div key={e.id} className="text-[10px] font-bold text-menthe/60 italic px-2 animate-in fade-in duration-700">◆ {e.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}