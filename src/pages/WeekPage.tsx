import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Footprints, Flame, Weight } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange } from "../db/dailyMetrics";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [metrics, setMetrics] = useState<any[]>([]);

  // Calcul de la semaine (Lundi à Dimanche)
  const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  useEffect(() => {
    async function load() {
      // On récupère les metrics du lundi au dimanche
      const data = await getDailyMetricsRange(
        format(days[0], "yyyy-MM-dd"), 
        format(days[6], "yyyy-MM-dd")
      );
      setMetrics(data || []);
    }
    load();
  }, [anchorDate]);

  const nextWeek = () => setAnchorDate(addDays(anchorDate, 7));
  const prevWeek = () => setAnchorDate(subDays(anchorDate, 7));

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-10 pb-24">
        {/* Header avec sélecteur de semaine */}
        <header className="flex items-end justify-between mb-10 px-2">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Semaine</h1>
            <p className="text-[10px] font-black text-menthe uppercase tracking-widest">
              du {format(start, "d MMMM", { locale: fr })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={prevWeek} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <ChevronLeft size={20}/>
            </button>
            <button onClick={nextWeek} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <ChevronRight size={20}/>
            </button>
          </div>
        </header>

        {/* Liste des jours */}
        <div className="space-y-3">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const active = isToday(day);
            
            // Trouver les données correspondantes dans le tableau metrics
            const m = metrics.find(item => item.date === dateStr);

            return (
              <GlassCard 
                key={dateStr} 
                onClick={() => navigate(`/?date=${dateStr}`)}
                className={`flex items-center justify-between p-4 cursor-pointer active:scale-[0.98] transition-all border-l-4 ${
                  active ? 'border-l-menthe bg-menthe/5' : 'border-l-transparent border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Badge Date */}
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    active ? 'bg-menthe text-black shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'bg-zinc-900 text-white/40'
                  }`}>
                    <span className="text-[9px] uppercase leading-none mb-0.5">{format(day, "EEE", { locale: fr })}</span>
                    <span className="text-lg leading-none">{format(day, "d")}</span>
                  </div>

                  {/* Infos & Mini-KPIs */}
                  <div>
                    <p className={`font-black uppercase italic text-sm ${active ? 'text-white' : 'text-white/70'}`}>
                      {format(day, "EEEE", { locale: fr })}
                    </p>
                    
                    <div className="flex gap-3 mt-1.5 items-center">
                      <div className="flex items-center gap-1">
                        <Footprints size={12} className={m?.steps ? "text-menthe" : "text-white/10"} />
                        <span className={`text-[10px] font-bold ${m?.steps ? 'text-white/60' : 'text-white/10'}`}>
                          {m?.steps || "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame size={12} className={m?.kcal ? "text-orange-500" : "text-white/10"} />
                        <span className={`text-[10px] font-bold ${m?.kcal ? 'text-white/60' : 'text-white/10'}`}>
                          {m?.kcal || "0"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight size={12} className={m?.weight_g ? "text-purple-500" : "text-white/10"} />
                        <span className={`text-[10px] font-bold ${m?.weight_g ? 'text-white/60' : 'text-white/10'}`}>
                          {m?.weight_g ? (m.weight_g / 1000).toFixed(1) : "--"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="text-white/10" />
              </GlassCard>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}