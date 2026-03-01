import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Footprints, Flame, Weight, ChevronLeft, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import StatBubble from "../components/StatBubble";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentWeekData, setCurrentWeekData] = useState<DailyMetricsRow[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DailyMetricsRow[]>([]);

  const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  useEffect(() => {
    async function load() {
      const curStart = format(start, "yyyy-MM-dd");
      const curEnd = format(addDays(start, 6), "yyyy-MM-dd");
      const prevStart = format(subDays(start, 7), "yyyy-MM-dd");
      const prevEnd = format(subDays(start, 1), "yyyy-MM-dd");

      const [cur, prev] = await Promise.all([
        getDailyMetricsRange(curStart, curEnd),
        getDailyMetricsRange(prevStart, prevEnd)
      ]);
      setCurrentWeekData(cur);
      setPrevWeekData(prev);
    }
    load();
  }, [anchorDate]);

  const stats = useMemo(() => {
    const calc = (data: DailyMetricsRow[]) => {
      const d = data.filter(m => (m.steps || 0) > 0 || (m.kcal || 0) > 0 || (m.weight_g || 0) > 0);
      if (d.length === 0) return { steps: 0, kcal: 0, weight: 0 };
      return {
        steps: d.reduce((acc, m) => acc + (m.steps || 0), 0) / d.length,
        kcal: d.reduce((acc, m) => acc + (m.kcal || 0), 0) / d.length,
        weight: d.reduce((acc, m) => acc + (m.weight_g || 0), 0) / d.length / 1000
      };
    };

    const cur = calc(currentWeekData);
    const prev = calc(prevWeekData);

    const getVar = (c: number, p: number) => p === 0 ? 0 : ((c - p) / p) * 100;

    return {
      cur,
      var: {
        steps: getVar(cur.steps, prev.steps),
        kcal: getVar(cur.kcal, prev.kcal),
        weight: getVar(cur.weight, prev.weight)
      }
    };
  }, [currentWeekData, prevWeekData]);

  const renderVar = (v: number) => (
    <span className={`text-[10px] font-black ml-1 ${v >= 0 ? 'text-menthe' : 'text-rose-500'}`}>
      {v > 0 ? '+' : ''}{v.toFixed(1)}%
    </span>
  );

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 pt-12 pb-24">
        <header className="flex items-center justify-between mb-10 px-2">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Semaine</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">du {format(start, "d MMMM", { locale: fr })}</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="relative">
            <StatBubble icon={Footprints} label="Moy. Pas" value={Math.round(stats.cur.steps)} accent />
            <div className="absolute top-2 right-2">{renderVar(stats.var.steps)}</div>
          </div>
          <div className="relative">
            <StatBubble icon={Flame} label="Moy. Kcal" value={Math.round(stats.cur.kcal)} colorClass="text-yellow-200" />
            <div className="absolute top-2 right-2">{renderVar(stats.var.kcal)}</div>
          </div>
          <div className="relative">
            <StatBubble icon={Weight} label="Moy. Poids" value={stats.cur.weight.toFixed(1)} colorClass="text-purple-500" />
            <div className="absolute top-2 right-2">{renderVar(stats.var.weight)}</div>
          </div>
        </div>

        <div className="space-y-3">
          {days.map((day) => {
            const dStr = format(day, "yyyy-MM-dd");
            const m = currentWeekData.find(x => x.date === dStr);
            const active = isToday(day);

            return (
              <GlassCard key={dStr} onClick={() => navigate(`/?date=${dStr}`)} className={`flex items-center justify-between p-4 cursor-pointer border-l-4 transition-all ${active ? 'border-l-menthe bg-menthe/5' : 'border-l-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${active ? 'bg-menthe text-black' : 'bg-white/5 text-white/40'}`}>
                    <span className="text-[9px] uppercase leading-none mb-0.5">{format(day, "EEE", { locale: fr })}</span>
                    <span className="text-lg leading-none">{format(day, "d")}</span>
                  </div>
                  <div>
                    <p className="font-black uppercase italic text-sm text-white">{format(day, "EEEE", { locale: fr })}</p>
                    <div className="flex gap-3 mt-1 opacity-40">
                      <Footprints size={14} className={m?.steps ? 'text-menthe' : ''} />
                      <Flame size={14} className={m?.kcal ? 'text-yellow-200' : ''} />
                      <Weight size={14} className={m?.weight_g ? 'text-purple-500' : ''} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={(e) => { e.stopPropagation(); setAnchorDate(subDays(anchorDate, 7)); }} className="p-2 text-white/10 hover:text-white"><ChevronLeft size={16}/></button>
                   <button onClick={(e) => { e.stopPropagation(); setAnchorDate(addDays(anchorDate, 7)); }} className="p-2 text-white/10 hover:text-white"><ChevronRight size={16}/></button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}