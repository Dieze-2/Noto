import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  useEffect(() => {
    listCatalogExercises(search).then(setList);
  }, [search]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <span className="page-subtitle">Base de données</span>
        <h1 className="page-title italic">Exercices</h1>
        <div className="mt-6 glass-card p-2 rounded-full px-6">
          <input placeholder="Chercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full py-3 bg-transparent text-white font-bold outline-none" />
        </div>
      </header>

      <div className="space-y-4">
        {list.map(ex => (
          <div key={ex.id} className="glass-card rounded-[2rem] overflow-hidden transition-all duration-500">
             <div className="p-5 flex items-center justify-between">
               <div className="flex-1">
                 <h3 className="font-black text-white text-lg italic uppercase">{ex.name}</h3>
               </div>
               <div className="flex gap-2">
                 {ex.note && (
                   <button 
                    onClick={() => setExpandedNote(expandedNote === ex.id ? null : ex.id)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tighter"
                   >Note</button>
                 )}
                 {ex.youtube_url && (
                    <a href={ex.youtube_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-menthe flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
                    </a>
                 )}
               </div>
             </div>
             {/* Note avec fondu et agrandissement */}
             {expandedNote === ex.id && (
               <div className="px-6 pb-6 animate-in fade-in zoom-in duration-300">
                 <div className="h-px bg-white/10 mb-4" />
                 <p className="text-xs text-menthe/80 font-medium leading-relaxed italic">{ex.note}</p>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}