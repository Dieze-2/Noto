import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

const PlayIcon = ({ url }: { url: string }) => (
  <a href={url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-menthe flex items-center justify-center shadow-lg">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
  </a>
);

export default function CatalogPage() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Filtrage dynamique selon la saisie
    listCatalogExercises(search).then(setList);
  }, [search]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Exercices</h1>
        <div className="mt-6 glass-card p-2 rounded-full flex items-center px-6 border border-white/5">
          <input 
            placeholder="Rechercher un exercice..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="flex-1 py-3 bg-transparent text-white font-bold outline-none" 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {list.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-[2rem] flex items-center justify-between">
             <div>
               <h3 className="font-black text-white text-lg italic uppercase">{ex.name}</h3>
               <p className="text-[10px] font-black text-menthe uppercase tracking-[0.2em] mt-1">{ex.note || 'Musculation'}</p>
             </div>
             {ex.youtube_url && <PlayIcon url={ex.youtube_url} />}
          </div>
        ))}
      </div>
    </div>
  );
}