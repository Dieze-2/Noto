import { useState } from "react";
import { importData } from "../lib/importExport";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        await importData(event.target?.result as string);
        setStatus("✅ Import OK");
      };
      reader.readAsText(file);
    } catch (err) { setStatus("❌ Erreur"); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="text-center">
        <img src="/icons/android-chrome-192x192.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
        <span className="page-subtitle">Système</span>
        <h1 className="page-title">Configuration</h1>
      </header>

      <section className="space-y-6 text-center">
        <div className="glass-card p-6 rounded-[2.5rem] grid grid-cols-1 gap-3">
          <label className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white cursor-pointer">
            Importer (.json)
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Exporter Backup</button>
          
          {/* BOUTON DECONNEXION */}
          <button onClick={handleLogout} className="w-full bg-rose-600/20 border border-rose-600/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-500 mt-4">Déconnexion</button>
        </div>
        {status && <p className="font-black text-xs uppercase tracking-widest text-menthe">{status}</p>}
      </section>
    </div>
  );
}