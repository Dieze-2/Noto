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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const d1 = isoDate(days[0]), d2 = isoDate(days[6]);
      setMetrics(await getDailyMetricsRange(d1, d2));
      setEvents(await getEventsOverlappingRange(d1, d2));
    }
    load();
  }, [days]);

  return (
    <div 
      className="min-h-screen bg-black text-white p-6 pb-32"
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if(!touchStartX) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if(diff > 70) setAnchor(addDays(anchor, 7));
        if(diff < -70) setAnchor(subDays(anchor, 7));
        setTouchStartX(null);
      }}
    >
      <header className="flex items-center justify-between mb-10 pt-4">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-12 h-12 neo-glass flex items-center justify-center">←</button>
        <div className="text-center">
          <h1 className="title-xl">Semaine</h1>
          <p className="subtitle-xs">Swipe tactile activé</p>
        </div>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-12 h-12 neo-glass flex items-center justify-center">→</button>
      </header>

      <div className="space-y-3">
        {days.map(d => {
          const date = isoDate(d);
          const m = metrics.find(x => x.date === date);
          const dayEvents = events.filter(e => date >= e.start_date && date <= e.end_date);
          
          return (
            <div key={date} onClick={() => navigate(`/?date=${date}`)} className="neo-glass p-5 flex flex-col gap-3 active:scale-95 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 text-white/20'}`}>
                    <span className="text-[7px] uppercase leading-none mb-1">{format(d, 'EEE', { locale: fr })}</span>
                    <span className="text-lg leading-none">{format(d, 'd')}</span>
                  </div>
                  <div>
                    <p className="font-black text-white text-lg uppercase italic">{format(d, 'MMMM', { locale: fr })}</p>
                    <p className="text-[9px] font-black text-menthe/50 uppercase tracking-widest">{m?.steps ? `${m.steps.toLocaleString()} PAS` : ""}</p>
                  </div>
                </div>
                <p className="font-black text-2xl text-white italic">
                  {m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "--"}
                  <span className="text-[10px] ml-1">KG</span>
                </p>
              </div>
              {dayEvents.length > 0 && (
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {dayEvents.map(e => (
                    <span key={e.id} className="px-3 py-1 bg-menthe/10 border border-menthe/20 rounded-full text-[8px] font-black text-menthe uppercase">{e.title}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}