import { useState } from "react";
import { importData } from "../lib/importExport";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="text-center">
        <img src="icons/android-chrome-192x192.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Configuration</h1>
      </header>

      <section className="space-y-6">
        <div className="glass-card p-8 rounded-[3rem] grid grid-cols-1 gap-4 text-center">
          <label className="w-full bg-white/5 border border-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white cursor-pointer">
            Importer Backup <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files?.[0]; if(!file) return;
              const reader = new FileReader();
              reader.onload = async (ev) => { await importData(ev.target?.result as string); setStatus("✅ OK"); };
              reader.readAsText(file);
            }} className="hidden" />
          </label>
          <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 border border-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Exporter Backup</button>
          <button onClick={handleLogout} className="w-full bg-rose-600/20 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-500 mt-4">Déconnexion</button>
        </div>
        {status && <p className="text-center text-menthe font-black text-xs uppercase">{status}</p>}
      </section>
    </div>
  );
}