import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import StatBubble from "../components/StatBubble";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { motion } from "framer-motion";
import { getEventsOverlappingRange, EventRow } from "../db/events";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentWeekData, setCurrentWeekData] = useState<DailyMetricsRow[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DailyMetricsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  useEffect(() => {
    async function load() {
      const startStr = format(days[0], "yyyy-MM-dd");
      const endStr = format(days[6], "yyyy-MM-dd");
      
      const [cur, prev, evs] = await Promise.all([
        getDailyMetricsRange(startStr, endStr),
        getDailyMetricsRange(format(subDays(start, 7), "yyyy-MM-dd"), format(subDays(start, 1), "yyyy-MM-dd")),
        getEventsOverlappingRange(startStr, endStr)
      ]);
      
      setCurrentWeekData(cur);
      setPrevWeekData(prev);
      setEvents(evs);
    }
    load();
  }, [anchorDate]);

  const stats = useMemo(() => {
    const getAvgWeight = (data: DailyMetricsRow[]) => {
      const w = data.filter(m => (m.weight_g || 0) > 0);
      return w.length ? (w.reduce((acc, m) => acc + (m.weight_g || 0), 0) / w.length / 1000) : 0;
    };
    const curW = getAvgWeight(currentWeekData);
    const prevW = getAvgWeight(prevWeekData);
    const variation = prevW === 0 ? 0 : ((curW - prevW) / prevW) * 100;
    return { curW, variation };
  }, [currentWeekData, prevWeekData]);

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
        <header className="flex flex-col items-center mb-10">
          <motion.div 
            drag="x" dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => { if (info.offset.x > 50) setAnchorDate(subDays(anchorDate, 7)); if (info.offset.x < -50) setAnchorDate(addDays(anchorDate, 7)); }}
            className="flex items-center justify-between w-full bg-white/5 py-4 rounded-3xl border border-white/5 cursor-grab active:cursor-grabbing"
          >
            <button onClick={() => setAnchorDate(subDays(anchorDate, 7))} className="p-2 text-white/20"><ChevronLeft size={32}/></button>
            <div className="text-center">
              <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Semaine</h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">du {format(start, "d MMMM", { locale: fr })}</p>
            </div>
            <button onClick={() => setAnchorDate(addDays(anchorDate, 7))} className="p-2 text-white/20"><ChevronRight size={32}/></button>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 mb-10 px-10">
          <GlassCard className="flex flex-col items-center p-6 text-center border-menthe/20 bg-menthe/5">
            <Weight size={24} className="text-purple-500 mb-2" />
            <p className="text-3xl font-black text-white">{stats.curW.toFixed(1)} <span className="text-sm text-white/40">kg</span></p>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mt-1">Moyenne Poids</p>
            <p className={`text-xs font-black mt-2 ${stats.variation >= 0 ? 'text-rose-500' : 'text-menthe'}`}>
              {stats.variation > 0 ? '+' : ''}{stats.variation.toFixed(1)}% vs S-1
            </p>
          </GlassCard>
        </div>

        <div className="space-y-3">
          {days.map((day) => {
            const dStr = format(day, "yyyy-MM-dd");
            const m = currentWeekData.find(x => x.date === dStr);
            
            // LOGIQUE CORRIGÉE : On vérifie si dStr est entre start_date et end_date de l'événement
            const event = events.find(e => dStr >= e.start_date && dStr <= e.end_date);
            
            const isT = isToday(day);

            return (
              <GlassCard 
                key={dStr} 
                onClick={() => navigate(`/?date=${dStr}`)}
                className={`flex items-center justify-between p-4 cursor-pointer transition-all border-l-4 ${
                  isT ? 'bg-menthe/5 border-menthe' : 
                  event ? 'bg-orange-500/10 border-orange-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    isT ? 'bg-menthe text-black' : 
                    event ? 'bg-orange-500 text-black' : 'bg-white/5 text-white/40'
                  }`}>
                    <span className="text-[9px] uppercase leading-none">{format(day, "EEE", { locale: fr })}</span>
                    <span className="text-lg leading-none">{format(day, "d")}</span>
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm text-white">
                      {format(day, "EEEE", { locale: fr })}
                      {event && <Sparkles size={12} className="inline ml-2 text-orange-500" />}
                    </p>
                    {event ? (
                       <p className="text-[10px] font-bold text-orange-500/60 uppercase italic">{event.title || "Événement"}</p>
                    ) : (
                      <div className="flex gap-4 mt-1">
                        <Footprints size={14} className={m?.steps ? 'text-menthe' : 'text-white/10'} />
                        <Flame size={14} className={m?.kcal ? 'text-yellow-200' : 'text-white/10'} />
                        <Weight size={14} className={m?.weight_g ? 'text-purple-500' : 'text-white/10'} />
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/20" />
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}