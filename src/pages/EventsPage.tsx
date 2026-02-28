import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange, deleteEvent } from "../db/events";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [list, setList] = useState<any[]>([]);

  async function refresh() {
    try {
      const events = await getEventsOverlappingRange(from, to);
      setList(events);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    if (!title) return;
    try {
      await createEvent({ 
        start_date: from, 
        end_date: to, 
        title, 
        color: "#3b82f6", 
        note 
      });
      setTitle(""); setNote("");
      refresh();
    } catch (e: any) { alert(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    await deleteEvent(id);
    refresh();
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Événements</h1>
      </header>

      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-transparent border-b dark:text-white outline-none" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="bg-transparent border-b dark:text-white outline-none" />
        </div>
        <input 
          placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-lg bg-transparent border-b dark:text-white outline-none"
        />
        <textarea 
          placeholder="Note..." value={note} onChange={e => setNote(e.target.value)}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white outline-none"
        />
        <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
          Ajouter
        </button>
      </section>

      <div className="space-y-3">
        {list.map(ev => (
          <div key={ev.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 flex justify-between dark:text-white" style={{ borderLeftColor: ev.color }}>
            <div>
              <div className="font-bold">{ev.title}</div>
              <div className="text-xs opacity-60">
                {format(parseISO(ev.start_date), 'dd MMM', { locale: fr })} → {format(parseISO(ev.end_date), 'dd MMM', { locale: fr })}
              </div>
            </div>
            <button onClick={() => handleDelete(ev.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}