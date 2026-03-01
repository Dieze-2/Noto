import { useState } from "react";
import { importData } from "../lib/importExport";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="text-center space-y-4">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto object-contain" />
        <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Système</h1>
      </header>

      <section className="space-y-6 text-center">
        <div className="glass-card p-8 rounded-[2.5rem] grid grid-cols-1 gap-4">
          <label className="w-full bg-white/5 border border-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white cursor-pointer">
            Importer (.json)
            <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files?.[0]; if(!file) return;
              const reader = new FileReader();
              reader.onload = async (ev) => { await importData(ev.target?.result as string); setStatus("✅ Import Réussi"); };
              reader.readAsText(file);
            }} className="hidden" />
          </label>
          <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 border border-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Exporter Backup</button>
          <button onClick={handleLogout} className="w-full bg-rose-600/20 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-500">Déconnexion</button>
        </div>
        {status && <p className="text-menthe font-black uppercase text-xs tracking-widest animate-pulse">{status}</p>}
      </section>
    </div>
  );
}