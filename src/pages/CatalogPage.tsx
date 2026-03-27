import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Filter, X } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { listCatalogExercises, CatalogExercise } from "@/db/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

function getLocalizedNote(ex: CatalogExercise, lang: string): string | null {
  if (lang === "en" && ex.note_en) return ex.note_en;
  if (lang === "es" && ex.note_es) return ex.note_es;
  return ex.note;
}

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const [allExercises, setAllExercises] = useState<CatalogExercise[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [filterBodyRegion, setFilterBodyRegion] = useState<string | null>(null);

  useEffect(() => {
    listCatalogExercises()
      .then(setAllExercises)
      .finally(() => setLoading(false));
  }, []);

  const muscleGroups = useMemo(() => [...new Set(allExercises.map(e => e.target_muscle_group).filter(Boolean))].sort() as string[], [allExercises]);
  const bodyRegions = useMemo(() => [...new Set(allExercises.map(e => e.body_region).filter(Boolean))].sort() as string[], [allExercises]);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMuscle && ex.target_muscle_group !== filterMuscle) return false;
      if (filterBodyRegion && ex.body_region !== filterBodyRegion) return false;
      return true;
    });
  }, [allExercises, search, filterMuscle, filterBodyRegion]);

  const hasActiveFilters = filterMuscle || filterBodyRegion;

  const resetFilters = () => {
    setFilterMuscle(null);
    setFilterBodyRegion(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-32 lg:pb-8 bg-primary-foreground">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-noto-title text-3xl text-primary text-center mb-6">{t("catalog.title")}</h1>

        <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3 mb-3 border border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            placeholder={t("catalog.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted-foreground font-bold"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 transition-colors ${showFilters || hasActiveFilters ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Filters as dropdowns */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex flex-col sm:flex-row gap-2 pb-2">
                {bodyRegions.length > 0 && (
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      {t("exercisePicker.filterBodyRegion")}
                    </label>
                    <select
                      value={filterBodyRegion ?? ""}
                      onChange={(e) => setFilterBodyRegion(e.target.value || null)}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground outline-none appearance-none"
                    >
                      <option value="">{t("exercisePicker.allFilters")}</option>
                      {bodyRegions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
                {muscleGroups.length > 0 && (
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                      {t("exercisePicker.filterMuscle")}
                    </label>
                    <select
                      value={filterMuscle ?? ""}
                      onChange={(e) => setFilterMuscle(e.target.value || null)}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-foreground outline-none appearance-none"
                    >
                      <option value="">{t("exercisePicker.allFilters")}</option>
                      {muscleGroups.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  <X size={12} />
                  {t("exercisePicker.allFilters")}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mb-4 font-bold">
          {t("catalog.exerciseCount", { count: filtered.length })}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-16">
            {search || hasActiveFilters ? t("catalog.noResult") : t("catalog.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((ex) => {
                const isExpanded = expandedId === ex.id;
                const localNote = getLocalizedNote(ex, i18n.language);
                return (
                  <motion.div
                    key={ex.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <GlassCard className="overflow-hidden">
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-lg uppercase text-foreground tracking-tight">
                            {ex.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ex.target_muscle_group && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {ex.target_muscle_group}
                              </span>
                            )}
                            {ex.body_region && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {ex.body_region}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {localNote && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider transition-colors ${
                                isExpanded
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                              }`}
                              aria-label={t("catalog.seeNote")}
                            >
                              {t("catalog.seeNote")}
                            </button>
                          )}
                          {ex.youtube_url && (
                            <a
                              href={ex.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                              aria-label={t("catalog.seeVideo")}
                            >
                              <Play size={18} fill="currentColor" />
                            </a>
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && localNote && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed">
                              {localNote}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
