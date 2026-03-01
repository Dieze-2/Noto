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
    setList(events.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
  }

  const upcoming = list.filter(e => !isBefore(startOfDay(parseISO(e.end_date)), startOfDay(new Date())));

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Planning</h1>
      </header>

      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
        <input placeholder="Nom de l'événement..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 p-4 rounded-2xl text-xl font-bold text-white outline-none" />
        
        <div className="bg-white/5 rounded-2xl overflow-hidden divide-x divide-white/5 flex items-center">
            <div className="flex-1 p-4">
                <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Du</label>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-transparent w-full text-xs text-white outline-none" />
            </div>
            <div className="flex-1 p-4 text-right">
                <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Au</label>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-transparent w-full text-xs text-white outline-none text-right" />
            </div>
        </div>

        <button onClick={async () => { if(!title) return; await createEvent({ title, start_date: from, end_date: to, color: '#00ffa3' }); setTitle(""); refresh(); }} className="w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Ajouter au calendrier</button>
      </section>

      <div className="space-y-4">
        {upcoming.map((ev) => (
          <div key={ev.id} className="glass-card p-5 rounded-3xl border-l-4 border-menthe flex justify-between items-center">
            <div>
              <p className="font-black text-white text-lg">{ev.title}</p>
              <p className="text-[10px] font-black text-menthe uppercase tracking-widest mt-1 italic">
                {format(parseISO(ev.start_date), 'd MMM', { locale: fr })} — {format(parseISO(ev.end_date), 'd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <button onClick={async () => { if(confirm("Supprimer ?")) { await deleteEvent(ev.id); refresh(); } }} className="text-rose-500 font-black text-[10px] uppercase p-2">Suppr.</button>
          </div>
        ))}
      </div>
    </div>
  );
}