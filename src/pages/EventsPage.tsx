import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange, deleteEvent } from "../db/events";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [to, setTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState(\"\");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const events = await getEventsOverlappingRange(\"2020-01-01\", \"2030-12-31\");
    setList(events.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
  }

  const upcoming = list.filter(e => !isBefore(startOfDay(parseISO(e.end_date)), startOfDay(new Date())));

  return (
    <div className=\"max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8\">
      <header className=\"text-center\">
        <h1 className=\"text-4xl font-black text-menthe italic uppercase tracking-tighter\">Planning</h1>
      </header>

      <section className=\"glass-card p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe\">
        <input placeholder=\"Événement...\" value={title} onChange={e => setTitle(e.target.value)} className=\"w-full bg-white/5 p-4 rounded-2xl font-bold text-white outline-none\" />
        <div className=\"grid grid-cols-2 gap-2\">
          <input type=\"date\" value={from} onChange={e => setFrom(e.target.value)} className=\"bg-white/5 p-4 rounded-2xl text-xs text-white outline-none\" />
          <input type=\"date\" value={to} onChange={e => setTo(e.target.value)} className=\"bg-white/5 p-4 rounded-2xl text-xs text-white outline-none\" />
        </div>
        <button onClick={async () => { if(!title) return; await createEvent({ title, start_date: from, end_date: to, color: '#00ffa3' }); setTitle(\"\"); refresh(); }} className=\"w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest\">Ajouter</button>
      </section>

      <div className=\"space-y-4\">
        {upcoming.map((ev) => (
          <div key={ev.id} className=\"glass-card p-5 rounded-3xl border-l-4 border-menthe flex justify-between items-center\">
            <div>
              <p className=\"font-black text-white text-lg\">{ev.title}</p>
              <p className=\"text-[10px] font-black text-menthe uppercase tracking-widest mt-1 italic\">Du {format(parseISO(ev.start_date), 'd MMM', { locale: fr })} au {format(parseISO(ev.end_date), 'd MMM', { locale: fr })}</p>
            </div>
            <button onClick={async () => { await deleteEvent(ev.id); refresh(); }} className=\"text-rose-500 font-black text-[10px] uppercase px-3\">Suppr.</button>
          </div>
        ))}
      </div>
    </div>
  );
}