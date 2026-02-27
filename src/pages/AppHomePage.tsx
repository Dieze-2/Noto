import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getDailyMetricsByDate, upsertDailyMetrics } from "../db/dailyMetrics";
import { formatKgFR, gramsToKg, kgToGramsInt, parseDecimalFlexible } from "../lib/numberFR";
import {
  addWorkoutExercise,
  getOrCreateWorkout,
  getWorkoutExercises,
} from "../db/workouts";
import type {WorkoutExerciseRow} from "../db/workouts";
import { listCatalogExercises } from "../db/catalog";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type LoadType = "PDC" | "PDC_PLUS" | "KG" | "TEXT";

export default function TodayPage() {
  const date = useMemo(() => todayISO(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Metrics form (strings for UX)
  const [stepsStr, setStepsStr] = useState("");
  const [kcalStr, setKcalStr] = useState("");
  const [weightKgStr, setWeightKgStr] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // Workout
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);

  // Catalog for autocomplete
  const [catalog, setCatalog] = useState<{ id: string; name: string; youtube_url?: string | null }[]>([]);

  // Add exercise form
  const [exName, setExName] = useState("");
  const [loadType, setLoadType] = useState<LoadType>("PDC");
  const [loadStr, setLoadStr] = useState(""); // kg or free text
  const [repsStr, setRepsStr] = useState("");
  const [exComment, setExComment] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setMessage(null);

      try {
        // 1) Metrics
        const row = await getDailyMetricsByDate(date);
        if (!mounted) return;

        setStepsStr(row?.steps != null ? String(row.steps) : "");
        setKcalStr(row?.kcal != null ? String(row.kcal) : "");
        setWeightKgStr(row?.weight_g != null ? formatKgFR(gramsToKg(row.weight_g), 1) : "");
        setNote(row?.note ?? "");

        // 2) Workout for the date (MVP: 1 workout/day)
        const w = await getOrCreateWorkout(date);
        setWorkoutId(w.id);

        // 3) Exercises list
        const list = await getWorkoutExercises(w.id);
        setExercises(list);

        // 4) Catalog for autocomplete
        const cat = await listCatalogExercises();
        setCatalog(cat.map((c) => ({ id: c.id, name: c.name, youtube_url: c.youtube_url })));
      } catch (e: any) {
        setMessage(e?.message ?? "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [date]);

  function parseIntOrNull(s: string): number | null {
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isInteger(n)) return null;
    if (n < 0) return null;
    return n;
  }

  async function handleSaveMetrics() {
    setSaving(true);
    setMessage(null);

    try {
      const steps = parseIntOrNull(stepsStr);
      const kcal = parseIntOrNull(kcalStr);

      let weight_g: number | null = null;
      const w = parseDecimalFlexible(weightKgStr);
      if (w != null) {
        if (w <= 0) throw new Error("Poids invalide");
        weight_g = kgToGramsInt(w);
      }

      await upsertDailyMetrics({
        date,
        steps,
        kcal,
        weight_g,
        note: note.trim() ? note.trim() : null,
      });

      setMessage("Enregistré ✅");
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExercise() {
    if (!workoutId) return;
    setMessage(null);

    try {
      const reps = parseIntOrNull(repsStr);

      let load_g: number | null = null;
      let load_text: string | null = null;

      if (loadType === "KG" || loadType === "PDC_PLUS") {
        const n = parseDecimalFlexible(loadStr);
        if (n == null) {
          load_g = null;
        } else {
          if (n < 0) throw new Error("Charge invalide");
          load_g = kgToGramsInt(n);
        }
      } else if (loadType === "TEXT") {
        load_text = loadStr.trim() ? loadStr.trim() : null;
      }

      if (!exName.trim()) throw new Error("Nom d'exercice requis");

      await addWorkoutExercise({
        workout_id: workoutId,
        exercise_name: exName.trim(),
        load_type: loadType,
        load_g,
        load_text,
        reps,
        comment: exComment.trim() ? exComment.trim() : null,
      });

      const list = await getWorkoutExercises(workoutId);
      setExercises(list);

      // reset add form
      setExName("");
      setLoadType("PDC");
      setLoadStr("");
      setRepsStr("");
      setExComment("");

      setMessage("Exercice ajouté ✅");
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur ajout exercice");
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Aujourd’hui</h1>
          <div style={{ opacity: 0.8 }}>{date}</div>
        </div>

        <button onClick={() => supabase.auth.signOut()} style={{ padding: 10 }}>
          Se déconnecter
        </button>
      </header>

      {message && (
        <div style={{ marginTop: 12, background: "#111827", color: "white", padding: 12, borderRadius: 8 }}>
          {message}
        </div>
      )}

      {/* Journal */}
      <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Journal</h2>

        <label style={{ display: "grid", gap: 6 }}>
          PAS (entier)
          <input
            inputMode="numeric"
            value={stepsStr}
            onChange={(e) => setStepsStr(e.target.value)}
            placeholder="ex: 12000"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          KCAL (entier)
          <input
            inputMode="numeric"
            value={kcalStr}
            onChange={(e) => setKcalStr(e.target.value)}
            placeholder="ex: 1850"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          POIDS (kg)
          <input
            inputMode="decimal"
            value={weightKgStr}
            onChange={(e) => setWeightKgStr(e.target.value)}
            placeholder="ex: 72,5"
            style={{ padding: 10 }}
          />
          <small style={{ opacity: 0.75 }}>Virgule ou point acceptés. Stockage en grammes.</small>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Note (optionnel)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex: Colombie, mini-cut…"
            style={{ padding: 10, minHeight: 80 }}
          />
        </label>

        <button onClick={handleSaveMetrics} disabled={saving} style={{ padding: 12 }}>
          {saving ? "Enregistrement…" : "Enregistrer (journal)"}
        </button>
      </section>

      <hr style={{ margin: "24px 0" }} />

      {/* Workout */}
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Entraînement</h2>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Exercice (autocomplete)
              <input
                list="exercise-list"
                value={exName}
                onChange={(e) => setExName(e.target.value)}
                placeholder="ex: TRACTIONS"
                style={{ padding: 10 }}
              />
              <datalist id="exercise-list">
                {catalog.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Type charge
              <select value={loadType} onChange={(e) => setLoadType(e.target.value as LoadType)} style={{ padding: 10 }}>
                <option value="PDC">PDC</option>
                <option value="PDC_PLUS">PDC +</option>
                <option value="KG">KG</option>
                <option value="TEXT">Texte</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Charge (kg) ou texte
              <input
                value={loadStr}
                onChange={(e) => setLoadStr(e.target.value)}
                placeholder={loadType === "TEXT" ? "ex: PDC + 15" : "ex: 17,5"}
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Reps (entier)
              <input
                inputMode="numeric"
                value={repsStr}
                onChange={(e) => setRepsStr(e.target.value)}
                placeholder="ex: 10"
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Commentaire (séries)
              <textarea
                value={exComment}
                onChange={(e) => setExComment(e.target.value)}
                placeholder="ex: 4x8, 3x12…"
                style={{ padding: 10, minHeight: 70 }}
              />
            </label>

            <button onClick={handleAddExercise} style={{ padding: 12 }}>
              Ajouter l’exercice
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ margin: "8px 0" }}>Exercices du jour</h3>
          {exercises.length === 0 ? (
            <div style={{ opacity: 0.75 }}>Aucun exercice.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {exercises.map((ex) => (
                <div key={ex.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                  <b>{ex.exercise_name}</b>

                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    {renderLoad(ex)}
                    {ex.reps != null ? ` — ${ex.reps} reps` : ""}
                  </div>

                  {ex.comment ? <div style={{ marginTop: 6 }}>{ex.comment}</div> : null}

                  {/* Bonus: if exercise exists in catalog, show quick YouTube link */}
                  {renderYoutubeLink(ex.exercise_name, catalog)}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function renderLoad(ex: WorkoutExerciseRow): string {
  if (ex.load_type === "PDC") return "Charge: PDC";
  if (ex.load_type === "PDC_PLUS") {
    return `Charge: PDC + ${ex.load_g != null ? formatKgFR(gramsToKg(ex.load_g), 1) + " kg" : "?"}`;
  }
  if (ex.load_type === "KG") {
    return `Charge: ${ex.load_g != null ? formatKgFR(gramsToKg(ex.load_g), 1) + " kg" : "?"}`;
  }
  return `Charge: ${ex.load_text ?? "-"}`;
}

function renderYoutubeLink(
  exerciseName: string,
  catalog: { name: string; youtube_url?: string | null }[]
) {
  const found = catalog.find((c) => c.name.toLowerCase() === exerciseName.toLowerCase());
  if (!found?.youtube_url) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <a href={found.youtube_url} target="_blank" rel="noreferrer">
        Voir sur YouTube
      </a>
    </div>
  );
}
