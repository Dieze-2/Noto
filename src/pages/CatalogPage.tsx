import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Filter } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { listCatalogExercises, CatalogExercise } from "@/db/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

function getLocalizedNote(ex: CatalogExercise, lang: string): string | null {
  if (lang === "en" && ex.note_en) return ex.note_en;
  if (lang === "es" && ex.note_es) return ex.note_es;
  return ex.note;
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted text-muted-foreground border-border hover:border-primary/30"
      }`}
    >
      {label}
    </button>
  );
}

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const [allExercises, setAllExercises] = useState<CatalogExercise[]>([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [filterEquipment, setFilterEquipment] = useState<string | null>(null);
  const [filterBodyRegion, setFilterBodyRegion] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

  useEffect(() => {
    listCatalogExercises()
      .then(setAllExercises)
      .finally(() => setLoading(false));
  }, []);

  const muscleGroups = useMemo(() => [...new Set(allExercises.map(e => e.target_muscle_group).filter(Boolean))].sort() as string[], [allExercises]);
  const equipments = useMemo(() => [...new Set(allExercises.map(e => e.primary_equipment).filter(Boolean))].sort() as string[], [allExercises]);
  const bodyRegions = useMemo(() => [...new Set(allExercises.map(e => e.body_region).filter(Boolean))].sort() as string[], [allExercises]);
  const difficulties = useMemo(() => [...new Set(allExercises.map(e => e.difficulty_level).filter(Boolean))].sort() as string[], [allExercises]);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMuscle && ex.target_muscle_group !== filterMuscle) return false;
      if (filterEquipment && ex.primary_equipment !== filterEquipment) return false;
      if (filterBodyRegion && ex.body_region !== filterBodyRegion) return false;
      if (filterDifficulty && ex.difficulty_level !== filterDifficulty) return false;
      return true;
    });
  }, [allExercises, search, filterMuscle, filterEquipment, filterBodyRegion, filterDifficulty]);

  const hasActiveFilters = filterMuscle || filterEquipment || filterBodyRegion || filterDifficulty;

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

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-2 pb-2">
                {muscleGroups.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{t("exercisePicker.filterMuscle")}</span>
                    <FilterChip label={t("exercisePicker.allFilters")} active={!filterMuscle} onClick={() => setFilterMuscle(null)} />
                    {muscleGroups.map(v => <FilterChip key={v} label={v} active={filterMuscle === v} onClick={() => setFilterMuscle(filterMuscle === v ? null : v)} />)}
                  </div>
                )}
                {equipments.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{t("exercisePicker.filterEquipment")}</span>
                    <FilterChip label={t("exercisePicker.allFilters")} active={!filterEquipment} onClick={() => setFilterEquipment(null)} />
                    {equipments.map(v => <FilterChip key={v} label={v} active={filterEquipment === v} onClick={() => setFilterEquipment(filterEquipment === v ? null : v)} />)}
                  </div>
                )}
                {bodyRegions.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{t("exercisePicker.filterBodyRegion")}</span>
                    <FilterChip label={t("exercisePicker.allFilters")} active={!filterBodyRegion} onClick={() => setFilterBodyRegion(null)} />
                    {bodyRegions.map(v => <FilterChip key={v} label={v} active={filterBodyRegion === v} onClick={() => setFilterBodyRegion(filterBodyRegion === v ? null : v)} />)}
                  </div>
                )}
                {difficulties.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{t("exercisePicker.filterDifficulty")}</span>
                    <FilterChip label={t("exercisePicker.allFilters")} active={!filterDifficulty} onClick={() => setFilterDifficulty(null)} />
                    {difficulties.map(v => <FilterChip key={v} label={v} active={filterDifficulty === v} onClick={() => setFilterDifficulty(filterDifficulty === v ? null : v)} />)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-muted-foreground mb-4 font-bold">
          {filtered.length} {t("catalog.exerciseCount", { count: filtered.length })}
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
                            {ex.primary_equipment && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {ex.primary_equipment}
                              </span>
                            )}
                            {ex.difficulty_level && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {ex.difficulty_level}
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
