import { useEffect, useState } from "react";
import GlassCard from "../components/GlassCard";
import { listCatalogExercises } from "../db/catalog";

export default function CatalogPage() {
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showNote, setShowNote] = useState<string | null>(null);

  useEffect(() => {
    listCatalogExercises().then((data) => {
      setAllExercises(data);
      setFiltered(data);
    });
  }, []);

  useEffect(() => {
    setFiltered(allExercises.filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, allExercises]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter text-center mb-6">Catalogue</h1>
        <input
          placeholder="CHERCHER..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none font-black italic uppercase text-white focus:border-menthe"
        />
      </header>

      <div className="space-y-4">
        {filtered.map((ex) => (
          <GlassCard key={ex.id} className="overflow-hidden border border-white/10">
            <div className="p-6 flex items-center justify-between">
              <h3 className="font-black text-xl italic uppercase text-white">{ex.name}</h3>
              <div className="flex gap-2">
                {ex.note && (
                  <button
                    type="button"
                    onClick={() => setShowNote(showNote === ex.id ? null : ex.id)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black uppercase text-white/70"
                  >
                    Note
                  </button>
                )}
                {ex.youtube_url && (
                  <a
                    href={ex.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-menthe flex items-center justify-center shadow-lg text-black font-black"
                    aria-label="Ouvrir YouTube"
                  >
                    ▶
                  </a>
                )}
              </div>
            </div>

            {showNote === ex.id && (
              <div className="px-6 pb-6 text-xs text-white/60 font-medium leading-relaxed uppercase tracking-wider">
                {ex.note}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
