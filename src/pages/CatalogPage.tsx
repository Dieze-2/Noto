import { useEffect, useMemo, useState } from "react";
import { listCatalogExercises, updateCatalogExercise } from "../db/catalog"; // Assure-toi que update existe

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
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Catalogue</h1>
        <p className="text-slate-500 text-sm">Gère tes exercices et liens techniques.</p>
      </header>

      <div className="sticky top-0 bg-slate-50/80 backdrop-blur-md py-2">
        <input 
          placeholder="Rechercher un exercice..." 
          value={q} onChange={e => setQ(e.target.value)}
          className="w-full p-3 rounded-xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Chargement...</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800">{item.name}</span>
                {item.youtube_url && (
                  <a href={item.youtube_url} target="_blank" rel="noreferrer" className="text-red-600 text-sm font-medium">
                    YouTube ↗
                  </a>
                )}
              </div>
              {item.note && <p className="text-xs text-slate-500 italic">{item.note}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}