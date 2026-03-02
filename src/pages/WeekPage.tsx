import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { motion } from "framer-motion";
import { getEventsOverlappingRange, EventRow } from "../db/events";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentWeekData, setCurrentWeekData] = useState<DailyMetricsRow[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DailyMetricsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  const start = useMemo(() => startOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  const startStr = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const endStr = useMemo(() => format(days[6], "yyyy-MM-dd"), [days]);

  useEffect(() => {
    let alive = true;

    async function load() {
      const [cur, prev, evs] = await Promise.all([
        getDailyMetricsRange(startStr, endStr),
        getDailyMetricsRange(format(subDays(start, 7), "yyyy-MM-dd"), format(subDays(start, 1), "yyyy-MM-dd")),
        getEventsOverlappingRange(startStr, endStr),
      ]);

      if (!alive) return;
      setCurrentWeekData(cur);
      setPrevWeekData(prev);
      setEvents(evs);
    }

    load().catch(() => {});
    return () => {
      alive = false;
    };
  }, [startStr, endStr, start]);

  const stats = useMemo(() => {
    const getAvg = (data: DailyMetricsRow[], field: "steps" | "kcal" | "weight_g") => {
      const vals = data.map((d) => d[field] || 0).filter((v) => v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const curW = getAvg(currentWeekData, "weight_g") / 1000;
    const prevW = getAvg(prevWeekData, "weight_g") / 1000;

    return {
      weight: curW,
      steps: Math.round(getAvg(currentWeekData, "steps")),
      kcal: Math.round(getAvg(currentWeekData, "kcal")),
      variation: prevW ? ((curW - prevW) / prevW) * 100 : 0,
    };
  }, [currentWeekData, prevWeekData]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex flex-col items-center mb-10">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) setAnchorDate(subDays(anchorDate, 7));
            if (info.offset.x < -50) setAnchorDate(addDays(anchorDate, 7));
          }}
          className="flex items-center justify-between w-full bg-white/5 py-4 rounded-3xl border border-white/5"
        >
          <button onClick={() => setAnchorDate(subDays(anchorDate, 7))} className="p-2 text-white/20">
            <ChevronLeft size={32} />
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Semaine</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              du {format(start, "d MMMM", { locale: fr })}
            </p>
          </div>
          <button onClick={() => setAnchorDate(addDays(anchorDate, 7))} className="p-2 text-white/20">
            <ChevronRight size={32} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <GlassCard className="p-6 text-center border-menthe/10 relative overflow-hidden">
          <Weight size={20} className="text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.weight ? stats.weight.toFixed(1) : "--"}kg</p>
          <div
            className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              stats.variation > 0 ? "bg-rose-500/10 text-rose-500" : "bg-menthe/10 text-menthe"
            }`}
          >
            {stats.variation > 0 ? "+" : ""}
            {stats.variation.toFixed(1)}%
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-white/5">
          <div className="flex justify-around items-center h-full">
            <div>
              <Footprints size={18} className="text-menthe mx-auto mb-1" />
              <p className="text-sm font-black text-white">{stats.steps || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div>
              <Flame size={18} className="text-yellow-200 mx-auto mb-1" />
              <p className="text-sm font-black text-white">{stats.kcal || 0}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const dStr = format(day, "yyyy-MM-dd");
          const m = currentWeekData.find((x) => x.date === dStr);
          const event = events.find((e) => dStr >= e.start_date && dStr <= e.end_date);
          const isT = isToday(day);

          return (
            <GlassCard
              key={dStr}
              onClick={() => navigate(`/today?date=${dStr}`)}
              className={`flex items-center justify-between p-4 border-l-4 transition-all ${
                isT ? "border-menthe bg-menthe/5" : event ? "border-orange-500 bg-orange-500/5" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    isT ? "bg-menthe text-black" : event ? "bg-orange-500 text-black" : "bg-white/5 text-white/40"
                  }`}
                >
                  <span className="text-[9px] uppercase leading-none">{format(day, "EEE", { locale: fr })}</span>
                  <span className="text-lg leading-none">{format(day, "d")}</span>
                </div>

                <div className="flex-1">
                  <p className="font-black uppercase italic text-sm text-white flex items-center">
                    {format(day, "EEEE", { locale: fr })}
                    {event && <Sparkles size={12} className="ml-2 text-orange-500" />}
                  </p>

                  <div className="mt-1">
                    {event && <p className="text-[10px] font-bold text-orange-500 uppercase italic mb-1">{event.title}</p>}

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Footprints size={12} className={m?.steps ? "text-menthe" : "text-white/10"} />
                        <span className="text-white/40">{m?.steps || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Flame size={12} className={m?.kcal ? "text-yellow-200" : "text-white/10"} />
                        <span className="text-white/40">{m?.kcal || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Weight size={12} className={m?.weight_g ? "text-purple-500" : "text-white/10"} />
                        <span className="text-white/40">{m?.weight_g ? (m.weight_g / 1000).toFixed(1) : "--"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ChevronRight size={16} className="text-white/20" />
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
