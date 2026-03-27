import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Dumbbell, ChevronDown, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CatalogExercise } from "@/db/catalog";

/* ── Filter chip ── */
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

/* ── Filter row ── */
function FilterRow({ label, values, selected, onSelect }: {
  label: string;
  values: string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{label}</span>
      <FilterChip label={t("exercisePicker.allFilters")} active={!selected} onClick={() => onSelect(null)} />
      {values.map((v) => (
        <FilterChip key={v} label={v} active={selected === v} onClick={() => onSelect(selected === v ? null : v)} />
      ))}
    </div>
  );
}

interface ExercisePickerSheetProps {
  exercises: string[];
  catalog?: CatalogExercise[];
  selected: string;
  onSelect: (exercise: string) => void;
}

export default function ExercisePickerSheet({
  exercises,
  catalog = [],
  selected,
  onSelect,
}: ExercisePickerSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [filterEquipment, setFilterEquipment] = useState<string | null>(null);
  const [filterBodyRegion, setFilterBodyRegion] = useState<string | null>(null);

  // Build filter options from catalog
  const muscleGroups = useMemo(() => [...new Set(catalog.map(e => e.target_muscle_group).filter(Boolean))].sort() as string[], [catalog]);
  const equipments = useMemo(() => [...new Set(catalog.map(e => e.primary_equipment).filter(Boolean))].sort() as string[], [catalog]);
  const bodyRegions = useMemo(() => [...new Set(catalog.map(e => e.body_region).filter(Boolean))].sort() as string[], [catalog]);

  // Build catalog lookup by name
  const catalogByName = useMemo(() => {
    const map = new Map<string, CatalogExercise>();
    catalog.forEach(e => map.set(e.name, e));
    return map;
  }, [catalog]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search && !ex.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMuscle || filterEquipment || filterBodyRegion) {
        const cat = catalogByName.get(ex);
        if (!cat) return false;
        if (filterMuscle && cat.target_muscle_group !== filterMuscle) return false;
        if (filterEquipment && cat.primary_equipment !== filterEquipment) return false;
        if (filterBodyRegion && cat.body_region !== filterBodyRegion) return false;
      }
      return true;
    });
  }, [exercises, search, filterMuscle, filterEquipment, filterBodyRegion, catalogByName]);

  const hasActiveFilters = filterMuscle || filterEquipment || filterBodyRegion;

  const resetFilters = () => {
    setFilterMuscle(null);
    setFilterEquipment(null);
    setFilterBodyRegion(null);
    setSearch("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted border border-border text-sm font-bold text-foreground hover:border-primary/30 transition-colors w-full"
      >
        <Dumbbell size={14} className="text-primary shrink-0" />
        <span className="truncate flex-1 text-left">{selected || t("exercisePicker.choose")}</span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => { setOpen(false); resetFilters(); }}
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
                if (info.offset.y > 90 || info.velocity.y > 600) {
                  setOpen(false);
                  resetFilters();
                }
              }}
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2rem] border border-border bg-card/95 backdrop-blur-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative">
                    <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                      {t("exercisePicker.title")}
                    </h2>
                    <div className="flex items-center gap-1">
                      {catalog.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowFilters(!showFilters)}
                          className={`p-2 transition-colors ${showFilters || hasActiveFilters ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <Filter size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setOpen(false); resetFilters(); }}
                        className="p-2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                      <Search size={14} className="text-muted-foreground shrink-0" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("exercisePicker.search")}
                        className="bg-transparent w-full text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <AnimatePresence>
                    {showFilters && catalog.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-3 space-y-2">
                          {muscleGroups.length > 0 && (
                            <FilterRow label={t("exercisePicker.filterMuscle")} values={muscleGroups} selected={filterMuscle} onSelect={setFilterMuscle} />
                          )}
                          {equipments.length > 0 && (
                            <FilterRow label={t("exercisePicker.filterEquipment")} values={equipments} selected={filterEquipment} onSelect={setFilterEquipment} />
                          )}
                          {bodyRegions.length > 0 && (
                            <FilterRow label={t("exercisePicker.filterBodyRegion")} values={bodyRegions} selected={filterBodyRegion} onSelect={setFilterBodyRegion} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="px-5 pb-6 max-h-[50vh] overflow-auto space-y-1">
                    {filtered.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        {t("exercisePicker.noResult")}
                      </p>
                    ) : (
                      filtered.map((ex) => {
                        const isActive = ex === selected;
                        const cat = catalogByName.get(ex);
                        return (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => {
                              onSelect(ex);
                              setOpen(false);
                              resetFilters();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                              isActive
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : "text-foreground hover:bg-muted border border-transparent"
                            }`}
                          >
                            <span>{ex}</span>
                            {cat?.target_muscle_group && (
                              <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                                {cat.target_muscle_group}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
