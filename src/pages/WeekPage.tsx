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

  // RESTAURATION DES MOYENNES (KPI)
  const stats = useMemo(() => {
    const w = metrics.filter(m => m.weight_g).map(m => m.weight_g as number);
    const s = metrics.filter(m => m.steps).map(m => m.steps as number);
    const k = metrics.filter(m => m.kcal).map(m => m.kcal as number);
    return {
      avgWeight: w.length ? w.reduce((a,b)=>a+b,0)/w.length : 0,
      avgSteps: s.length ? Math.round(s.reduce((a,b)=>a+b,0)/s.length) : 0,
      avgKcal: k.length ? Math.round(k.reduce((a,b)=>a+b,0)/k.length) : 0
    };
  }, [metrics]);

  return (
    <div 
      className="min-h-screen bg-black text-white p-4 pb-32"
      onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if(!touchStartX) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if(diff > 80) setAnchor(addDays(anchor, 7));
        if(diff < -80) setAnchor(subDays(anchor, 7));
        setTouchStartX(null);
      }}
    >
      <header className="flex items-center justify-between mb-8 pt-4">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-10 h-10 neo-glass flex items-center justify-center font-black">←</button>
        <div className="text-center">
          <h1 className="title-xl">Semaine</h1>
          <p className="subtitle-xs">Stats Hebdo</p>
        </div>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-10 h-10 neo-glass flex items-center justify-center font-black">→</button>
      </header>

      {/* KPI MOYENNES RESTAURÉES */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="neo-glass p-4 text-center border-b-2 border-white/5">
          <p className="text-[7px] font-black uppercase text-white/30 mb-1">Moy. Poids</p>
          <p className="font-black italic text-sm">{stats.avgWeight ? formatKgFR(gramsToKg(stats.avgWeight), 1) : "--"}</p>
        </div>
        <div className="neo-glass p-4 text-center border-b-2 border-menthe/40">
          <p className="text-[7px] font-black uppercase text-menthe/50 mb-1">Moy. Pas</p>
          <p className="font-black italic text-sm text-menthe">{stats.avgSteps.toLocaleString()}</p>
        </div>
        <div className="neo-glass p-4 text-center border-b-2 border-white/5">
          <p className="text-[7px] font-black uppercase text-white/30 mb-1">Moy. Kcal</p>
          <p className="font-black italic text-sm">{stats.avgKcal || "--"}</p>
        </div>
      </div>

      <div className="space-y-4">
        {days.map(d => {
          const date = isoDate(d);
          const m = metrics.find(x => x.date === date);
          const dayEvents = events.filter(e => date >= e.start_date && date <= e.end_date);
          
          return (
            <div key={date} onClick={() => navigate(`/?date=${date}`)} className="neo-glass p-4 flex items-center justify-between active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-menthe text-black' : 'bg-white/5 text-white/20'}`}>
                  <span className="text-[7px] uppercase leading-none">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-lg leading-none">{format(d, 'd')}</span>
                </div>
                <div>
                  <p className="font-black text-white text-sm uppercase italic">{format(d, 'MMMM', { locale: fr })}</p>
                  {/* PAS EN ÉVIDENCE */}
                  {m?.steps && (
                    <p className="text-xs font-black text-menthe uppercase tracking-widest mt-1">
                      {m.steps.toLocaleString()} PAS
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-white italic">
                  {m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "--"}
                  <span className="text-[8px] ml-1">KG</span>
                </p>
                {dayEvents.length > 0 && <span className="inline-block w-2 h-2 rounded-full bg-menthe mt-1 animate-pulse" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}