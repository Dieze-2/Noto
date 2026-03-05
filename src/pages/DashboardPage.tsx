import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange, getFirstWeightDate } from "../db/dailyMetrics";
import { getExerciseMasterHistory, listTrackedExercises, getFirstExerciseDate } from "../db/workouts";
import type { ExerciseMasterPoint } from "../db/workouts";
import { format, subMonths } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type PdcMode = "LEST" | "TOTAL";
type Range = "3M" | "6M" | "TOUT";

function isoToday() {
  return format(new Date(), "yyyy-MM-dd");
}
function isoMonthsAgo(months: number) {
  return format(subMonths(new Date(), months), "yyyy-MM-dd");
}
function rangeToFromTo(r: Range, firstDate: string | null) {
  const to = isoToday();
  if (r === "TOUT") return { from: firstDate ?? to, to };
  if (r === "6M") return { from: isoMonthsAgo(6), to };
  return { from: isoMonthsAgo(3), to };
}

function buildWeightLookup(rows: { date: string; weight_g: number | null }[]) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  let last: number | null = null;
  const map = new Map<string, number | null>();
  for (const r of sorted) {
    if (r.weight_g != null) last = r.weight_g;
    map.set(r.date, last);
  }
  return map;
}

function isMobile() {
  return window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
}

