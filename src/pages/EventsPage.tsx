import { useEffect, useState } from "react";
import { createEvent, getEventsOverlappingRange } from "../db/events";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EventsPage() {
  const [from, setFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState("");
  const [list, setList] = useState<any[]>([]);

  useEffect(() => { refresh(); }, [from, to]);

  async function refresh() {
    const events = await getEventsOverlappingRange(from, to);
    setList(events);
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">
      <header className="px-2">
        <p className="text-xs font-black tracking-[0.2em] text-indigo-500 uppercase mb-1">Planning</p>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Événements</h1>
      </header>

      {/* Formulaire d'ajout rapide */}
      <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <input
          placeholder="Titre de l'événement..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold dark:text-white"
        />
        <div className="flex gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold dark:text-white" />
          <button 
            onClick={async () => {
              await createEvent({ title, start_date: from, end_date: from, color: '#6366f1' });
              setTitle(""); refresh();
            }}
            className="px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">À venir</h3>
        {list.map((ev) => (
          <div key={ev.id} className="relative overflow-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: ev.color }}></div>
            <p className="font-bold text-slate-900 dark:text-white">{ev.title}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Du {format(new Date(ev.start_date), 'd MMM', { locale: fr })} au {format(new Date(ev.end_date), 'd MMM', { locale: fr })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}