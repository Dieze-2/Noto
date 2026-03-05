import { LucideIcon } from "lucide-react";
import GlassCard from "./GlassCard";

interface StatBubbleProps {
  name: "steps" | "kcal" | "weight";
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (next: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  unit?: string;
  accent?: boolean;
  colorClass?: string;
  inputMode?: "numeric" | "decimal";
  placeholder?: string;
}

export default function StatBubble({
  name,
  icon: Icon,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  unit,
  accent,
  colorClass,
  inputMode = "numeric",
  placeholder = "",
}: StatBubbleProps) {
  const iconClass = colorClass || (accent ? "text-menthe" : "text-white/40");

  return (
    <GlassCard className="flex flex-col items-center gap-2 p-4 text-center border-white/5">
      <Icon size={20} className={iconClass} />

      <div className="w-full">
        <div className="flex items-baseline justify-center gap-1">
          <input
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.currentTarget as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
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
