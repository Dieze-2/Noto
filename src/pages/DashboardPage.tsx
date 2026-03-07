import { useEffect, useMemo, useRef, useState } from "react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange, getFirstWeightDate } from "../db/dailyMetrics";
import {
  getExerciseMasterHistory,
  listTrackedExercises,
  getFirstExerciseDate,
} from "../db/workouts";
import type { ExerciseMasterPoint } from "../db/workouts";
import { format, subMonths } from "date-fns";
import UPlotLineChart from "../components/UPlotLineChart";

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
function isoToTs(iso: string) {
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
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          !checked ? "text-menthe" : "text-white/30"
        }`}
      >
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

      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          checked ? "text-menthe" : "text-white/30"
        }`}
      >
        {rightLabel}
      </span>
    </div>
  );
}

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
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Fermer"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div className="glass-card border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                {title}
              </p>
              <button
                onClick={onClose}
                className="text-white/40 font-black text-[10px] uppercase tracking-widest"
              >
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

function useElementWidth(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const next = Math.floor(el.clientWidth);
      if (next > 0) setWidth(next);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    measure();
    requestAnimationFrame(measure);
    setTimeout(measure, 50);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, width };
}

type UDatum = { x: number; y: number };

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

  const weightBox = useElementWidth();
  const exerciseBox = useElementWidth();
  const weightZoomBox = useElementWidth([modal === "weight"]);
  const exerciseZoomBox = useElementWidth([modal === "exercise"]);

  useEffect(() => {
    listTrackedExercises()
      .then((names) => setTrackedExercises(names))
      .catch(() => setTrackedExercises([]));
  }, []);

  useEffect(() => {
    getFirstWeightDate()
      .then(setFirstWeightDate)
      .catch(() => setFirstWeightDate(null));
  }, []);

  useEffect(() => {
    if (!selectedExercise) {
      setFirstExerciseDate(null);
      return;
    }
    const name = selectedExercise.trim();
    getFirstExerciseDate(name)
      .then(setFirstExerciseDate)
      .catch(() => setFirstExerciseDate(null));
  }, [selectedExercise]);

  const weightFromTo = useMemo(
    () => rangeToFromTo(weightRange, firstWeightDate),
    [weightRange, firstWeightDate]
  );
  const exerciseFromTo = useMemo(
    () => rangeToFromTo(exerciseRange, firstExerciseDate),
    [exerciseRange, firstExerciseDate]
  );

  const weightFetchFromTo = useMemo(() => {
    let from = weightFromTo.from;
    let to = weightFromTo.to;

    const needsWeightsForTotal =
      pdcMode === "TOTAL" && selectedExercise.trim().length > 0;

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
      .then((rows) =>
        setWeightRows(rows.map((r) => ({ date: r.date, weight_g: r.weight_g })))
      )
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

  const weightData: UDatum[] = useMemo(() => {
    return weightRows
      .filter((r) => r.date >= weightFromTo.from && r.date <= weightFromTo.to)
      .filter((r) => r.weight_g != null)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({ x: isoToTs(r.date), y: (r.weight_g ?? 0) / 1000 }));
  }, [weightRows, weightFromTo.from, weightFromTo.to]);

  const exerciseData: UDatum[] = useMemo(() => {
    const byDay = new Map<string, ExerciseMasterPoint[]>();
    for (const r of exerciseRows) {
      const arr = byDay.get(r.date) ?? [];
      arr.push(r);
      byDay.set(r.date, arr);
    }

    const pts: { date: string; y: number }[] = [];

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
      pts.push({ date, y: Math.max(...vals) });
    }

    return pts
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ x: isoToTs(p.date), y: p.y }));
  }, [exerciseRows, pdcMode, weightLookup]);

  const hasWeightData = weightData.length > 0;
  const hasExercise = selectedExercise.trim().length > 0;
  const hasExerciseData = exerciseData.length > 0;

  const wSmall = Math.max(weightBox.width, 320);
  const eSmall = Math.max(exerciseBox.width, 320);
  const wZoom = Math.max(weightZoomBox.width, 320);
  const eZoom = Math.max(exerciseZoomBox.width, 320);

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32 space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">
          Tableau de bord
        </h1>
      </header>

      {/* POIDS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              Poids
            </h2>
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

        <div className="mt-6 w-full min-w-0" ref={weightBox.ref}>
          <div className="w-full min-w-0">
            {hasWeightData ? (
              <UPlotLineChart
                data={weightData}
                width={wSmall}
                height={220}
                tooltipLabel="kg"
                series={{
                  label: "Poids",
                  stroke: "#00FFA3",
                  width: 3,
                  valueFormatter: (v) => v.toFixed(1),
                }}
              />
            ) : (
              <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                PAS DE DONNÉES POIDS
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* EXERCICE SETTINGS */}
      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
          Exercice
        </p>

        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-black border border-menthe/60 rounded-2xl px-4 py-4 font-black uppercase italic text-white outline-none focus:border-menthe"
        >
          <option value="">—</option>
          {trackedExercises.map((n) => (
            <option key={n} value={n} style={{ color: "#000000", backgroundColor: "#ffffff" }}>
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

        <div className="bg-white/5 rounded-2xl p-4 relative space-y-4">
          <div className="flex items-center justify-between gap-4">
            <ToggleSwitch
              checked={pdcMode === "TOTAL"}
              onChange={(checked) => setPdcMode(checked ? "TOTAL" : "LEST")}
              leftLabel="CHARGE"
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
                  ? "CHARGE = UNIQUEMENT LA CHARGE PORTÉE OU FIXÉE SUR UNE BARRE"
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
          <GlassCard
            ref={exerciseBox.ref as any}
            className="p-6 rounded-[2.5rem] border border-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  {selectedExercise.trim()}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
                  {pdcMode === "LEST"
                    ? "PDC+ = CHARGE (KG)"
                    : "PDC+ = TOTAL (PDC + CHARGE)"}
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
        
            <div className="mt-6 w-full min-w-0">
              <div className="w-full min-w-0">
                {hasExerciseData ? (
                  <UPlotLineChart
                    data={exerciseData}
                    // p-6 => 24px * 2 = 48px (on enlève le padding pour width réelle du plot)
                    width={Math.max((exerciseBox.width || 0) - 48, 320)}
                    height={220}
                    tooltipLabel="kg"
                    series={{
                      label: "Exercice",
                      stroke: "#00FFA3",
                      width: 3,
                      valueFormatter: (v) => v.toFixed(1),
                    }}
                  />
                ) : (
                  <div className="h-[220px] w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                    PAS ASSEZ DE DONNÉES
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        )}

      {/* ZOOM WEIGHT */}
      <Modal open={modal === "weight"} onClose={() => setModal(null)} title="ZOOM">
        <div className="w-full h-full" ref={weightZoomBox.ref}>
          <UPlotLineChart
            data={weightData}
            width={wZoom}
            height={420}
            yLabel="KG"
            tooltipLabel="kg"
            series={{
              label: "Poids",
              stroke: "#00FFA3",
              width: 3,
              valueFormatter: (v) => v.toFixed(1),
            }}
          />
        </div>
      </Modal>

      {/* ZOOM EXERCISE */}
      <Modal open={modal === "exercise"} onClose={() => setModal(null)} title="ZOOM">
        <div className="w-full h-full" ref={exerciseZoomBox.ref}>
          <UPlotLineChart
            data={exerciseData}
            width={eZoom}
            height={420}
            yLabel="KG"
            tooltipLabel="kg"
            series={{
              label: "Exercice",
              stroke: "#00FFA3",
              width: 3,
              valueFormatter: (v) => v.toFixed(1),
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
