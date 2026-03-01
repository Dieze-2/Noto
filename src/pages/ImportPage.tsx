import { useState } from "react";
import { importData } from "../lib/importExport";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="text-center space-y-12 mb-auto">
        <img src="./logo.png" alt="Logo" className="w-32 h-32 mx-auto object-contain" />
        <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Système</h1>
      </header>

      {/* La card commence au milieu de la page grâce au mt-auto / mb-auto ou flex-grow */}
      <section className="mt-auto space-y-6 text-center">
        <div className="glass-card p-10 rounded-[3rem] grid grid-cols-1 gap-5 shadow-2xl">
          <label className="w-full bg-white/5 border border-white/5 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white cursor-pointer hover:bg-white/10 transition-colors">
            Importer (.json)
            <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files?.[0]; if(!file) return;
              const reader = new FileReader();
              reader.onload = async (ev) => { await importData(ev.target?.result as string); setStatus("✅ Import Réussi"); };
              reader.readAsText(file);
            }} className="hidden" />
          </label>
          <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 border border-white/5 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white">Exporter Backup</button>
          <button onClick={handleLogout} className="w-full bg-rose-600/20 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-rose-500">Déconnexion</button>
        </div>
        {status && <p className="text-menthe font-black uppercase text-xs tracking-widest animate-bounce">{status}</p>}
      </section>
    </div>
  );
}