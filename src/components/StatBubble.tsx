import { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";

interface StatBubbleProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  accent?: boolean;
  colorClass?: string;
  inputMode?: "numeric" | "decimal";
  placeholder?: string;
}

export default function StatBubble({
  icon: Icon,
  label,
  value,
  onChange,
  unit,
  accent,
  colorClass,
  inputMode = "numeric",
  placeholder = "0",
}: StatBubbleProps) {
  const iconClass = colorClass || (accent ? "text-menthe" : "text-white/40");

  return (
    <GlassCard className="flex flex-col items-center gap-2 p-4 text-center border-white/5">
      <Icon size={20} className={iconClass} />

      <div className="w-full">
        <div className="flex items-baseline justify-center gap-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode={inputMode}
            placeholder={placeholder}
            className="w-full bg-transparent text-center text-2xl font-black tabular-nums text-white outline-none uppercase italic placeholder:text-white/10"
          />
          {unit && <span className="text-sm font-semibold text-white/40">{unit}</span>}
        </div>

        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">{label}</p>
      </div>
    </GlassCard>
  );
}
