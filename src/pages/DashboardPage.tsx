import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { gramsToKg } from "../lib/numberFR";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Note : On installera 'recharts' pour les graphiques au prochain push
// npm install recharts

export default function DashboardPage() {
  const { user } = useAuth();
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      // Récupération du poids des 30 derniers jours
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("date, weight_g")
        .not("weight_g", "is", null)
        .order("date", { ascending: true })
        .limit(30);

      if (!error && data) {
        setWeightHistory(data.map(d => ({
          date: format(new Date(d.date), "dd MMM", { locale: fr }),
          poids: gramsToKg(d.weight_g)
        })));
      }
      setLoading(false);
    }
    fetchStats();
  }, [user]);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-mineral-900 dark:text-white tracking-tight">Tableau de bord</h1>
        <p className="text-sauge-600 dark:text-abd1b5 text-[10px] font-black uppercase tracking-[0.3em]">Performance Insights</p>
      </header>

      {/* Carte Résumé (Focus Poids) */}
      <section className="glass-card p-6 rounded-[2.5rem] border-b-4 border-sauge-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-black uppercase text-mineral-700/40 dark:text-white/40 tracking-widest">Poids Actuel</p>
            <h2 className="text-4xl font-black text-mineral-900 dark:text-white">
              {weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].poids : "--"} <span className="text-lg">kg</span>
            </h2>
          </div>
          {/* L'indicateur % d'évolution sera ici */}
          <div className="bg-sauge-100 dark:bg-sauge-900/30 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-sauge-600 dark:text-sauge-200 text-menthe-flash">STABLE</span>
          </div>
        </div>

        {/* Placeholder pour le graphique Recharts */}
        <div className="h-48 w-full bg-sauge-50/50 dark:bg-mineral-900/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-sauge-200/50">
           <p className="text-[10px] font-black text-sauge-600 uppercase tracking-widest opacity-40 italic">Graphique en attente de données...</p>
        </div>
      </section>

      {/* Grille de perfs rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl">
          <p className="text-[9px] font-black uppercase text-sauge-600 mb-1">Max Tractions</p>
          <p className="text-xl font-black text-mineral-900 dark:text-white">PDC + 32kg</p>
        </div>
        <div className="glass-card p-5 rounded-3xl">
          <p className="text-[9px] font-black uppercase text-sauge-600 mb-1">Moy. Pas (7j)</p>
          <p className="text-xl font-black text-mineral-900 dark:text-white">8 450</p>
        </div>
      </div>
    </div>
  );
}