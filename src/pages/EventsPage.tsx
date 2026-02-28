import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange, deleteEvent } from "../db/events";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [to, setTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState("");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    const events = await getEventsOverlappingRange("2020-01-01", "2030-12-31");
    // Tri par date
    setList(events.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
  }

  // Filtrer uniquement ce qui n'est pas terminé
  const upcoming = list.filter(e => {
    const endDate = startOfDay(parseISO(e.end_date));
    const today = startOfDay(new Date());
    return !isBefore(endDate, today);
  });

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <span className="page-subtitle">Planning</span>
        <h1 className="page-title text-center">Agenda</h1>
      </header>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <div className="bg-white/5 p-4 rounded-2xl">
          <label className="text-[10px] font-black uppercase text-menthe mb-1 block tracking-widest">Événement</label>
          <input placeholder="Ex: Cycle de force, Repos..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-lg" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 p-4 rounded-2xl">
            <label className="text-[10px] font-black uppercase text-menthe mb-1 block tracking-widest">Début</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full text-sm font-black bg-transparent" />
          </div>
          <div className="bg-white/5 p-4 rounded-2xl">
            <label className="text-[10px] font-black uppercase text-menthe mb-1 block tracking-widest">Fin</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full text-sm font-black bg-transparent" />
          </div>
        </div>

        <button 
          onClick={async () => {
            if(!title) return;
            await createEvent({ title, start_date: from, end_date: to, color: '#00ffa3' });
            setTitle(""); refresh();
          }}
          className="w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg"
        >
          Ajouter au calendrier
        </button>
      </section>

      <div className="space-y-4">
        <h3 className="px-2 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">À venir</h3>
        {upcoming.length === 0 && <p className="text-center opacity-20 italic text-sm">Rien de prévu</p>}
        {upcoming.map((ev) => (
          <div key={ev.id} className="glass-card p-5 rounded-3xl border-l-4 border-menthe flex justify-between items-center animate-in fade-in">
            <div>
              <p className="font-black text-white text-lg">{ev.title}</p>
              <p className="text-[10px] font-black text-menthe uppercase tracking-widest mt-1">
                Du {format(parseISO(ev.start_date), 'd MMM', { locale: fr })} au {format(parseISO(ev.end_date), 'd MMM', { locale: fr })}
              </p>
            </div>
            <button onClick={async () => { await deleteEvent(ev.id); refresh(); }} className="text-rose-500 text-[10px] font-black uppercase p-2 hover:bg-rose-500/10 rounded-xl transition-colors">Retirer</button>
          </div>
        ))}
      </div>
    </div>
  );
}