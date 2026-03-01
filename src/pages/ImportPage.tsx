import { useState } from "react";
import { importData } from "../lib/importExport";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex-1 flex flex-col items-center justify-center space-y-16">
        {/* Logo style iOS Glass identique Login */}
        <div className="w-48 h-48 relative flex items-center justify-center rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <img src="./logo.png" alt="Logo" className="w-28 h-28 object-contain filter drop-shadow-[0_0_12px_rgba(0,255,163,0.4)]" />
        </div>
        
        <div className="text-center">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">Système</h1>
            <p className="text-[10px] font-black text-menthe uppercase tracking-[0.4em] mt-2 opacity-60">Configuration</p>
        </div>
      </header>

      <section className="space-y-6 text-center">
        <div className="glass-card p-10 rounded-[3rem] grid grid-cols-1 gap-5 shadow-2xl border-t border-white/10">
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
        {status && <p className="text-menthe font-black uppercase text-xs tracking-widest animate-pulse">{status}</p>}
      </section>
    </div>
  );
}