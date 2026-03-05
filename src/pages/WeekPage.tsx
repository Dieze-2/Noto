import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { startOfWeek, addDays, format, isToday, subDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Footprints,
  Flame,
  Weight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Pencil,
  Check,
  Ban,
  Trash2,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import { getDailyMetricsRange } from "../db/dailyMetrics";
import type { DailyMetricsRow } from "../db/dailyMetrics";

import { getEventsOverlappingRange } from "../db/events";
import type { EventRow } from "../db/events";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

const EVENT_COLORS = [
  "#00FFA3",
  "#FF6B6B",
  "#FFA94D",
  "#FFD43B",
  "#74C0FC",
  "#4DABF7",
  "#B197FC",
  "#63E6BE",
  "#A9E34B",
  "#F783AC",
] as const;

const MAX_DOTS = 4;

function isHex6(x: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(x);
}
function normalizeHex(x: string) {
  return x.toUpperCase();
}
function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

type EditState = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  color: string;
};

function SwipeDeleteEventRow({
  ev,
  isEditing,
  onDelete,
  children,
}: {
  ev: EventRow;
  isEditing: boolean;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, 0], [1, 0]);

  if (isEditing) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }} className="relative">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-rose-600 rounded-3xl flex items-center justify-end px-6">
        <Trash2 size={18} className="text-white" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) onDelete(ev.id);
        }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function WeekPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [anchorDate, setAnchorDate] = useState(new Date());
  const [currentWeekData, setCurrentWeekData] = useState<DailyMetricsRow[]>([]);
  const [prevWeekData, setPrevWeekData] = useState<DailyMetricsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  // Drawer NOTE
  const [noteOpen, setNoteOpen] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(EVENT_COLORS[0]);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const [allEvents, setAllEvents] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);

  // Support open drawer from URL: /week?note=1
  useEffect(() => {
    const note = searchParams.get("note");
    if (note === "1") setNoteOpen(true);
  }, [searchParams]);

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

  async function refreshAll() {
    await Promise.all([refreshAllEvents(), refreshWeek()]);
  }

  useEffect(() => {
    refreshWeek().catch(() => {});
  }, [startStr, endStr, start]);

  useEffect(() => {
    refreshAllEvents().catch(() => {});
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setEditing(null);
        closeNoteDrawer();
      }
    }
    if (noteOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function openNoteDrawer() {
    setRange(undefined);


    setNoteOpen(true);
    const sp = new URLSearchParams(searchParams);
    sp.set("note", "1");
    setSearchParams(sp, { replace: true });
  }

  function closeNoteDrawer() {
    setEditing(null);
    setNoteOpen(false);
    const sp = new URLSearchParams(searchParams);
    sp.delete("note");
    setSearchParams(sp, { replace: true });
  }

  async function handleSwipeDeleteEvent(id: string) {
    setAllEvents((prev) => prev.filter((e) => e.id !== id));
    setEvents((prev) => prev.filter((e) => e.id !== id));

    try {
      await deleteEvent(id);
      await refreshAll();
    } catch {
      await refreshAll();
    }
  }

  const canCreate = Boolean(title.trim()) && Boolean(range?.from) && Boolean(range?.to);
  const fromISO = range?.from ? toISO(range.from) : "";
  const toISOValue = range?.to ? toISO(range.to) : "";

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
            {stats.variation.toFixed(2)}%
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
          const dayEvents = events.filter((e) => dStr >= e.start_date && dStr <= e.end_date);
          const isT = isToday(day);

          return (
            <GlassCard
              key={dStr}
              onClick={() => navigate(`/today?date=${dStr}`)}
              className={`flex items-center justify-between p-4 border-l-4 transition-all ${
                isT ? "border-menthe bg-menthe/5" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    isT ? "bg-menthe text-black" : "bg-white/5 text-white/40"
                  }`}
                >
                  <span className="text-[9px] uppercase leading-none">{format(day, "EEE", { locale: fr })}</span>
                  <span className="text-lg leading-none">{format(day, "d")}</span>
                </div>

                <div className="flex-1">
                  <p className="font-black uppercase italic text-sm text-white flex items-center">
                    {format(day, "EEEE", { locale: fr })}
                    {dayEvents.length > 0 && (
                      <Sparkles size={12} className="ml-2" style={{ color: isHex6(dayEvents[0].color) ? dayEvents[0].color : "#FFA94D" }} />
                    )}
                  </p>

                  <div className="mt-1">
                    {dayEvents.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNoteDrawer();
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex flex-col gap-1">
                          {dayEvents.slice(0, MAX_DOTS).map((ev) => {
                            const c = ev.color && isHex6(ev.color) ? ev.color : "#FFFFFF";
                            return (
                              <div key={ev.id} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                                <span className="text-[10px] font-black uppercase italic tracking-widest" style={{ color: c }}>
                                  {ev.title}
                                </span>
                              </div>
                            );
                          })}
                          {dayEvents.length > MAX_DOTS && (
                            <div className="text-[10px] font-black uppercase italic tracking-widest text-white/30">
                              +{dayEvents.length - MAX_DOTS}
                            </div>
                          )}
                        </div>
                      </button>
                    )}

                    <div className="flex gap-4 mt-1">
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

      <div className="mt-10">
        <button
          type="button"
          onClick={openNoteDrawer}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase italic text-xs tracking-widest text-white/60 hover:text-white"
        >
          NOTE
        </button>
      </div>

      <AnimatePresence>
        {noteOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer"
              onClick={closeNoteDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                const shouldClose = info.offset.y > 90 || info.velocity.y > 600;
                if (shouldClose) closeNoteDrawer();
              }}
              initial={{ y: 700 }}
              animate={{ y: 0 }}
              exit={{ y: 700 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2.5rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-[0_-30px_80px_rgba(0,0,0,0.75)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase italic tracking-widest text-white/70">Planning</h2>
                    <button type="button" onClick={closeNoteDrawer} className="p-2 text-white/30 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-6 max-h-[75vh] overflow-auto no-scrollbar space-y-6">
                    {/* CREATE */}
                    <GlassCard className="p-6 rounded-[2.5rem] space-y-4 border-b-4 border-menthe">
                      <input
                        placeholder="Nom de l'événement..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white/5 p-4 rounded-2xl text-xl font-bold text-white outline-none"
                      />

                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Couleur</p>
                        <div className="flex flex-wrap gap-2">
                          {EVENT_COLORS.map((c) => {
                            const active = normalizeHex(selectedColor) === normalizeHex(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedColor(c)}
                                className={`w-10 h-10 rounded-full border ${active ? "border-white" : "border-white/10"}`}
                                style={{ backgroundColor: c }}
                                aria-label={`Choisir ${c}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                        <DayPicker
                          mode="range"
                          selected={range}
                          onSelect={(next) => setRange(next)}
                          locale={fr}
                          weekStartsOn={1}
                          fixedWeeks
                          showOutsideDays
                          className="text-white"
                          classNames={{
                            months: "flex flex-col",
                            month: "space-y-3",
                            caption: "flex items-center justify-between px-1",
                            caption_label: "text-[10px] font-black uppercase tracking-[0.3em] text-white/60",
                            nav: "flex items-center gap-2",
                            nav_button:
                              "w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30",
                            table: "w-full border-collapse",
                            head_row: "grid grid-cols-7",
                            head_cell: "text-[9px] font-black uppercase text-white/20 text-center py-2",
                            row: "grid grid-cols-7",
                            cell: "text-center p-1",
                            day: "w-10 h-10 rounded-2xl font-black uppercase italic text-[11px] text-white/70 hover:bg-white/10",
                            day_today: "ring-2 ring-menthe/60",
                            day_selected: "bg-menthe text-black",
                            day_range_start: "bg-menthe text-black",
                            day_range_end: "bg-menthe text-black",
                            day_range_middle: "bg-menthe/20 text-white",
                            day_outside: "text-white/10",
                            day_disabled: "text-white/10",
                          }}
                        />

                        <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                          <span>DU: {fromISO || "--"}</span>
                          <span>AU: {toISOValue || "--"}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canCreate}
                        onClick={async () => {
                          if (!title.trim()) return;
                          if (!EVENT_COLORS.map(normalizeHex).includes(normalizeHex(selectedColor))) return;
                          if (!range?.from || !range?.to) return;
                      
                          await createEvent({
                            title: title.trim(),
                            start_date: toISO(range.from),
                            end_date: toISO(range.to),
                            color: normalizeHex(selectedColor),
                          });
                      
                          // reset form
                          setTitle("");
                          setRange(undefined);
                      
                          await refreshAll();
                      
                          // close drawer (same as X)
                          closeNoteDrawer();
                        }}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                          canCreate ? "bg-menthe text-black" : "bg-white/5 text-white/20 border border-white/10"
                        }`}
                      >
                        Ajouter au calendrier
                      </button>

                    </GlassCard>

                    {/* LIST */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {allEvents.map((ev) => {
                          const c = ev.color && isHex6(ev.color) ? normalizeHex(ev.color) : "#FFFFFF";
                          const isEditing = editing?.id === ev.id;

                          return (
                            <SwipeDeleteEventRow key={ev.id} ev={ev} isEditing={isEditing} onDelete={handleSwipeDeleteEvent}>
                              <GlassCard className="p-5 rounded-3xl border-l-4" style={{ borderLeftColor: c }}>
                                {!isEditing ? (
                                  <div className="flex justify-between items-center gap-4">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                                        <p className="font-black text-white text-lg uppercase italic truncate">{ev.title}</p>
                                      </div>
                                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1 italic">
                                        {format(parseISO(ev.start_date), "d MMM", { locale: fr })} —{" "}
                                        {format(parseISO(ev.end_date), "d MMM yyyy", { locale: fr })}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditing({
                                            id: ev.id,
                                            title: ev.title,
                                            start_date: ev.start_date,
                                            end_date: ev.end_date,
                                            color: c,
                                          })
                                        }
                                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60"
                                        aria-label="Éditer"
                                      >
                                        <Pencil size={16} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!confirm("Supprimer ?")) return;
                                          await handleSwipeDeleteEvent(ev.id);
                                        }}
                                        className="text-rose-500 font-black text-[10px] uppercase px-2 py-2"
                                      >
                                        Suppr.
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <input
                                        value={editing.title}
                                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 font-black uppercase italic text-white outline-none focus:border-menthe"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const patchTitle = editing.title.trim();
                                            if (!patchTitle) return;

                                            const ok = EVENT_COLORS.map(normalizeHex).includes(normalizeHex(editing.color));
                                            if (!ok) return;

                                            if (editing.end_date < editing.start_date) return;

                                            await updateEvent(editing.id, {
                                              title: patchTitle,
                                              start_date: editing.start_date,
                                              end_date: editing.end_date,
                                              color: normalizeHex(editing.color),
                                            });

                                            setEditing(null);
                                            await refreshAll();
                                          }}
                                          className="w-10 h-10 rounded-full bg-menthe text-black flex items-center justify-center"
                                          aria-label="Sauver"
                                        >
                                          <Check size={16} />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setEditing(null)}
                                          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 flex items-center justify-center"
                                          aria-label="Annuler"
                                        >
                                          <Ban size={16} />
                                        </button>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Couleur</p>
                                      <div className="flex flex-wrap gap-2">
                                        {EVENT_COLORS.map((col) => {
                                          const active = normalizeHex(editing.color) === normalizeHex(col);
                                          return (
                                            <button
                                              key={col}
                                              type="button"
                                              onClick={() => setEditing({ ...editing, color: col })}
                                              className={`w-10 h-10 rounded-full border ${active ? "border-white" : "border-white/10"}`}
                                              style={{ backgroundColor: col }}
                                              aria-label={`Choisir ${col}`}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* EDIT DATES: still 2 native inputs for simplicity (range edit can come after) */}
                                    <div className="bg-white/5 rounded-2xl overflow-hidden divide-x divide-white/5 flex items-center">
                                      <div className="flex-1 p-4">
                                        <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Du</label>
                                        <input
                                          type="date"
                                          value={editing.start_date}
                                          max={editing.end_date || undefined}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setEditing((prev) => {
                                              if (!prev) return prev;
                                              const next = { ...prev, start_date: v };
                                              if (next.end_date && v > next.end_date) next.end_date = v;
                                              return next;
                                            });
                                          }}
                                          className="bg-transparent w-full text-xs text-white outline-none"
                                        />
                                      </div>
                                      <div className="flex-1 p-4 text-right">
                                        <label className="text-[8px] font-black text-white/30 uppercase block mb-1">Au</label>
                                        <input
                                          type="date"
                                          value={editing.end_date}
                                          min={editing.start_date || undefined}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setEditing((prev) => {
                                              if (!prev) return prev;
                                              const next = { ...prev, end_date: v };
                                              if (next.start_date && v < next.start_date) next.start_date = v;
                                              return next;
                                            });
                                          }}
                                          className="bg-transparent w-full text-xs text-white outline-none text-right"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </GlassCard>
                            </SwipeDeleteEventRow>
                          );
                        })}
                      </AnimatePresence>
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
