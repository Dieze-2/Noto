import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { gramsToKg } from "../lib/numberFR";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import GlassCard from "../components/GlassCard";

export default function DashboardPage() {
  const { session } = useAuth();
  const user = session?.user;

  const [weightHistory, setWeightHistory] = useState<{ date: string; poids: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_g")
        .not("weight_g", "is", null)
        .order("date", { ascending: true })
        .limit(30);

      if (!error && data) {
        setWeightHistory(
          data.map((d) => ({
            date: format(new Date(d.date), "dd MMM", { locale: fr }),
            poids: gramsToKg(d.weight_g),
          }))
        );
      }
      setLoading(false);
    }

    fetchStats().catch(() => setLoading(false));
  }, [user]);

  const currentWeight = weightHistory.length ? weightHistory[weightHistory.length - 1].poids : null;

  return (
    <div className="max-w-xl mx-auto px-4 pt-12 pb-32 space-y-8">
      <header className="text-center">
        <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Dashboard</h1>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">Insights</p>
      </header>

      <GlassCard className="p-6 rounded-[2.5rem] border border-white/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Poids actuel</p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-5xl font-black uppercase italic text-white">
            {loading ? "--" : currentWeight?.toFixed(1) ?? "--"}
          </p>
          <p className="text-sm font-black uppercase text-white/40 pb-2">kg</p>
        </div>

        <div className="mt-6 h-40 w-full rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">
            Charts à implémenter
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 rounded-3xl border border-white/10">
          <p className="text-[9px] font-black uppercase text-white/30 mb-1 tracking-widest">RP Tractions</p>
          <p className="text-xl font-black uppercase italic text-white/80">—</p>
        </GlassCard>

        <GlassCard className="p-5 rounded-3xl border border-white/10">
          <p className="text-[9px] font-black uppercase text-white/30 mb-1 tracking-widest">Moy. pas (7j)</p>
          <p className="text-xl font-black uppercase italic text-white/80">—</p>
        </GlassCard>
      </div>
    </div>
  );
}
