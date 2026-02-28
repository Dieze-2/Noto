import { useEffect, useMemo, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    listCatalogExercises().then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((x) => String(x.name).toLowerCase().includes(qq));
  }, [items, q]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-6">
      <header>
        <p className="text-[10px] font-black tracking-widest text-sauge-600 uppercase mb-1">Bibliothèque</p>
        <h1 className="text-3xl font-black text-mineral-900 dark:text-white">Exercices</h1>
      </header>

      <div className="sticky top-4 z-10">
        <div className="glass-card rounded-2xl p-1 shadow-2xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un mouvement..."
            className="w-full bg-transparent p-4 text-sm font-black outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="p-10 text-center animate-pulse text-sauge-600 font-black text-xs uppercase tracking-widest">Initialisation...</div>
        ) : (
          filtered.map((x) => (
            <div key={x.id} className="glass-card p-5 rounded-[2rem] flex justify-between items-center transition-transform hover:scale-[1.01]">
              <span className="font-black text-mineral-800 dark:text-sauge-100">{x.name}</span>
              {x.youtube_url && (
                <a href={x.youtube_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-sauge-100 dark:bg-mineral-800 flex items-center justify-center text-sauge-600">
                  <span className="text-xs">▶</span>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}