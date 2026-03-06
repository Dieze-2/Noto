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

// YYYY-MM-DD -> DD.MM
function isoToDDMM(iso: string) {
  const mm = iso.slice(5, 7);
  const dd = iso.slice(8, 10);
  return `${dd}.${mm}`;
}

function isoToTs(iso: string) {
  // stable en local: minuit local, suffisant pour un axe de jours
  return new Date(`${iso}T00:00:00`).getTime();
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

function dedupeByIsoKeepLast<T extends { iso: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of rows) map.set(r.iso, r);
  return Array.from(map.values()).sort((a, b) => a.iso.localeCompare(b.iso));
}

function ChartBlockNumericX({
  chartKey,
  data,
  yKey,
  widthBase = 520,
  height = 220,
}: {
  chartKey: string;
  data: any[];
  yKey: string;
  widthBase?: number;
  height?: number;
}) {
  if (!data.length) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
        PAS ASSEZ DE DONNÉES
      </div>
    );
  }

  const chartW = Math.max(widthBase, data.length * 32);

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <LineChart key={chartKey} width={chartW} height={height} data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          scale="linear"
          dataKey="x"
          domain={["dataMin", "dataMax"]}
          stroke="rgba(255,255,255,0.25)"
          tick={{ fontSize: 10, fontWeight: 800 }}
          tickFormatter={(v) => {
            if (typeof v !== "number") return String(v);
            // on récupère le iso depuis payload via tooltip; tick => on reformate via Date
            const d = new Date(v);
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            return `${dd}.${mm}`;
          }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.25)"
          tick={{ fontSize: 10, fontWeight: 800 }}
          reversed={false}
          domain={["auto", "auto"]}
        />
        <Tooltip
          labelFormatter={(v) => {
            if (typeof v !== "number") return String(v);
            const d = new Date(v);
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            return `${dd}.${mm}`;
          }}
          contentStyle={{
            background: "rgba(0,0,0,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
          }}
        />
        <Line
          type="linear"
          dataKey={yKey}
          stroke="#00FFA3"
          strokeWidth={3}
          dot={{ r: 3, fill: "#00FFA3" }}
          activeDot={{ r: 7, fill: "#ffffff", stroke: "#00FFA3", strokeWidth: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  leftLabel,
  rightLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-black uppercase tracking-widest ${!checked ? "text-menthe" : "text-white/30"}`}>
        {leftLabel}
      </span>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={[
          "relative w-12 h-7 rounded-full border border-white/10",
          "bg-white/10 transition-colors",
          checked ? "bg-menthe/80" : "",
          "focus:outline-none focus:ring-2 focus:ring-menthe/60",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 left-1 h-5 w-5 rounded-full bg-black",
            "transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>

      <span className={`text-[10px] font-black uppercase tracking-widest ${checked ? "text-menthe" : "text-white/30"}`}>
        {rightLabel}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [trackedExercises, setTrackedExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const [pdcMode, setPdcMode] = useState<PdcMode>("LEST");
  const [infoOpen, setInfoOpen] = useState(false);

  const [weightRange, setWeightRange] = useState<Range>("3M");
  const [exerciseRange, setExerciseRange] = useState<Range>("TOUT");

  const [exerciseRows, setExerciseRows] = useState<ExerciseMasterPoint[]>([]);
  const [weightRows, setWeightRows] = useState<{ date: string; weight_g: number | null }[]>([]);

  const [firstWeightDate, setFirstWeightDate] = useState<string | null>(null);
  const [firstExerciseDate, setFirstExerciseDate] = useState<string | null>(null);

  const [modal, setModal] = useState<null | "exercise" | "weight">(null);

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

  // Poids: x numérique (timestamp) + iso (pour debug/dédoublonnage)
  const weightChartData = useMemo(() => {
    const from = weightFromTo.from;
    const to = weightFromTo.to;

    const rows = weightRows
      .filter((r) => r.date >= from && r.date <= to)
      .filter((r) => r.weight_g != null)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        iso: r.date,
        x: isoToTs(r.date),
        kg: (r.weight_g ?? 0) / 1000,
      }));

    return dedupeByIsoKeepLast(rows);
  }, [weightRows, weightFromTo.from, weightFromTo.to]);

  // Exercice: 1 point/jour (max), + x timestamp
  const exerciseChartData = useMemo(() => {
    const byDay = new Map<string, ExerciseMasterPoint[]>();
    for (const r of exerciseRows) {
      const arr = byDay.get(r.date) ?? [];
      arr.push(r);
      byDay.set(r.date, arr);
    }

    const points: { iso: string; x: number; valueKg: number }[] = [];

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

      points.push({
        iso: date,
        x: isoToTs(date),
        valueKg: Math.max(...vals),
      });
    }

    const sorted = points.sort((a, b) => a.iso.localeCompare(b.iso));
    return dedupeByIsoKeepLast(sorted);
  }, [exerciseRows, pdcMode, weightLookup]);

  const hasExercise = selectedExercise.trim().length > 0;

  const weightChartKey = useMemo(() => {
    const first = weightChartData[0]?.iso ?? "none";
    const last = weightChartData[weightChartData.length - 1]?.iso ?? "none";
    return `w:${weightRange}:${weightFromTo.from}:${weightFromTo.to}:${weightChartData.length}:${first}:${last}`;
  }, [weightRange, weightFromTo.from, weightFromTo.to, weightChartData]);

  const exerciseChartKey = useMemo(() => {
    const first = exerciseChartData[0]?.iso ?? "none";
    const last = exerciseChartData[exerciseChartData.length - 1]?.iso ?? "none";
    return `e:${selectedExercise.trim()}:${exerciseRange}:${pdcMode}:${exerciseFromTo.from}:${exerciseFromTo.to}:${exerciseChartData.length}:${first}:${last}`;
  }, [selectedExercise, exerciseRange, pdcMode, exerciseFromTo.from, exerciseFromTo.to, exerciseChartData]);

  function Modal({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-[90]">
        <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Fermer" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="glass-card border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{title}</p>
                <button onClick={onClose} className="text-white/40 font-black text-[10px] uppercase tracking-widest">
                  Fermer
                </button>
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
          <ChartBlockNumericX chartKey={weightChartKey} data={weightChartData} yKey="kg" />
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

        <div className="bg-white/5 rounded-2xl p-4 relative space-y-4">
          <div className="flex items-center justify-between gap-4">
            <ToggleSwitch
              checked={pdcMode === "TOTAL"}
              onChange={(checked) => setPdcMode(checked ? "TOTAL" : "LEST")}
              leftLabel="LEST"
              rightLabel="TOTAL"
            />

            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/50"
              aria-label="Info"
            >
              i
            </button>
          </div>

          {infoOpen && (
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              className="w-full bg-black/80 border border-white/10 rounded-2xl px-4 py-3 text-left"
            >
              <p className="text-[10px] font-black uppercase italic tracking-widest text-white/70">
                {pdcMode === "LEST"
                  ? "LEST = UNIQUEMENT LA CHARGE PORTÉE OU FIXÉE SUR UNE BARRE"
                  : "TOTAL = POIDS DU CORPS + CHARGE LESTÉE"}
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
            <ChartBlockNumericX chartKey={exerciseChartKey} data={exerciseChartData} yKey="valueKg" />
          </div>
        </GlassCard>
      )}

      <Modal open={modal === "exercise"} onClose={() => setModal(null)} title="ZOOM">
        <ChartBlockNumericX chartKey={`${exerciseChartKey}:zoom`} data={exerciseChartData} yKey="valueKg" widthBase={900} height={420} />
      </Modal>

      <Modal open={modal === "weight"} onClose={() => setModal(null)} title="ZOOM">
        <ChartBlockNumericX chartKey={`${weightChartKey}:zoom`} data={weightChartData} yKey="kg" widthBase={900} height={420} />
      </Modal>
    </div>
  );
}
