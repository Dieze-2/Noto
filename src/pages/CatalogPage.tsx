import { useEffect, useMemo, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const list = await listCatalogExercises();
      setItems(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter(x => x.name.toLowerCase().includes(qq));
  }, [items, q]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20 dark:text-white">
      <header>
        <h1 className="text-2xl font-bold">Catalogue</h1>
      </header>
      <input 
        placeholder="Rechercher..." value={q} onChange={e => setQ(e.target.value)}
        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 outline-none"
      />
      <div className="space-y-3">
        {loading ? <p>Chargement...</p> : filtered.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
            <div className="flex justify-between">
              <span className="font-bold">{item.name}</span>
              {item.youtube_url && <a href={item.youtube_url} className="text-red-500 text-sm">YouTube ↗</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}