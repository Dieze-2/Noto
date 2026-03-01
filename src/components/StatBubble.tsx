import { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";

interface StatBubbleProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
  colorClass?: string; // Nouvelle prop pour les couleurs spécifiques
}

export default function StatBubble({ icon: Icon, label, value, unit, accent, colorClass }: StatBubbleProps) {
  return (
    <GlassCard className="flex flex-col items-center gap-2 p-4 text-center">
      {/* Utilise colorClass si fournie, sinon retombe sur la logique accent/menthe */}
      <Icon size={20} className={colorClass || (accent ? "text-menthe" : "text-white/40")} />
      <div>
        <p className="text-2xl font-black tabular-nums text-white">
          {value}
          {unit && <span className="text-sm font-semibold text-white/40 ml-0.5">{unit}</span>}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">{label}</p>
      </div>
    </GlassCard>
  );
}