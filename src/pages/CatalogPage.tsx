import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

const PlayIcon = () => (
  <div className="w-10 h-10 rounded-full bg-menthe/10 flex items-center justify-center border border-menthe/20 group-hover:bg-menthe group-hover:scale-110 transition-all duration-300">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-menthe group-hover:text-black ml-1">
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  </div>
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
        <p className="text-[10px] font-black tracking-[0.3em] text-menthe uppercase mb-2 text-center">Base de données</p>
        <h1 className="text-4xl font-black text-white tracking-tighter text-center uppercase italic">Exercices</h1>
        <div className="mt-6 glass-card p-2 rounded-full flex items-center px-6">
          <input placeholder="Rechercher un mouvement..." value={search} onChange={(e) => setSearch(e.target.value)} 
            className="flex-1 py-3 text-sm placeholder:italic" />
          <span className="opacity-30">🔍</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {list.map(ex => (
          <div key={ex.id} className="glass-card p-4 rounded-[2rem] flex items-center gap-4 group">
             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
               {ex.category === 'Force' ? '💪' : '🏃'}
             </div>
             <div className="flex-1">
               <h3 className="font-black text-white text-lg">{ex.name}</h3>
               <p className="text-[10px] font-bold text-menthe uppercase tracking-widest">{ex.category}</p>
             </div>
             {ex.video_url && (
               <a href={ex.video_url} target="_blank" rel="noreferrer">
                 <PlayIcon />
               </a>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}