import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange, getFirstWeightDate } from "../db/dailyMetrics";
import {
  getExerciseMasterHistory,
  listTrackedExercises,
  getFirstExerciseDate,
} from "../db/workouts";
import type { ExerciseMasterPoint } from "../db/workouts";
import { format, subMonths } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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

// YYYY-MM-DD -> DD.MM
function isoToDDMM(iso: string) {
  const mm = iso.slice(5, 7);
  const dd = iso.slice(8, 10);
  return `${dd}.${mm}`;
}

// timestamp(ms) -> DD.MM
function tsToDDMM(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

function computePaddedDomain(values: number[]): [number, number] | ["auto", "auto"] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return ["auto", "auto"];

  let min = Math.min(...finite);
  let max = Math.max(...finite);

  if (min === max) {
    const pad = Math.max(0.5, Math.abs(min) * 0.01);
    return [min - pad, max + pad];
  }

  const range = max - min;
  const pad = range * 0.08;
  return [min - pad, max + pad];
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

  // affichage debug dans l’UI (poids)
  const [showWeightDebug, setShowWeightDebug] = useState(false);

  useEffect(() => {
    listTrackedExercises()
      .then((names) => setTrackedExercises(names))
      .catch(() => setTrackedExercises([]));
  }, []);

  useEffect(() => {
    getFirstWeightDate().then(setFirstWeightDate).catch(() => setFirstWeightDate(null));
  }, []);

  useEffect(() => {
    if (!selectedExercise) {
      setFirstExerciseDate(null);
      return;
    }
    const name = selectedExercise.trim();
    getFirstExerciseDate(name).then(setFirstExerciseDate).catch(() => setFirstExerciseDate(null));
  }, [selectedExercise]);

  const weightFromTo = useMemo(() => rangeToFromTo(weightRange, firstWeightDate), [weightRange, firstWeightDate]);
  const exerciseFromTo = useMemo(() => rangeToFromTo(exerciseRange, firstExerciseDate), [exerciseRange, firstExerciseDate]);

  // TOTAL: étendre le fetch poids pour fallback sur la fenêtre exercice
  const weightFetchFromTo = useMemo(() => {
    let from = weightFromTo.from;
    let to = weightFromTo.to;

    const needsWeightsForTotal = pdcMode === "TOTAL" && selectedExercise.trim().length > 0;

    if (needsWeightsForTotal) {
      from = from < exerciseFromTo.from ? from : exerciseFromTo.from;
      to = to > exerciseFromTo.to ? to : exerciseFromTo.to;

      if (firstWeightDate) {
        from = from < firstWeightDate ? from : firstWeightDate;
      }
    }

    return { from, to };
  }, [
    weightFromTo.from,
    weightFromTo.to,
    exerciseFromTo.from,
    exerciseFromTo.to,
    pdcMode,
    selectedExercise,
    firstWeightDate,
  ]);

  useEffect(() => {
    getDailyMetricsRange(weightFetchFromTo.from, weightFetchFromTo.to)
      .then((rows) => setWeightRows(rows.map((r) => ({ date: r.date, weight_g: r.weight_g }))))
      .catch(() => setWeightRows([]));
  }, [weightFetchFromTo.from, weightFetchFromTo.to]);

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
    const from = weightFromTo.from;
    const to = weightFromTo.to;

    return weightRows
      .filter((r) => r.date >= from && r.date <= to)
      .filter((r) => r.weight_g != null)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        iso: r.date,
        x: new Date(`${r.date}T00:00:00`).getTime(),
        kg: (r.weight_g ?? 0) / 1000,
      }));
  }, [weightRows, weightFromTo.from, weightFromTo.to]);

  const weightYDomain = useMemo(() => computePaddedDomain(weightChartData.map((d) => d.kg)), [weightChartData]);

  const weightDebugText = useMemo(() => {
    const kgs = weightChartData.map((d) => d.kg).filter((v) => Number.isFinite(v));
    const min = kgs.length ? Math.min(...kgs) : null;
    const max = kgs.length ? Math.max(...kgs) : null;

    return {
      range: weightRange,
      from: weightFromTo.from,
      to: weightFromTo.to,
      points: weightChartData.length,
      min,
      max,
      yDomain: weightYDomain,
      head: weightChartData.slice(0, 3),
      tail: weightChartData.slice(-3),
    };
  }, [weightChartData, weightFromTo.from, weightFromTo.to, weightRange, weightYDomain]);

  // force remount to avoid stale internal scales when switching ranges
  const weightChartKey = useMemo(() => {
    const first = weightChartData[0]?.x ?? "none";
    const last = weightChartData[weightChartData.length - 1]?.x ?? "none";
    return `w:${weightRange}:${weightFromTo.from}:${weightFromTo.to}:${weightChartData.length}:${first}:${last}`;
  }, [weightRange, weightFromTo.from, weightFromTo.to, weightChartData]);

  useEffect(() => {
    console.groupCollapsed(
      `[DASH][POIDS] range=${weightDebugText.range} from=${weightDebugText.from} to=${weightDebugText.to} points=${weightDebugText.points}`
    );
    console.log("minKg:", weightDebugText.min, "maxKg:", weightDebugText.max, "yDomain:", weightDebugText.yDomain);
    console.log("head:", weightDebugText.head);
    console.log("tail:", weightDebugText.tail);
    console.groupEnd();
  }, [weightDebugText]);

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
      points.push({ iso: date, date: isoToDDMM(date), valueKg: Math.max(...vals) });
    }

    return points.sort((a, b) => a.iso.localeCompare(b.iso));
  }, [exerciseRows, pdcMode, weightLookup]);

  const hasWeightData = weightChartData.length >= 1;
  const hasExercise = selectedExercise.trim().length > 0;
  const hasExerciseData = exerciseChartData.length >= 1;

  function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[90]">
        <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Fermer" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="glass-card border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">ZOOM</p>
                <button onClick={onClose} className="text-white/40 font-black text-[10px] uppercase tracking-widest">Fermer</button>
              </div>
              <div className="p-4 bg-black">
                <div className="w-full h-[70vh]">{children}</div>
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

      {/* POIDS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Poids</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWeightDebug((v) => !v)}
              className={`bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:text-white ${
                showWeightDebug ? "text-menthe" : "text-white/50"
              }`}
              title="Debug"
            >
              Debug
            </button>

            <button
              type="button"
              onClick={() => setModal("weight")}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
            >
              Zoom
            </button>
          </div>
        </div>

        <div className="mt-4 flex bg-white/5 rounded-2xl p-1">
          {(["3M", "6M", "TOUT"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setWeightRange(r)}
              className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${
                weightRange === r ? "bg-menthe text-black" : "text-white/30"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden">
          {hasWeightData ? (
            <div className="w-full overflow-x-auto no-scrollbar">
              <LineChart key={weightChartKey} width={520} height={220} data={weightChartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  type="number"
                  scale="linear"
                  dataKey="x"
                  domain={["dataMin", "dataMax"]}
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(v) => (typeof v === "number" ? tsToDDMM(v) : String(v))}
                />
                <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} reversed={false} domain={weightYDomain} />
                <Tooltip
                  labelFormatter={(v) => (typeof v === "number" ? tsToDDMM(v) : String(v))}
                  contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#00FFA3"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#00FFA3" }}
                  activeDot={{ r: 6, fill: "#ffffff", stroke: "#00FFA3", strokeWidth: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </div>
          ) : (
            <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
              PAS DE DONNÉES POIDS
            </div>
          )}
        </div>

        {showWeightDebug && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">DEBUG POIDS</p>
            <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/70 space-y-1">
              <p>RANGE: {weightDebugText.range}</p>
              <p>FROM: {weightDebugText.from} — TO: {weightDebugText.to}</p>
              <p>POINTS: {weightDebugText.points}</p>
              <p>MIN KG: {weightDebugText.min ?? "—"} / MAX KG: {weightDebugText.max ?? "—"}</p>
              <p>
                DOMAIN:{" "}
                {Array.isArray(weightDebugText.yDomain) ? weightDebugText.yDomain.join(" .. ") : String(weightDebugText.yDomain)}
              </p>
              <div className="pt-2">
                <p className="text-white/40">HEAD:</p>
                <pre className="whitespace-pre-wrap break-words text-white/60">{JSON.stringify(weightDebugText.head, null, 2)}</pre>
                <p className="text-white/40">TAIL:</p>
                <pre className="whitespace-pre-wrap break-words text-white/60">{JSON.stringify(weightDebugText.tail, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* EXERCICE SETTINGS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
          Exercice
        </p>

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
              className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${
                exerciseRange === r ? "bg-menthe text-black" : "text-white/30"
              }`}
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
                className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${
                  pdcMode === m ? "bg-menthe text-black" : "text-white/30"
                }`}
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
                {info === "LEST"
                  ? "UNIQUEMENT LA CHARGE PORTÉE OU FIXÉE SUR UNE BARRE"
                  : "POIDS DU CORPS + CHARGE LESTÉE"}
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                TAP POUR FERMER
              </p>
            </button>
          )}
        </div>
      </GlassCard>

      {/* EXERCICE CHART */}
      {hasExercise && (
        <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                {selectedExercise.trim()}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                {pdcMode === "LEST" ? "PDC+ = LEST (KG)" : "PDC+ = TOTAL (PDC + LEST)"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModal("exercise")}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
            >
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
                  <Line
                    type="monotone"
                    dataKey="valueKg"
                    stroke="#00FFA3"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#00FFA3" }}
                    activeDot={{ r: 6, fill: "#ffffff", stroke: "#00FFA3", strokeWidth: 3 }}
                  />
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
            <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} reversed={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Line
              type="monotone"
              dataKey="valueKg"
              stroke="#00FFA3"
              strokeWidth={3}
              dot={{ r: 3, fill: "#00FFA3" }}
              activeDot={{ r: 7, fill: "#ffffff", stroke: "#00FFA3", strokeWidth: 3 }}
            />
          </LineChart>
        </div>
      </Modal>

      <Modal open={modal === "weight"} onClose={() => setModal(null)}>
        <div className="w-full overflow-x-auto no-scrollbar">
          <LineChart width={900} height={420} data={weightChartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              scale="time"
              dataKey="x"
              domain={["dataMin", "dataMax"]}
              allowDataOverflow={false}
              stroke="rgba(255,255,255,0.25)"
              tick={{ fontSize: 10, fontWeight: 800 }}
              tickFormatter={(v) => (typeof v === "number" ? tsToDDMM(v) : String(v))}
            />
            <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} reversed={false} domain={weightYDomain} />
            <Tooltip
              labelFormatter={(v) => (typeof v === "number" ? tsToDDMM(v) : String(v))}
              contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="#00FFA3"
              strokeWidth={3}
              dot={{ r: 3, fill: "#00FFA3" }}
              activeDot={{ r: 7, fill: "#ffffff", stroke: "#00FFA3", strokeWidth: 3 }}
            />
          </LineChart>
        </div>
      </Modal>
    </div>
  );
}
