import { useState } from "react";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";

function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2026-12-31");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setMessage(null);
    try {
      const rows = await getDailyMetricsRange(from, to);

      // CSV with ; separator and FR decimals (comma)
      const header = ["date", "steps", "kcal", "weight_kg", "note"].join(";");
      const lines = rows.map((r) => {
        const weight = r.weight_g != null ? formatKgFR(gramsToKg(r.weight_g), 1) : "";
        const note = (r.note ?? "").replaceAll("\n", " ").replaceAll(";", ",");
        return [r.date, r.steps ?? "", r.kcal ?? "", weight, note].join(";");
      });

      const csv = [header, ...lines].join("\n");
      download(`journal_export_${from}_to_${to}.csv`, csv);
      setMessage(`Export CSV OK (${rows.length} lignes) ✅`);
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur export");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Export CSV</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Début
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 10 }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Fin
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 10 }} />
        </label>

        <button onClick={handleExport} disabled={busy} style={{ padding: 12 }}>
          {busy ? "Export…" : "Télécharger CSV"}
        </button>
		<a
		  href={`/print?from=${from}&to=${to}`}
		  target="_blank"
		  rel="noreferrer"
		  style={{
			display: "inline-block",
			padding: 12,
			border: "1px solid #e5e7eb",
			borderRadius: 8,
			textDecoration: "none",
		  }}
		>
		  Ouvrir la page PDF (impression)
		</a>

        {message && (
          <div style={{ background: "#111827", color: "white", padding: 12, borderRadius: 8 }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
