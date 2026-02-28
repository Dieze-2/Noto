import { useEffect, useMemo, useState } from "react";
import { subDays, addDays, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";
import { useNavigate } from "react-router-dom";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<DailyMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const current = await getDailyMetricsRange(isoDate(days[0]), isoDate(days[6]));
      const prev = await getDailyMetricsRange(isoDate(subDays(days[0], 7)), isoDate(subDays(days[6], 7)));
      setMetrics(current);
      setPrevMetrics(prev);
      setLoading(false);
    }
    load();
  }, [days]);

  const stats = useMemo(() => {
    const calc = (rows: DailyMetricsRow[]) => {
      const w = rows.filter(m => m.weight_g).map(m => m.weight_g as number);
      const s = rows.filter(m => m.steps).map(m => m.steps as number);
      const k = rows.filter(m => m.kcal).map(m => m.kcal as number);
      return {
        avgWeight: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null,
        avgSteps: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null,
        avgKcal: k.length ? Math.round(k.reduce((a, b) => a + b, 0) / k.length) : null
      };
    };

    const current = calc(metrics);
    const previous = calc(prevMetrics);

    let weightVar = null;
    if (current.avgWeight && previous.avgWeight) {
      weightVar = ((current.avgWeight - previous.avgWeight) / previous.avgWeight) * 100;
    }

    return { ...current, weightVar };
  }, [metrics, prevMetrics]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-mineral-900 dark:text-white">Performances</h1>
        <div className="flex items-center gap-4 mt-4">
          <button onClick={() => setAnchor(subDays(anchor, 7))} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">←</button>
          <span className="text-sm font-black text-sauge-600 uppercase tracking-widest flex-1 text-center">
            Semaine du {format(days[0], 'd MMMM', { locale: fr })}
          </span>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="w-10 h-10 rounded-full glass-card flex items-center justify-center">→</button>
        </div>
      </header>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 p-8 rounded-[2.5rem] bg-mineral-900 text-white shadow-xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Moyenne Poids</p>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-5xl font-black">{stats.avgWeight ? formatKgFR(gramsToKg(stats.avgWeight), 1) : "—"}</span>
            <span className="text-xl font-bold opacity-40 mb-2 text-sauge-200">kg</span>
            {stats.weightVar !== null && (
              <span className={`text-xs font-black mb-3 ${stats.weightVar > 0 ? 'text-rose-400' : 'text-sauge-400'}`}>
                {stats.weightVar > 0 ? '+' : ''}{stats.weightVar.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem]">
          <p className="text-[9px] font-black text-sauge-600 uppercase tracking-widest mb-1">Pas / Jour</p>
          <p className="text-2xl font-black">{stats.avgSteps?.toLocaleString() ?? "—"}</p>
        </div>
        <div className="glass-card p-6 rounded-[2rem]">
          <p className="text-[9px] font-black text-sauge-600 uppercase tracking-widest mb-1">Kcal / Jour</p>
          <p className="text-2xl font-black">{stats.avgKcal?.toLocaleString() ?? "—"}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {days.map(d => {
          const m = metrics.find(x => x.date === isoDate(d));
          return (
            <button key={d.toString()} onClick={() => navigate(`/?date=${isoDate(d)}`)} className="w-full text-left glass-card flex items-center justify-between p-5 rounded-3xl active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${m ? 'bg-sauge-500 text-white' : 'bg-sauge-100 dark:bg-mineral-800 opacity-40'}`}>
                  <span className="text-[8px] uppercase">{format(d, 'EEE', { locale: fr })}</span>
                  <span className="text-sm">{format(d, 'd')}</span>
                </div>
                <div>
                  <p className="font-black text-mineral-900 dark:text-white capitalize">{format(d, 'MMMM', { locale: fr })}</p>
                  <p className="text-[10px] text-mineral-500 italic truncate max-w-[120px]">{m?.note || "Aucune note"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-sm">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
                <p className="text-[10px] font-bold text-sauge-600">{m?.steps ? `${m.steps.toLocaleString()} pas` : ""}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
}