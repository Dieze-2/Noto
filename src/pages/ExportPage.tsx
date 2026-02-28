import { useState } from "react";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";

export default function ExportPage() {
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2026-12-31");
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const rows = await getDailyMetricsRange(from, to);
      const header = ["date", "steps", "kcal", "weight_kg", "note"].join(";");
      const lines = rows.map(r => [
        r.date, r.steps ?? "", r.kcal ?? "",
        r.weight_g ? formatKgFR(gramsToKg(r.weight_g), 1) : "",
        (r.note ?? "").replace(/;/g, ",")
      ].join(";"));
      
      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_noto_${from}_${to}.csv`;
      a.click();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Export & Print</h1>
        <p className="text-slate-500 text-sm">Sauvegarde tes données ou prépare un PDF.</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase">Du</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border-b-2 py-1 outline-none" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase">Au</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border-b-2 py-1 outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button onClick={handleExport} disabled={busy} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">
            {busy ? "Génération..." : "📥 Télécharger CSV"}
          </button>
          <a 
            href={`/Noto/print?from=${from}&to=${to}`} target="_blank" rel="noreferrer"
            className="w-full bg-white border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-center"
          >
            🖨️ Aperçu avant impression / PDF
          </a>
        </div>
      </div>
    </div>
  );
}