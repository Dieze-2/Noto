import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange } from "../db/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState("");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { refresh(); }, [from]);

  async function refresh() {
    // On récupère sur une large plage pour la liste
    const events = await getEventsOverlappingRange(from, from);
    setList(events);
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <p className="text-[10px] font-black tracking-[0.3em] text-[var(--text-secondary)] uppercase mb-2">Planning</p>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Agenda</h1>
      </header>

      {/* Formulaire d'ajout look moderne */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
          <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] mb-1 block">Titre de l'événement</label>
          <input
            placeholder="Ex: Début de cycle, Repos..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent outline-none font-black text-lg text-[var(--text-primary)]"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
            <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] mb-1 block">Date</label>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="w-full bg-transparent font-black text-sm text-[var(--text-primary)] outline-none" 
            />
          </div>
          <button 
            onClick={async () => {
              if(!title) return;
              // On remplace le code couleur indigo par notre menthe (#00ffa3)
              await createEvent({ title, start_date: from, end_date: from, color: '#00ffa3' });
              setTitle(""); 
              refresh();
            }}
            className="px-8 bg-black dark:bg-[var(--text-secondary)] text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            Ajouter
          </button>
        </div>
      </section>

      {/* Liste des événements */}
      <div className="space-y-4">
        <h3 className="px-2 text-[10px] font-black text-[var(--text-primary)] opacity-40 uppercase tracking-[0.3em]">À venir</h3>
        
        {list.length === 0 && (
          <p className="text-center py-10 text-xs font-bold opacity-30 italic">Aucun événement prévu</p>
        )}

        {list.map((ev) => (
          <div key={ev.id} className="glass-card p-5 rounded-3xl flex items-center gap-4 border-l-4" style={{ borderColor: ev.color }}>
            <div className="flex-1">
              <p className="font-black text-[var(--text-primary)] text-lg">{ev.title}</p>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                {format(new Date(ev.start_date), 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}