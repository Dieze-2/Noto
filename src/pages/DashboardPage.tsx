import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import { getExerciseMasterHistory } from "../db/workouts";
import type { ExerciseMasterPoint } from "../db/workouts";
import { listTrackedExercises } from "../db/workouts";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { format, subMonths } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type PdcMode = "LEST" | "TOTAL";
type WeightRange = "3M" | "6M" | "ALL";

function isoToday() {
  return format(new Date(), "yyyy-MM-dd");
}
function isoMonthsAgo(months: number) {
  return format(subMonths(new Date(), months), "yyyy-MM-dd");
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
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const [pdcMode, setPdcMode] = useState<PdcMode>("LEST");
  const [weightRange, setWeightRange] = useState<WeightRange>("3M");

  const [exerciseRows, setExerciseRows] = useState<ExerciseMasterPoint[]>([]);
  const [weightRows, setWeightRows] = useState<{ date: string; weight_g: number | null }[]>([]);
  const [modal, setModal] = useState<null | "exercise" | "weight">(null);

  // Load tracked exercises from DB
  useEffect(() => {
    listTrackedExercises()
      .then((names) => {
        setTrackedExercises(names);
        // auto-select first if none
        if (!selectedExercise && names.length > 0) {
          setSelectedExercise(names[0]);
          setExerciseQuery(names[0]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weightFromTo = useMemo(() => {
    const to = isoToday();
    if (weightRange === "ALL") return { from: "2020-01-01", to };
    if (weightRange === "6M") return { from: isoMonthsAgo(6), to };
    return { from: isoMonthsAgo(3), to };
  }, [weightRange]);

  const exerciseFromTo = useMemo(() => {
    const to = isoToday();
    return { from: "2020-01-01", to };
  }, []);

  useEffect(() => {
    getDailyMetricsRange(weightFromTo.from, weightFromTo.to)
      .then((rows) => setWeightRows(rows.map((r) => ({ date: r.date, weight_g: r.weight_g }))))
      .catch(() => {});
  }, [weightFromTo]);

  useEffect(() => {
    if (!selectedExercise) return;
    getExerciseMasterHistory(selectedExercise, exerciseFromTo.from, exerciseFromTo.to)
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

  const suggestions = useMemo(() => {
    const q = exerciseQuery.trim().toLowerCase();
    if (!q) return trackedExercises.slice(0, 8);
    return trackedExercises.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [trackedExercises, exerciseQuery]);

  function ChartShell({
    title,
    subtitle,
    children,
    onOpen,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    onOpen: () => void;
  }) {
    return (
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{title}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
          >
            Zoom
          </button>
        </div>

        <div className="mt-6 h-56">{children}</div>
      </GlassCard>
    );
  }

  function Modal({
    open,
    onClose,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) {
    if (!open) return null;
    const mobile = isMobile();

    return (
      <div className="fixed inset-0 z-[90]">
        <button type="button" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-label="Fermer" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="glass-card border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  {mobile ? "MODE PAYSAGE (SIMULÉ)" : "ZOOM"}
                </p>
                <button onClick={onClose} className="text-white/40 font-black text-[10px] uppercase tracking-widest">
                  Fermer
                </button>
              </div>

              <div className="p-4 bg-black">
                <div
                  className="w-full h-[70vh]"
                  style={mobile ? { transform: "rotate(90deg)", transformOrigin: "center", height: "70vw" } : undefined}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const exerciseSubtitle = pdcMode === "LEST" ? "PDC+ = LEST (KG)" : "PDC+ = TOTAL (PDC + LEST)";

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32 space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Dashboard</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">Charts</p>
      </header>

      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Exercice</p>

        <input
          value={exerciseQuery}
          onChange={(e) => setExerciseQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-black uppercase italic text-white outline-none focus:border-menthe"
        />

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSelectedExercise(name);
                  setExerciseQuery(name);
                }}
                className={`w-full text-left bg-white/5 border border-white/10 rounded-2xl px-4 py-3 font-black uppercase italic text-xs ${
                  name === selectedExercise ? "border-menthe/40 text-menthe" : "text-white/70"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex bg-white/5 rounded-2xl p-1">
          {(["LEST", "TOTAL"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPdcMode(m)}
              className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] tracking-widest ${
                pdcMode === m ? "bg-menthe text-black" : "text-white/30"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </GlassCard>

      <ChartShell title={selectedExercise || "Exercice"} subtitle={exerciseSubtitle} onOpen={() => setModal("exercise")}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exerciseChartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <Tooltip
              contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
              labelStyle={{ color: "rgba(255,255,255,0.7)", fontWeight: 900 }}
              itemStyle={{ color: "#00FFA3", fontWeight: 900 }}
            />
            <Line type="monotone" dataKey="valueKg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Poids</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">Range</p>
          </div>
          <button
            type="button"
            onClick={() => setModal("weight")}
            className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
          >
            Zoom
          </button>
        </div>

        <div className="mt-4 flex bg-white/5 rounded-2xl p-1">
          {(["3M", "6M", "ALL"] as const).map((r) => (
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

        <div className="mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightChartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
              <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
              <Tooltip
                contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
                labelStyle={{ color: "rgba(255,255,255,0.7)", fontWeight: 900 }}
                itemStyle={{ color: "#00FFA3", fontWeight: 900 }}
              />
              <Line type="monotone" dataKey="kg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <Modal open={modal === "exercise"} onClose={() => setModal(null)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exerciseChartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <Tooltip
              contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
              labelStyle={{ color: "rgba(255,255,255,0.7)", fontWeight: 900 }}
              itemStyle={{ color: "#00FFA3", fontWeight: 900 }}
            />
            <Line type="monotone" dataKey="valueKg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Modal>

      <Modal open={modal === "weight"} onClose={() => setModal(null)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightChartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 10, fontWeight: 800 }} />
            <Tooltip
              contentStyle={{ background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
              labelStyle={{ color: "rgba(255,255,255,0.7)", fontWeight: 900 }}
              itemStyle={{ color: "#00FFA3", fontWeight: 900 }}
            />
            <Line type="monotone" dataKey="kg" stroke="#00FFA3" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Modal>
    </div>
  );
}
