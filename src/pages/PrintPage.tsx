import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg } from "../lib/numberFR";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function PrintPage() {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => { getDailyMetricsRange(from, to).then(setRows); }, [from, to]);

  return (
    <div className="p-8 bg-white min-h-screen text-slate-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; background: white !important; color: black !important; }
          .glass-card, .neo-glass { border: 1px solid #eee !important; background: transparent !important; }
        }
      `}</style>

      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Journal Noto</h1>
          <p className="text-slate-500">Rapport du {from} au {to}</p>
        </div>
        <button onClick={() => window.print()} className="no-print bg-slate-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase">Imprimer</button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left text-xs uppercase">Date</th>
            <th className="border p-2 text-center text-xs uppercase">Poids</th>
            <th className="border p-2 text-center text-xs uppercase">Pas</th>
            <th className="border p-2 text-center text-xs uppercase">Kcal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="odd:bg-white even:bg-slate-50">
              <td className="border p-2 text-sm font-medium">{format(parseISO(r.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td className="border p-2 text-center text-sm">{r.weight_g ? `${formatKgFR(gramsToKg(r.weight_g), 1)}` : "—"}</td>
              <td className="border p-2 text-center text-sm">{r.steps?.toLocaleString('fr-FR') ?? "—"}</td>
              <td className="border p-2 text-center text-sm">{r.kcal?.toLocaleString('fr-FR') ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}