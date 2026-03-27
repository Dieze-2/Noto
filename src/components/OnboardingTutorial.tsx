import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, CalendarDays, LayoutDashboard, ClipboardList,
  BookOpen, Settings, Users, ChevronLeft, ChevronRight, X
} from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

interface Step {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
}

const STEPS: Step[] = [
  { icon: Dumbbell,        titleKey: "tutorial.todayTitle",     descKey: "tutorial.todayDesc",     color: "bg-primary/10 text-primary" },
  { icon: CalendarDays,    titleKey: "tutorial.weekTitle",      descKey: "tutorial.weekDesc",      color: "bg-blue-500/10 text-blue-500" },
  { icon: LayoutDashboard, titleKey: "tutorial.dashboardTitle", descKey: "tutorial.dashboardDesc", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: ClipboardList,   titleKey: "tutorial.programTitle",   descKey: "tutorial.programDesc",   color: "bg-amber-500/10 text-amber-500" },
  { icon: BookOpen,        titleKey: "tutorial.catalogTitle",   descKey: "tutorial.catalogDesc",   color: "bg-violet-500/10 text-violet-500" },
  { icon: Users,           titleKey: "tutorial.coachTitle",     descKey: "tutorial.coachDesc",     color: "bg-rose-500/10 text-rose-500" },
  { icon: Settings,        titleKey: "tutorial.settingsTitle",  descKey: "tutorial.settingsDesc",  color: "bg-muted text-muted-foreground" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingTutorial({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-none gap-0 [&>button.absolute]:hidden">
        <DialogTitle className="sr-only">{t("tutorial.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("tutorial.title")}</DialogDescription>

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 rounded-full p-1.5 bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${current.color}`}>
                <Icon size={36} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider text-foreground mb-2">
                {t(current.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed min-h-[80px]">
                {t(current.descKey)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
          >
            <ChevronLeft size={14} />
            {t("tutorial.prev")}
          </button>

          {isLast ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              {t("tutorial.done")}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              {t("tutorial.next")}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
