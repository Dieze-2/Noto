import { useState } from "react";
import Papa from "papaparse";
import { parse } from "date-fns";
import { parseDecimalFlexible, kgToGramsInt } from "../lib/numberFR";
import { upsertDailyMetrics } from "../db/dailyMetrics";
import { addWorkoutExercise, getOrCreateWorkout, getWorkoutExercises } from "../db/workouts";

type ImportReport = {
  rowsTotal: number;
  rowsWithDate: number;
  metricsUpserted: number;
  exercisesInserted: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

function parseFRDateToISO(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  const d = parse(s, "dd/MM/yyyy", new Date());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function toIntOrNull(v: any): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = parseInt(s.replace(/\s/g, ''));
  return isNaN(n) || n < 0 ? null : n;
}

function isPlaceholderText(v: any): boolean {
  const s = String(v ?? "").toLowerCase();
  return s.includes("moyenne") || s.includes("variation") || s.includes("automatique");
}

function parseLoad(chargeRaw: any): { load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT"; load_g: number | null; load_text: string | null } {
  const s = String(chargeRaw ?? "").trim();
  if (!s) return { load_type: "PDC", load_g: null, load_text: null };
  const upper = s.toUpperCase().replace(/\s+/g, "");

  if (upper === "PDC") return { load_type: "PDC", load_g: null, load_text: null };

  const pdcPlus = s.toUpperCase().match(/PDC\s*\+\s*([0-9]+([,.][0-9]+)?)/);
  if (pdcPlus) {
    const n = parseDecimalFlexible(pdcPlus[1]);
    return { load_type: "PDC_PLUS", load_g: n != null ? kgToGramsInt(n) : null, load_text: null };
  }

  const n = parseDecimalFlexible(s);
  if (n != null) return { load_type: "KG", load_g: kgToGramsInt(n), load_text: null };

  return { load_type: "TEXT", load_g: null, load_text: s };
}

export default function ImportPage() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    setBusy(true);
    setReport(null);
    setProgress(0);

    const text = await file.text();
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const errors: ImportReport["errors"] = [];
    const data = parsed.data;
    
    let headerIndex = data.findIndex(row => {
      const line = row.join("|").toLowerCase();
      return line.includes("date") && line.includes("pas");
    });
    if (headerIndex === -1) headerIndex = 0;

    const header = data[headerIndex].map(h => String(h).trim().toUpperCase());
    const body = data.slice(headerIndex + 1);

    const idx = {
      date: header.indexOf("DATE"),
      steps: header.indexOf("PAS"),
      kcal: header.indexOf("KCAL"),
      weight: header.indexOf("POIDS"),
      ex: header.indexOf("EXERCICE"),
      load: header.indexOf("CHARGE"),
      reps: header.indexOf("REPS")
    };

    let metricsUpserted = 0, exercisesInserted = 0, skipped = 0, rowsWithDate = 0;

    for (let i = 0; i < body.length; i++) {
      try {
        const row = body[i];
        const dateISO = parseFRDateToISO(row[idx.date] || row[0]);
        if (!dateISO) { skipped++; continue; }
        rowsWithDate++;

        const steps = toIntOrNull(row[idx.steps]);
        const kcal = toIntOrNull(row[idx.kcal]);
        const wVal = parseDecimalFlexible(row[idx.weight]);
        const weight_g = wVal ? kgToGramsInt(wVal) : null;

        if (!isPlaceholderText(row[idx.steps]) && (steps || kcal || weight_g)) {
          await upsertDailyMetrics({ date: dateISO, steps, kcal, weight_g, note: null });
          metricsUpserted++;
        }

        const exName = String(row[idx.ex] || "").trim();
        if (exName && !isPlaceholderText(exName)) {
          const workout = await getOrCreateWorkout(dateISO);
          const pLoad = parseLoad(row[idx.load]);
          const reps = toIntOrNull(row[idx.reps]);

          // Simple de-duplication: check if already exists for this workout
          const existing = await getWorkoutExercises(workout.id);
          const isDuplicate = existing.some(e => e.exercise_name === exName && e.reps === reps && e.load_g === pLoad.load_g);
          
          if (!isDuplicate) {
            await addWorkoutExercise({
              workout_id: workout.id, exercise_name: exName,
              load_type: pLoad.load_type, load_g: pLoad.load_g,
              load_text: pLoad.load_text, reps, sort_order: existing.length
            });
            exercisesInserted++;
          }
        }
      } catch (e: any) {
        errors.push({ row: i + headerIndex + 2, reason: e.message });
      }
      setProgress(Math.round(((i + 1) / body.length) * 100));
    }

    setReport({ rowsTotal: data.length, rowsWithDate, metricsUpserted, exercisesInserted, skipped, errors });
    setBusy(false);
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Import CSV</h1>
        <p className="text-slate-500 text-sm">Sélectionne ton export Google Sheets (format date JJ/MM/AAAA).</p>
      </header>

      <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${busy ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200 hover:border-blue-400'}`}>
        <input
          type="file" accept=".csv" disabled={busy}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="font-medium text-slate-700">{busy ? `Importation... ${progress}%` : "Clique ou glisse ton fichier CSV ici"}</p>
        </div>
        {busy && (
          <div className="mt-4 w-full bg-slate-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      {report && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">✅ Import terminé</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-slate-500 uppercase text-[10px] font-bold">Lignes lues</div>
              <div className="text-lg font-bold">{report.rowsTotal}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-slate-500 uppercase text-[10px] font-bold">Métriques</div>
              <div className="text-lg font-bold text-emerald-600">+{report.metricsUpserted}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-slate-500 uppercase text-[10px] font-bold">Exercices</div>
              <div className="text-lg font-bold text-blue-600">+{report.exercisesInserted}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-slate-500 uppercase text-[10px] font-bold">Ignorées</div>
              <div className="text-lg font-bold text-slate-400">{report.skipped}</div>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 max-h-40 overflow-y-auto">
              <p className="font-bold mb-1 underline">Erreurs ({report.errors.length}) :</p>
              {report.errors.slice(0, 10).map((e, i) => <div key={i}>Ligne {e.row}: {e.reason}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}