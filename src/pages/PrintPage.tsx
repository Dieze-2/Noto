import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";

export default function PrintPage() {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "2025-01-01";
  const to = params.get("to") ?? "2026-12-31";

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const r = await getDailyMetricsRange(from, to);
      if (!mounted) return;
      setRows(r);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [from, to]);

  if (loading) return <div style={{ padding: 20 }}>Chargement…</div>;

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @media print {
          button { display: none !important; }
          a { display: none !important; }
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; }
        h1,h2 { margin: 0; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1>Journal de bord</h1>
          <div style={{ opacity: 0.8 }}>{from} → {to}</div>
        </div>
        <button onClick={() => window.print()} style={{ padding: 12 }}>
          Imprimer / PDF
        </button>
      </div>

      <h2 style={{ marginTop: 18 }}>Données</h2>

      <table style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>PAS</th>
            <th>KCAL</th>
            <th>POIDS (kg)</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td>{r.steps ?? ""}</td>
              <td>{r.kcal ?? ""}</td>
              <td>{r.weight_g != null ? formatKgFR(gramsToKg(r.weight_g), 1) : ""}</td>
              <td>{r.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
