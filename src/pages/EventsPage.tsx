import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange, deleteEvent } from "../db/events"; // Assure-toi que deleteEvent existe dans db/events.ts
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const events = await getEventsOverlappingRange(from, to);
      setList(events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    if (!title) return;
    try {
      await createEvent({ from_date: from, to_date: to, title, color, note });
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
        <h1 className="text-2xl font-bold text-slate-800">Événements</h1>
        <p className="text-slate-500 text-sm">Notes contextuelles (vacances, blessures...)</p>
      </header>

      {/* FORMULAIRE */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase">Début</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border-b-2 py-1 outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase">Fin</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border-b-2 py-1 outline-none focus:border-blue-500" />
          </div>
        </div>
        <input 
          placeholder="Titre (ex: Vacances Ski)" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full text-lg font-medium border-b-2 py-2 outline-none focus:border-blue-500"
        />
        <textarea 
          placeholder="Note optionnelle..." value={note} onChange={e => setNote(e.target.value)}
          className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none h-20"
        />
        <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform">
          Ajouter l'événement
        </button>
      </section>

      {/* LISTE */}
      <div className="space-y-3">
        <h2 className="font-bold text-slate-700">Historique récent</h2>
        {list.map(ev => (
          <div key={ev.id} className="bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-start" style={{ borderLeftColor: ev.color }}>
            <div>
              <div className="font-bold">{ev.title}</div>
              <div className="text-xs text-slate-500">
                {format(parseISO(ev.from_date), 'dd MMM', { locale: fr })} → {format(parseISO(ev.to_date), 'dd MMM', { locale: fr })}
              </div>
              {ev.note && <div className="text-sm text-slate-600 mt-2 italic">{ev.note}</div>}
            </div>
            <button onClick={() => handleDelete(ev.id)} className="text-slate-300 hover:text-red-500">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}