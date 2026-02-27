import { useState } from "react";
import Papa from "papaparse";
import { parse } from "date-fns";
import { parseDecimalFlexible, kgToGramsInt } from "../lib/numberFR";
import { upsertDailyMetrics } from "../db/dailyMetrics";
import { addWorkoutExercise, getOrCreateWorkout } from "../db/workouts";

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

  // expected dd/MM/yyyy
  const d = parse(s, "dd/MM/yyyy", new Date());
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIntOrNull(v: any): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0) return null;
  return i;
}

function isPlaceholderText(v: any): boolean {
  const s = String(v ?? "").toLowerCase();
  return s.includes("la moyenne sera") || s.includes("la variation");
}

function parseLoad(chargeRaw: any): { load_type: "PDC" | "PDC_PLUS" | "KG" | "TEXT"; load_g: number | null; load_text: string | null } {
  const s = String(chargeRaw ?? "").trim();
  if (!s) return { load_type: "TEXT", load_g: null, load_text: null };

  const upper = s.toUpperCase().replace(/\s+/g, " ").trim();

  if (upper === "PDC") return { load_type: "PDC", load_g: null, load_text: null };

  // PDC + 10 / PDC+10 / PDC +15
  const pdcPlus = upper.match(/^PDC\s*\+\s*([0-9]+([,.][0-9]+)?)$/);
  if (pdcPlus) {
    const n = parseDecimalFlexible(pdcPlus[1]);
    return { load_type: "PDC_PLUS", load_g: n != null ? kgToGramsInt(n) : null, load_text: null };
  }

  // pure number => KG
  const n = parseDecimalFlexible(s);
  if (n != null) {
    return { load_type: "KG", load_g: kgToGramsInt(n), load_text: null };
  }

  // fallback
  return { load_type: "TEXT", load_g: null, load_text: s };
}

export default function ImportPage() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setReport(null);

    const text = await file.text();

    const parsed = Papa.parse<string[]>(text, {
      skipEmptyLines: true,
    });

    const errors: ImportReport["errors"] = [];

    if (parsed.errors?.length) {
      parsed.errors.forEach((e: Papa.ParseError) => {
		  errors.push({ row: e.row ?? -1, reason: e.message });
    });
	}

    const data = parsed.data as any[];
    const rowsTotal = data.length;

    // Try to find header row by searching "Date" cell
    let headerIndex = -1;
    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i];
      const joined = row.map((x: any) => String(x ?? "")).join("|").toLowerCase();
      if (joined.includes("date") && joined.includes("pas") && joined.includes("kcal")) {
        headerIndex = i;
        break;
      }
    }

    // If no header, assume first row is header
    if (headerIndex === -1) headerIndex = 0;

    const header = (data[headerIndex] ?? []).map((h: any) => String(h ?? "").trim().toUpperCase());
    const body = data.slice(headerIndex + 1);

    // Column index helpers (best effort)
    const idxDate = header.findIndex((h: string) => h === "DATE");
    const idxSteps = header.findIndex((h: string) => h === "PAS");
    const idxKcal = header.findIndex((h: string) => h === "KCAL");
    const idxWeight = header.findIndex((h: string) => h === "POIDS");
    const idxExercise = header.findIndex((h: string) => h === "EXERCICE");
    const idxCharge = header.findIndex((h: string) => h === "CHARGE");
    const idxReps = header.findIndex((h: string) => h === "REPS");

    let rowsWithDate = 0;
    let metricsUpserted = 0;
    let exercisesInserted = 0;
    let skipped = 0;

    try {
      for (let i = 0; i < body.length; i++) {
        const row = body[i];

        const dateRaw = idxDate >= 0 ? row[idxDate] : row[0];
        const dateISO = parseFRDateToISO(dateRaw);

        if (!dateISO) {
          skipped++;
          continue;
        }
        rowsWithDate++;

        // read values
        const stepsRaw = idxSteps >= 0 ? row[idxSteps] : null;
        const kcalRaw = idxKcal >= 0 ? row[idxKcal] : null;
        const weightRaw = idxWeight >= 0 ? row[idxWeight] : null;

        const exerciseRaw = idxExercise >= 0 ? row[idxExercise] : null;
        const chargeRaw = idxCharge >= 0 ? row[idxCharge] : null;
        const repsRaw = idxReps >= 0 ? row[idxReps] : null;

        // ignore placeholders
        if (isPlaceholderText(stepsRaw) || isPlaceholderText(kcalRaw) || isPlaceholderText(weightRaw)) {
          skipped++;
          continue;
        }

        // Metrics
        const steps = toIntOrNull(stepsRaw);
        const kcal = toIntOrNull(kcalRaw);

        let weight_g: number | null = null;
        const w = parseDecimalFlexible(String(weightRaw ?? ""));
        if (w != null) weight_g = kgToGramsInt(w);

        const hasAnyMetric = steps != null || kcal != null || weight_g != null;

        if (hasAnyMetric) {
          await upsertDailyMetrics({
            date: dateISO,
            steps,
            kcal,
            weight_g,
            note: null,
          });
          metricsUpserted++;
        }

        // Exercise row
        const exName = String(exerciseRaw ?? "").trim();
        if (exName) {
          const workout = await getOrCreateWorkout(dateISO);
          const parsedLoad = parseLoad(chargeRaw);
          const reps = toIntOrNull(repsRaw);

          await addWorkoutExercise({
            workout_id: workout.id,
            exercise_name: exName,
            load_type: parsedLoad.load_type,
            load_g: parsedLoad.load_g,
            load_text: parsedLoad.load_text,
            reps,
            comment: null, // CSV comment not reliably mapped in MVP
          });

          exercisesInserted++;
        }
      }
    } catch (e: any) {
      errors.push({ row: -1, reason: e?.message ?? "Erreur import" });
    }

    setReport({
      rowsTotal,
      rowsWithDate,
      metricsUpserted,
      exercisesInserted,
      skipped,
      errors,
    });

    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Import CSV</h1>
      <p>Importe ton export Google Sheets. On recalcule les moyennes ensuite dans l’app.</p>

      <input
        type="file"
        accept=".csv,text/csv"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {busy && <div style={{ marginTop: 12 }}>Import en cours…</div>}

      {report && (
        <div style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Rapport</h2>
          <ul>
            <li>Total lignes lues : <b>{report.rowsTotal}</b></li>
            <li>Lignes avec date : <b>{report.rowsWithDate}</b></li>
            <li>Jours (metrics) upsert : <b>{report.metricsUpserted}</b></li>
            <li>Exercices insérés : <b>{report.exercisesInserted}</b></li>
            <li>Lignes ignorées : <b>{report.skipped}</b></li>
          </ul>

          {report.errors.length > 0 && (
            <>
              <h3>Erreurs</h3>
              <ul>
                {report.errors.slice(0, 20).map((e, idx) => (
                  <li key={idx}>Ligne {e.row}: {e.reason}</li>
                ))}
              </ul>
              {report.errors.length > 20 && <div>…{report.errors.length - 20} erreurs supplémentaires</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
