import { useEffect, useState } from "react";
import { listCatalogExercises } from "../db/catalog";

// Véritable icône Play Menthe
const PlayIcon = ({ url }: { url: string }) => (
  <a href={url} target="_blank" rel="noreferrer" className="group">
    <div className="w-12 h-12 rounded-full bg-menthe/10 flex items-center justify-center border border-menthe/20 group-hover:bg-menthe group-hover:scale-110 transition-all duration-300">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-menthe group-hover:text-black ml-1">
        <path d="M7 6v12l10-6z" />
      </svg>
    </div>
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
        <h1 className="page-title">Exercices</h1>
        <div className="mt-6 glass-card p-2 rounded-full flex items-center px-6">
          <input placeholder="Chercher un mouvement..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 py-3 text-sm" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {list.map(ex => (
          <div key={ex.id} className="glass-card p-4 rounded-[2rem] flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
               {ex.category === 'Force' ? '💪' : '🏃'}
             </div>
             <div className="flex-1">
               <h3 className="font-black text-white text-lg">{ex.name}</h3>
               <p className="text-[10px] font-black text-menthe uppercase tracking-widest">{ex.category}</p>
             </div>
             {ex.video_url && <PlayIcon url={ex.video_url} />}
          </div>
        ))}
      </div>
    </div>
  );
}