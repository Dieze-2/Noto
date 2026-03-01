import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNote, setShowNote] = useState<string | null>(null);

  useEffect(() => { listCatalogExercises().then(data => { setAllExercises(data); setFiltered(data); }); }, []);
  useEffect(() => { setFiltered(allExercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))); }, [search, allExercises]);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter text-center mb-10">Catalogue</h1>
        <input placeholder="CHERCHER..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full neo-glass bg-white/5 p-4 mt-6 outline-none font-black italic uppercase" />
      </header>

      <div className="space-y-4">
        {filtered.map(ex => (
          <div key={ex.id} className="neo-glass overflow-hidden">
             <div className="p-6 flex items-center justify-between">
               <h3 className="font-black text-xl italic uppercase">{ex.name}</h3>
               <div className="flex gap-2">
                 {ex.note && <button onClick={() => setShowNote(showNote === ex.id ? null : ex.id)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black">NOTE</button>}
                 {ex.youtube_url && <a href={ex.youtube_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-menthe flex items-center justify-center shadow-lg">▶</a>}
               </div>
             </div>
             {showNote === ex.id && <div className="px-6 pb-6 text-xs text-white/60 font-medium leading-relaxed uppercase tracking-wider">{ex.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}