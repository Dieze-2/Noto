import { useEffect, useMemo, useState } from "react";
import { subDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";
import { calculateAverage, calculateWeightDiff } from "../lib/calculations";

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const { days } = useMemo(() => weekDays(anchor), [anchor]);
  const [metrics, setMetrics] = useState<DailyMetricsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getDailyMetricsRange(isoDate(days[0]), isoDate(days[6]));
      setMetrics(data);
      setLoading(false);
    }
    load();
  }, [days]);

  const stats = useMemo(() => ({
    avgSteps: calculateAverage(metrics, 'steps'),
    avgWeight: calculateAverage(metrics, 'weight_g'),
    weightDiff: calculateWeightDiff(metrics)
  }), [metrics]);

  if (loading) return <div className="p-10 text-center text-slate-400">Analyse des données...</div>;

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">
      <header className="flex flex-col gap-1 px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Performances</h1>
        <div className="flex items-center gap-2">
            <button onClick={() => setAnchor(subDays(anchor, 7))} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">←</button>
            <span className="text-sm font-bold text-indigo-600">Semaine du {format(days[0], 'd MMMM', { locale: fr })}</span>
            <button onClick={() => setAnchor(addDays(anchor, 7))} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">→</button>
        </div>
      </header>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 p-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Moyenne Poids</p>
            <div className="flex items-end gap-2 mt-1">
                <span className="text-4xl font-black">{stats.avgWeight ? formatKgFR(gramsToKg(stats.avgWeight), 1) : "—"}</span>
                <span className="text-lg font-bold opacity-80 mb-1.5">kg</span>
            </div>
            {stats.weightDiff !== 0 && (
                <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black ${stats.weightDiff < 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'}`}>
                    {stats.weightDiff > 0 ? '▲' : '▼'} {Math.abs(stats.weightDiff / 1000).toFixed(1)} kg vs semaine passée
                </div>
            )}
        </div>

        <StatMiniCard label="Pas / Jour" value={stats.avgSteps?.toLocaleString('fr-FR') ?? "—"} icon="👣" color="text-amber-500" />
        <StatMiniCard label="Exercices" value={metrics.length.toString()} icon="💪" color="text-sky-500" />
      </div>

      {/* Liste des jours style "Timeline" */}
      <div className="space-y-3">
        <h3 className="px-2 text-xs font-black text-slate-400 uppercase tracking-widest">Journalier</h3>
        {days.map(d => {
            const m = metrics.find(x => x.date === isoDate(d));
            return (
                <div key={d.toString()} className="group flex items-center justify-between p-4 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-slate-800/50 transition-all hover:bg-white dark:hover:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${m ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 text-slate-300 dark:bg-slate-800/40'}`}>
                            {format(d, 'EE', { locale: fr }).toUpperCase().replace('.', '')}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{format(d, 'd MMMM', { locale: fr })}</p>
                            <p className="text-[10px] font-medium text-slate-400">{m?.note ? (m.note.substring(0, 30) + '...') : 'Aucune note'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{m?.weight_g ? `${formatKgFR(gramsToKg(m.weight_g), 1)} kg` : "—"}</p>
                        <p className="text-[10px] font-bold text-indigo-500">{m?.steps ? `${m.steps} pas` : ""}</p>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-lg mb-2 block">{icon}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-xl font-black mt-1 dark:text-white ${color}`}>{value}</p>
        </div>
    )
}