import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

const PlayIcon = ({ url }: { url: string }) => (
  <a href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-menthe flex items-center justify-center shadow-lg active:scale-90 transition-transform">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
  </a>
);

export default function CatalogPage() {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listCatalogExercises(search).then(setList);
  }, [search]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <span className="page-subtitle">Base de données</span>
        <h1 className="page-title italic">Exercices</h1>
        <div className="mt-6 glass-card p-2 rounded-full flex items-center px-6 border border-white/10">
          <input placeholder="Chercher un mouvement..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 py-3 text-sm bg-transparent outline-none text-white font-bold" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {list.map(ex => (
          <div key={ex.id} className="glass-card p-5 rounded-[2.5rem] flex items-center justify-between border-b-2 border-white/5">
             <div className="flex items-center gap-4">
               <div className="w-2 h-10 bg-menthe/20 rounded-full"></div>
               <div>
                 <h3 className="font-black text-white text-lg italic uppercase leading-none">{ex.name}</h3>
                 <p className="text-[10px] font-black text-menthe uppercase tracking-[0.2em] mt-1">{ex.note || 'Musculation'}</p>
               </div>
             </div>
             {ex.youtube_url && <PlayIcon url={ex.youtube_url} />}
          </div>
        ))}
      </div>
    </div>
  );
}