import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange } from "../db/events";

function iso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function EventsPage() {
  const [from, setFrom] = useState(() => iso(new Date()));
  const [to, setTo] = useState(() => iso(new Date()));
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#93C5FD");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      // Show events around the chosen window, with some margin
      const events = await getEventsOverlappingRange(from, to);
      setList(events);
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur chargement événements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setMessage(null);
    try {
      if (!title.trim()) throw new Error("Titre requis");
      if (from > to) throw new Error("La date de début doit être <= date de fin");

      await createEvent({
        title: title.trim(),
        start_date: from,
        end_date: to,
        color: color || null,
        note: note.trim() ? note.trim() : null,
      });

      setTitle("");
      setNote("");
      await refresh();
      setMessage("Événement créé ✅");
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur création événement");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Événements (plages)</h1>

      {message && (
        <div style={{ marginTop: 12, background: "#111827", color: "white", padding: 12, borderRadius: 8 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>Créer un événement</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Titre
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Colombie" style={{ padding: 10 }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Début
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 10 }} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Fin
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 10 }} />
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            Couleur
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 40 }} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Note (optionnel)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: 10, minHeight: 70 }} />
          </label>

          <button onClick={handleCreate} style={{ padding: 12 }}>
            Créer
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h2 style={{ margin: "8px 0" }}>Liste (dans la fenêtre sélectionnée)</h2>
        <button onClick={refresh} disabled={loading} style={{ padding: 10 }}>
          {loading ? "..." : "Rafraîchir"}
        </button>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {list.length === 0 ? (
            <div style={{ opacity: 0.75 }}>Aucun événement.</div>
          ) : (
            list.map((ev) => (
              <div
                key={ev.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: `6px solid ${ev.color ?? "#93C5FD"}`,
                }}
              >
                <b>{ev.title}</b>
                <div style={{ opacity: 0.8 }}>
                  {ev.start_date} → {ev.end_date}
                </div>
                {ev.note ? <div style={{ marginTop: 6 }}>{ev.note}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
