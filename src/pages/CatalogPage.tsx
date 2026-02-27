import { useEffect, useMemo, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      const list = await listCatalogExercises();
      setItems(list);
    } catch (e: any) {
      setMessage(e?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((x) => String(x.name).toLowerCase().includes(qq));
  }, [items, q]);

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Catalogue exercices</h1>

      {message && (
        <div style={{ marginTop: 12, background: "#111827", color: "white", padding: 12, borderRadius: 8 }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Recherche
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex: traction" style={{ padding: 10 }} />
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div>Chargement…</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((x: any) => (
              <div key={x.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                <b>{x.name}</b>

                {x.youtube_url ? (
                  <div style={{ marginTop: 6 }}>
                    <a href={x.youtube_url} target="_blank" rel="noreferrer">
                      Voir sur YouTube
                    </a>
                  </div>
                ) : null}

                {x.note ? <div style={{ marginTop: 8, opacity: 0.9 }}>{x.note}</div> : null}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ opacity: 0.75 }}>Aucun résultat.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