export default function DashboardPage() {
  const [trackedExercises, setTrackedExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const [pdcMode, setPdcMode] = useState<PdcMode>("LEST");
  const [info, setInfo] = useState<null | PdcMode>(null);

  const [weightRange, setWeightRange] = useState<Range>("3M");
  const [exerciseRange, setExerciseRange] = useState<Range>("TOUT");

  const [exerciseRows, setExerciseRows] = useState<ExerciseMasterPoint[]>([]);
  const [weightRows, setWeightRows] = useState<{ date: string; weight_g: number | null }[]>([]);

  const [firstWeightDate, setFirstWeightDate] = useState<string | null>(null);
  const [firstExerciseDate, setFirstExerciseDate] = useState<string | null>(null);

  const [modal, setModal] = useState<null | "exercise" | "weight">(null);

  // exercises list (from DB)
  useEffect(() => {
    listTrackedExercises()
      .then((names) => setTrackedExercises(names))
      .catch(() => setTrackedExercises([]));
  }, []);

  // first weight date (for TOUT)
  useEffect(() => {
    getFirstWeightDate().then(setFirstWeightDate).catch(() => setFirstWeightDate(null));
  }, []);

  // first exercise date (for TOUT)
  useEffect(() => {
    if (!selectedExercise) {
      setFirstExerciseDate(null);
      return;
    }
    // IMPORTANT: sanitize just in case (trim)
    const name = selectedExercise.trim();
    getFirstExerciseDate(name).then(setFirstExerciseDate).catch(() => setFirstExerciseDate(null));
  }, [selectedExercise]);

  const weightFromTo = useMemo(() => rangeToFromTo(weightRange, firstWeightDate), [weightRange, firstWeightDate]);
  const exerciseFromTo = useMemo(() => rangeToFromTo(exerciseRange, firstExerciseDate), [exerciseRange, firstExerciseDate]);

  useEffect(() => {
    getDailyMetricsRange(weightFromTo.from, weightFromTo.to)
      .then((rows) => setWeightRows(rows.map((r) => ({ date: r.date, weight_g: r.weight_g }))))
      .catch(() => setWeightRows([]));
  }, [weightFromTo.from, weightFromTo.to]);

  useEffect(() => {
    if (!selectedExercise) {
      setExerciseRows([]);
      return;
    }
    const name = selectedExercise.trim();
    getExerciseMasterHistory(name, exerciseFromTo.from, exerciseFromTo.to)
      .then(setExerciseRows)
      .catch(() => setExerciseRows([]));
  }, [selectedExercise, exerciseFromTo.from, exerciseFromTo.to]);

  const weightLookup = useMemo(() => buildWeightLookup(weightRows), [weightRows]);

  const weightChartData = useMemo(() => {
    return weightRows
      .filter((r) => r.weight_g != null)
      .map((r) => ({
        date: r.date.slice(5),
        iso: r.date,
        kg: (r.weight_g ?? 0) / 1000,
      }));
  }, [weightRows]);

  const exerciseChartData = useMemo(() => {
    const byDay = new Map<string, ExerciseMasterPoint[]>();
    for (const r of exerciseRows) {
      const arr = byDay.get(r.date) ?? [];
      arr.push(r);
      byDay.set(r.date, arr);
    }

    const points: { iso: string; date: string; valueKg: number }[] = [];

    for (const [date, arr] of byDay.entries()) {
      const vals = arr
        .map((r) => {
          const loadKg = (r.load_g ?? 0) / 1000;

          if (r.load_type === "KG") return loadKg;

          if (r.load_type === "PDC_PLUS") {
            if (pdcMode === "LEST") return loadKg;
            const w = weightLookup.get(date) ?? null;
            if (w == null) return Number.NaN;
            return w / 1000 + loadKg;
          }

          if (r.load_type === "PDC") {
            if (pdcMode === "LEST") return 0;
            const w = weightLookup.get(date) ?? null;
            return w == null ? Number.NaN : w / 1000;
          }

          return Number.NaN;
        })
        .filter((v) => Number.isFinite(v));

      if (!vals.length) continue;
      points.push({ iso: date, date: date.slice(5), valueKg: Math.max(...vals) });
    }

    return points.sort((a, b) => a.iso.localeCompare(b.iso));
  }, [exerciseRows, pdcMode, weightLookup]);

  const hasWeightData = weightChartData.length >= 1;
  const hasExercise = selectedExercise.trim().length > 0;
  const hasExerciseData = exerciseChartData.length >= 1;

  function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    const mobile = isMobile();
    return (
      <div className="fixed inset-0 z-[90]">
        <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Fermer" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="glass-card border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{mobile ? "MODE PAYSAGE (SIMULÉ)" : "ZOOM"}</p>
                <button onClick={onClose} className="text-white/40 font-black text-[10px] uppercase tracking-widest">Fermer</button>
              </div>
              <div className="p-4 bg-black">
                <div className="w-full h-[70vh]">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32 space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Dashboard</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">Charts</p>
      </header>

      {/* DEBUG (discret, à supprimer quand ok) */}
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-center">
        WEIGHT:{weightRows.length} EX:{exerciseRows.length} EXPTS:{exerciseChartData.length} FIRSTW:{firstWeightDate ?? "--"} FIRSTE:{firstExerciseDate ?? "--"}
      </div>

      {/* POIDS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Poids</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">Range</p>
          </div>
          <button type="button" onClick={() => setModal("weight")} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white">
            Zoom
          </button>
        </div>

        <div className="mt-4 flex bg-white/5 rounded-2xl p-1">
          {(["3M", "6M", "TOUT"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setWeightRange(r)}
              className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${weightRange === r ? "bg-menthe text-black" : "text-white/30"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden">
  {hasWeightData ? (
    <div className="w-full overflow-x-auto no-scrollbar">
      <LineChart width={520} height={220} data={weightChartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
        <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
        <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
        <Line type="monotone" dataKey="kg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </div>
  ) : (
    <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
      PAS DE DONNÉES POIDS
    </div>
  )}
</div>

      </GlassCard>

      {/* EXERCICE SETTINGS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Exercice</p>

        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-black uppercase italic text-white outline-none focus:border-menthe"
        >
          <option value="">—</option>
          {trackedExercises.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="flex bg-white/5 rounded-2xl p-1">
          {(["3M", "6M", "TOUT"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setExerciseRange(r)}
              className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${exerciseRange === r ? "bg-menthe text-black" : "text-white/30"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex bg-white/5 rounded-2xl p-1 relative">
          {(["LEST", "TOTAL"] as const).map((m) => (
            <div key={m} className="flex-1 flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setPdcMode(m)}
                className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${pdcMode === m ? "bg-menthe text-black" : "text-white/30"}`}
              >
                {m}
              </button>
              <button
                type="button"
                onClick={() => setInfo(info === m ? null : m)}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/50"
              >
                i
              </button>
            </div>
          ))}

          {info && (
            <button
              type="button"
              onClick={() => setInfo(null)}
              className="absolute left-0 right-0 top-[3.2rem] mx-auto w-full bg-black/80 border border-white/10 rounded-2xl px-4 py-3 text-left"
            >
              <p className="text-[10px] font-black uppercase italic tracking-widest text-white/70">
                {info === "LEST" ? "UNIQUEMENT LA CHARGE PORTÉE OU FIXÉE SUR UNE BARRE" : "POIDS DU CORPS + CHARGE LESTÉE"}
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">TAP POUR FERMER</p>
            </button>
          )}
        </div>
      </GlassCard>

      {/* EXERCICE CHART */}
      {hasExercise && (
        <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{selectedExercise.trim()}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                {pdcMode === "LEST" ? "PDC+ = LEST (KG)" : "PDC+ = TOTAL (PDC + LEST)"}
              </p>
            </div>
            <button type="button" onClick={() => setModal("exercise")} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white">
              Zoom
            </button>
          </div>

          <div className="mt-6 overflow-hidden">
  {hasExerciseData ? (
    <div className="w-full overflow-x-auto no-scrollbar">
      <LineChart width={520} height={220} data={exerciseChartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
        <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
        <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
        <Line type="monotone" dataKey="valueKg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </div>
  ) : (
    <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
      PAS ASSEZ DE DONNÉES
    </div>
  )}
</div>

        </GlassCard>
      )}

      <Modal open={modal === "exercise"} onClose={() => setModal(null)}>
  <div className="w-full overflow-x-auto no-scrollbar">
    <LineChart width={900} height={420} data={exerciseChartData}>
      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
      <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} reverse={false} domain={["auto", "auto"]} />
      <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
      <Line type="monotone" dataKey="valueKg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
    </LineChart>
  </div>
</Modal>


      <Modal open={modal === "weight"} onClose={() => setModal(null)}>
  <div className="w-full overflow-x-auto no-scrollbar">
    <LineChart width={900} height={420} data={weightChartData}>
      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
      <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
      <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
      <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
      <Line type="monotone" dataKey="kg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
    </LineChart>
  </div>
</Modal>

    </div>
  );
}
