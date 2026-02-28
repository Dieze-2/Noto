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
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-6">
      <header className="px-2">
        <p className="text-xs font-black tracking-[0.2em] text-indigo-500 uppercase mb-1">Bibliothèque</p>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Exercices</h1>
      </header>

      {/* Barre de recherche Glassmorphism */}
      <div className="sticky top-4 z-10 px-2">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl p-1 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un mouvement..."
            className="w-full bg-transparent p-4 text-sm font-medium outline-none dark:text-white"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="p-10 text-center animate-pulse text-slate-400">Chargement du catalogue...</div>
        ) : (
          filtered.map((x) => (
            <div key={x.id} className="group bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center transition-all hover:scale-[1.02]">
              <span className="font-bold text-slate-800 dark:text-slate-200">{x.name}</span>
              {x.youtube_url && (
                <a
                  href={x.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                >
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