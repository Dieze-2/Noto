import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  startOfWeek,
  addDays,
  format,
  isToday,
  subDays,
  isBefore,
  startOfDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  Footprints,
  Flame,
  Weight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange, DailyMetricsRow } from "../db/dailyMetrics";
import { motion, AnimatePresence } from "framer-motion";
import { getEventsOverlappingRange, EventRow, createEvent, deleteEvent } from "../db/events";

export default function WeekPage() {
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentWeekData, setCurrentWeekData] = useState<DailyMetricsRow[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DailyMetricsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  // Drawer NOTE (events)
  const [noteOpen, setNoteOpen] = useState(false);
  const [from, setFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);

  const start = useMemo(() => startOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  const startStr = useMemo(() => format(days[0], "yyyy-MM-dd"), [days]);
  const endStr = useMemo(() => format(days[6], "yyyy-MM-dd"), [days]);

  async function refreshWeek() {
    const [cur, prev, evs] = await Promise.all([
      getDailyMetricsRange(startStr, endStr),
      getDailyMetricsRange(format(subDays(start, 7), "yyyy-MM-dd"), format(subDays(start, 1), "yyyy-MM-dd")),
      getEventsOverlappingRange(startStr, endStr),
    ]);
    setCurrentWeekData(cur);
    setPrevWeekData(prev);
    setEvents(evs);
  }

  async function refreshAllEvents() {
    const evs = await getEventsOverlappingRange("2020-01-01", "2030-12-31");
    setAllEvents(evs.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
  }

  useEffect(() => {
    let alive = true;
    refreshWeek()
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
      });
    return () => {
      alive = false;
    };
  }, [startStr, endStr, start]);

  useEffect(() => {
    refreshAllEvents().catch(() => {});
  }, []);

  useEffect(() => {
    // ESC pour fermer (desktop)
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNoteOpen(false);
    }
    if (noteOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [noteOpen]);

  const stats = useMemo(() => {
    const getAvg = (data: DailyMetricsRow[], field: "steps" | "kcal" | "weight_g") => {
      const vals = data.map((d) => d[field] || 0).filter((v) => v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const curW = getAvg(currentWeekData, "weight_g") / 1000;
    const prevW = getAvg(prevWeekData, "weight_g") / 1000;

    return {
      weight: curW,
      steps: Math.round(getAvg(currentWeekData, "steps")),
      kcal: Math.round(getAvg(currentWeekData, "kcal")),
      variation: prevW ? ((curW - prevW) / prevW) * 100 : 0,
    };
  }, [currentWeekData, prevWeekData]);

  const upcoming = useMemo(() => {
    return allEvents.filter((e) => !isBefore(startOfDay(parseISO(e.end_date)), startOfDay(new Date())));
  }, [allEvents]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex flex-col items-center mb-10">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 50) setAnchorDate(subDays(anchorDate, 7));
            if (info.offset.x < -50) setAnchorDate(addDays(anchorDate, 7));
          }}
          className="flex items-center justify-between w-full bg-white/5 py-4 rounded-3xl border border-white/5"
        >
          <button onClick={() => setAnchorDate(subDays(anchorDate, 7))} className="p-2 text-white/20">
            <ChevronLeft size={32} />
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Semaine</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              du {format(start, "d MMMM", { locale: fr })}
            </p>
          </div>
          <button onClick={() => setAnchorDate(addDays(anchorDate, 7))} className="p-2 text-white/20">
            <ChevronRight size={32} />
          </button>
        </motion.div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <GlassCard className="p-6 text-center border-menthe/10 relative overflow-hidden">
          <Weight size={20} className="text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{stats.weight ? stats.weight.toFixed(1) : "--"}kg</p>
          <div
            className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              stats.variation > 0 ? "bg-rose-500/10 text-rose-500" : "bg-menthe/10 text-menthe"
            }`}
          >
            {stats.variation > 0 ? "+" : ""}
            {stats.variation.toFixed(1)}%
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center border-white/5">
          <div className="flex justify-around items-center h-full">
            <div>
              <Footprints size={18} className="text-menthe mx-auto mb-1" />
              <p className="text-sm font-black text-white">{stats.steps || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div>
              <Flame size={18} className="text-yellow-200 mx-auto mb-1" />
              <p className="text-sm font-black text-white">{stats.kcal || 0}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const dStr = format(day, "yyyy-MM-dd");
          const m = currentWeekData.find((x) => x.date === dStr);
          const event = events.find((e) => dStr >= e.start_date && dStr <= e.end_date);
          const isT = isToday(day);

          return (
            <GlassCard
              key={dStr}
              onClick={() => navigate(`/today?date=${dStr}`)}
              className={`flex items-center justify-between p-4 border-l-4 transition-all ${
                isT ? "border-menthe bg-menthe/5" : event ? "border-orange-500 bg-orange-500/5" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    isT ? "bg-menthe text-black" : event ? "bg-orange-500 text-black" : "bg-white/5 text-white/40"
                  }`}
                >
                  <span className="text-[9px] uppercase leading-none">{format(day, "EEE", { locale: fr })}</span>
                  <span className="text-lg leading-none">{format(day, "d")}</span>
                </div>

                <div className="flex-1">
                  <p className="font-black uppercase italic text-sm text-white flex items-center">
                    {format(day, "EEEE", { locale: fr })}
                    {event && <Sparkles size={12} className="ml-2 text-orange-500" />}
                  </p>

                  <div className="mt-1">
                    {event && <p className="text-[10px] font-bold text-orange-500 uppercase italic mb-1">{event.title}</p>}

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Footprints size={12} className={m?.steps ? "text-menthe" : "text-white/10"} />
                        <span className="text-white/40">{m?.steps || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Flame size={12} className={m?.kcal ? "text-yellow-200" : "text-white/10"} />
                        <span className="text-white/40">{m?.kcal || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Weight size={12} className={m?.weight_g ? "text-purple-500" : "text-white/10"} />
                        <span className="text-white/40">{m?.weight_g ? (m.weight_g / 1000).toFixed(1) : "--"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ChevronRight size={16} className="text-white/20" />
            </GlassCard>
          );
        })}
      </div>

      {/* NOTE button */}
      <div className="mt-10">
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase italic text-xs tracking-widest text-white/60 hover:text-white"
        >
          NOTE
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {noteOpen && (
          <>
            {/* Overlay */}
            <motion.button
              type="button"
              aria-label="Fermer"
              onClick={() => setNoteOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: 600 }}
              animate={{ y: 0 }}
              exit={{ y: 600 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2.5rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-[0_-30px_80px_rgba(0,0,0,0.75)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase italic tracking-widest text-white/70">
                      Planning
                    </h2>
                    <button
                      type="button"
                      onClick={() => setNoteOpen(false)}
                      className="p-2 text-white/30 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-6 max-h-[75vh] overflow-auto no-scrollbar space-y-6">
                    <GlassCard className="p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
                      <input
                        placeholder="Nom de l'événement..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 p-4 rounded-2xl text-xl font-bold text-white outline-none"
                      />

                      <div className="bg-white/5 rounded-2xl overflow-hidden divide-x divide-white/5 flex items-center">
                        <div className="flex-1 p-4">
                          <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Du</label>
                          <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="bg-transparent w-full text-xs text-white outline-none"
                          />
                        </div>
                        <div className="flex-1 p-4 text-right">
                          <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Au</label>
                          <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="bg-transparent w-full text-xs text-white outline-none text-right"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!title.trim()) return;
                          await createEvent({ title: title.trim(), start_date: from, end_date: to, color: "#00ffa3" });
                          setTitle("");
                          await refreshAllEvents();
                          await refreshWeek();
                        }}
                        className="w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                      >
                        Ajouter au calendrier
                      </button>
                    </GlassCard>

                    <div className="space-y-4">
                      {upcoming.map((ev) => (
                        <GlassCard key={ev.id} className="p-5 rounded-3xl border-l-4 border-menthe flex justify-between items-center">
                          <div>
                            <p className="font-black text-white text-lg uppercase italic">{ev.title}</p>
                            <p className="text-[10px] font-black text-menthe uppercase tracking-widest mt-1 italic">
                              {format(parseISO(ev.start_date), "d MMM", { locale: fr })} —{" "}
                              {format(parseISO(ev.end_date), "d MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm("Supprimer ?")) return;
                              await deleteEvent(ev.id);
                              await refreshAllEvents();
                              await refreshWeek();
                            }}
                            className="text-rose-500 font-black text-[10px] uppercase p-2"
                          >
                            Suppr.
                          </button>
                        </GlassCard>
                      ))}
                    </div>

                    <div className="h-6" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
