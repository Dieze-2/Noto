import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { getEventsOverlappingRange } from "../db/events";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { weekDays, isoDate } from "../lib/week";

type WeekStats = {
  avgSteps: number | null;
  avgKcal: number | null;
  avgWeightG: number | null;
};

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function roundInt(n: number): number {
  return Math.round(n);
}

export default function WeekPage() {
  const [anchor, setAnchor] = useState(() => new Date()); // date within week
  const { start, days } = useMemo(() => weekDays(anchor), [anchor]);

  const fromISO = isoDate(days[0]);
  const toISO = isoDate(days[6]);

  const prevFromISO = isoDate(addDays(days[0], -7));
  const prevToISO = isoDate(addDays(days[6], -7));

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [prevRows, setPrevRows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const [r, pr, ev] = await Promise.all([
          getDailyMetricsRange(fromISO, toISO),
          getDailyMetricsRange(prevFromISO, prevToISO),
          getEventsOverlappingRange(fromISO, toISO),
        ]);

        if (!mounted) return;
        setRows(r);
        setPrevRows(pr);
        setEvents(ev);
      } catch (e: any) {
        setMessage(e?.message ?? "Erreur de chargement semaine");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [fromISO, toISO, prevFromISO, prevToISO]);

  const stats: WeekStats = useMemo(() => {
    const steps = rows.map((x) => x.steps).filter((v: any) => v != null) as number[];
    const kcal = rows.map((x) => x.kcal).filter((v: any) => v != null) as number[];
    const wg = rows.map((x) => x.weight_g).filter((v: any) => v != null) as number[];

    return {
      avgSteps: average(steps) != null ? roundInt(average(steps)!) : null,
      avgKcal: average(kcal) != null ? roundInt(average(kcal)!) : null,
      avgWeightG: average(wg),
    };
  }, [rows]);

  const prevStats: WeekStats = useMemo(() => {
    const wg = prevRows.map((x) => x.weight_g).filter((v: any) => v != null) as number[];
    return { avgSteps: null, avgKcal: null, avgWeightG: average(wg) };
  }, [prevRows]);

  const weightVariationPct = useMemo(() => {
    if (stats.avgWeightG == null || prevStats.avgWeightG == null) return null;
    if (prevStats.avgWeightG === 0) return null;
    const pct = ((stats.avgWeightG - prevStats.avgWeightG) / prevStats.avgWeightG) * 100;
    return pct;
  }, [stats.avgWeightG, prevStats.avgWeightG]);

  function pctFR(p: number): string {
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p) + " %";
  }

  if (loading) return <div style={{ padding: 20 }}>Chargement…</div>;

  const rowByDate = new Map(rows.map((r) => [r.date, r]));
  const weekTitle = `${format(start, "dd/MM/yyyy")} → ${format(addDays(start, 6), "dd/MM/yyyy")}`;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Semaine</h1>
      <div style={{ opacity: 0.8 }}>{weekTitle}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setAnchor(addDays(anchor, -7))} style={{ padding: 10 }}>
          ← Semaine -1
        </button>
        <button onClick={() => setAnchor(new Date())} style={{ padding: 10 }}>
          Cette semaine
        </button>
        <button onClick={() => setAnchor(addDays(anchor, 7))} style={{ padding: 10 }}>
          Semaine +1 →
        </button>
      </div>

      {message && (
        <div style={{ marginTop: 12, background: "#111827", color: "white", padding: 12, borderRadius: 8 }}>
          {message}
        </div>
      )}

      <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard title="Moyenne PAS" value={stats.avgSteps != null ? String(stats.avgSteps) : "—"} />
          <StatCard title="Moyenne KCAL" value={stats.avgKcal != null ? String(stats.avgKcal) : "—"} />
          <StatCard
            title="Moyenne POIDS"
            value={stats.avgWeightG != null ? formatKgFR(gramsToKg(stats.avgWeightG), 2) + " kg" : "—"}
          />
          <StatCard
            title="Variation poids"
            value={weightVariationPct != null ? pctFR(weightVariationPct) : "—"}
            tone={weightVariationPct == null ? "neutral" : weightVariationPct < 0 ? "good" : "bad"}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <h2 style={{ margin: "8px 0" }}>Événements (plages)</h2>
          {events.length === 0 ? (
            <div style={{ opacity: 0.75 }}>Aucun événement sur cette semaine.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {events.map((ev: any) => (
                <div
                  key={ev.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: 10,
                    borderLeft: `6px solid ${ev.color ?? "#93C5FD"}`,
                    borderRadius: 8,
                  }}
                >
                  <b>{ev.title}</b>{" "}
                  <span style={{ opacity: 0.8 }}>
                    ({format(new Date(ev.start_date), "dd/MM")} → {format(new Date(ev.end_date), "dd/MM")})
                  </span>
                  {ev.note ? <div style={{ marginTop: 4, opacity: 0.85 }}>{ev.note}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <h2 style={{ margin: "8px 0" }}>Jours</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {days.map((d) => {
              const dateISO = isoDate(d);
              const r = rowByDate.get(dateISO);
              return (
                <div key={dateISO} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <b>{format(d, "EEEE dd/MM", { locale: undefined })}</b>
                    <span style={{ opacity: 0.7 }}>{dateISO}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
                    <MiniStat label="PAS" value={r?.steps ?? "—"} />
                    <MiniStat label="KCAL" value={r?.kcal ?? "—"} />
                    <MiniStat
                      label="POIDS"
                      value={r?.weight_g != null ? formatKgFR(gramsToKg(r.weight_g), 1) : "—"}
                      suffix={r?.weight_g != null ? " kg" : ""}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard(props: { title: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const tone = props.tone ?? "neutral";
  const bg = tone === "good" ? "#ECFDF5" : tone === "bad" ? "#FEF2F2" : "#F9FAFB";
  const border = tone === "good" ? "#10B981" : tone === "bad" ? "#EF4444" : "#E5E7EB";

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ opacity: 0.75, fontSize: 12 }}>{props.title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{props.value}</div>
    </div>
  );
}

function MiniStat(props: { label: string; value: any; suffix?: string }) {
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 10 }}>
      <div style={{ opacity: 0.7, fontSize: 12 }}>{props.label}</div>
      <div style={{ marginTop: 4, fontWeight: 700 }}>
        {props.value}
        {props.suffix ?? ""}
      </div>
    </div>
  );
}
