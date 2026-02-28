import { useEffect, useMemo, useState } from "react";
import { addDays, subDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";
import { calculateAverage, calculateWeightDiff } from "../lib/calculations";

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);

  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<DailyMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const from = isoDate(days[0]);
      const to = isoDate(days[6]);
      
      const prevFrom = isoDate(subDays(days[0], 7));
      const prevTo = isoDate(subDays(days[6], 7));

      const [currentData, prevData] = await Promise.all([
        getDailyMetricsRange(from, to),
        getDailyMetricsRange(prevFrom, prevTo)
      ]);

      setMetrics(currentData);
      setPrevMetrics(prevData);
      setLoading(false);
    }
    loadStats();
  }, [days]);

  // Calculs des moyennes (Current)
  const avgSteps = calculateAverage(metrics.map(m => m.steps));
  const avgKcal = calculateAverage(metrics.map(m => m.kcal));
  const avgWeightG = calculateAverage(metrics.map(m => m.weight_g));

  // Calculs des moyennes (Prev)
  const prevAvgWeightG = calculateAverage(prevMetrics.map(m => m.weight_g));
  const weightComparison = calculateWeightDiff(avgWeightG, prevAvgWeightG);

  if (loading) return <div className="p-6 text-center text-slate-500">Chargement...</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <button onClick={() => setAnchor(subDays(anchor, 7))} className="p-2">◀️</button>
        <h1 className="text-lg font-bold">Semaine du {format(days[0], 'd MMM', { locale: fr })}</h1>
        <button onClick={() => setAnchor(addDays(anchor, 7))} className="p-2">▶️</button>
      </header>

      {/* GRILLE DE STATS */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Pas Moy." value={avgSteps ? Math.round(avgSteps).toLocaleString('fr-FR') : "—"} />
        <StatCard title="Kcal Moy." value={avgKcal ? Math.round(avgKcal).toLocaleString('fr-FR') : "—"} />
        <StatCard 
          title="Poids Moy." 
          value={avgWeightG ? `${formatKgFR(gramsToKg(avgWeightG), 1)} kg` : "—"} 
          subValue={weightComparison ? `${weightComparison.percent > 0 ? '+' : ''}${weightComparison.percent.toFixed(2)}%` : undefined}
          trend={weightComparison ? (weightComparison.percent <= 0 ? 'good' : 'neutral') : undefined}
        />
        <StatCard title="Jours saisis" value={`${metrics.length} / 7`} />
      </div>

      {/* LISTE DES JOURS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {days.map((d) => {
          const dateStr = isoDate(d);
          const m = metrics.find(x => x.date === dateStr);
          return (
            <div key={dateStr} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
              <div className="flex flex-col">
                <span className="text-sm font-bold capitalize text-slate-800">{format(d, 'EEEE', { locale: fr })}</span>
                <span className="text-xs text-slate-400">{format(d, 'd MMMM', { locale: fr })}</span>
              </div>
              <div className="flex gap-4 text-right">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase">Poids</span>
                  <span className="text-sm font-medium">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)}` : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase">Pas</span>
                  <span className="text-sm font-medium">{m?.steps ? m.steps.toLocaleString('fr-FR') : "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, trend }: { title: string, value: string, subValue?: string, trend?: 'good' | 'neutral' | 'bad' }) {
  const trendColor = trend === 'good' ? 'text-emerald-600' : trend === 'bad' ? 'text-rose-600' : 'text-slate-500';
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="text-xs font-medium text-slate-500 uppercase mb-1">{title}</div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      {subValue && <div className={`text-xs font-bold mt-1 ${trendColor}`}>{subValue}</div>}
    </div>
  );
}