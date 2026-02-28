import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { importData } from "../lib/importExport";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-10 text-center">
      <header>
        <img src="/icons/android-chrome-192x192.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 object-contain" />
        <span className="page-subtitle">Système</span>
        <h1 className="page-title italic">Configuration</h1>
      </header>

      <div className="glass-card p-8 rounded-[3rem] space-y-4">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Gestion des données</p>
        <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 py-5 rounded-2xl font-black text-xs text-white uppercase tracking-widest border border-white/5 active:bg-white/10">Exporter Backup (.json)</button>
        <label className="block w-full bg-white/5 py-5 rounded-2xl font-black text-xs text-white uppercase tracking-widest cursor-pointer border border-white/5 active:bg-white/10">
          Importer JSON <input type="file" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => { await importData(ev.target?.result as string); setStatus("✅ OK"); };
            reader.readAsText(file);
          }} />
        </label>
        {status && <p className="text-menthe font-black text-[10px] uppercase">{status}</p>}
      </div>

      <div className="glass-card p-8 rounded-[3rem] border-t-4 border-rose-600/30">
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">Session</p>
        <button 
          onClick={handleLogout}
          className="w-full bg-rose-600/10 text-rose-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-600/20 active:bg-rose-600 active:text-white transition-all"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}