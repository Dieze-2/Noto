import { useState } from "react";
import { importData } from "../lib/importExport";

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

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header>
        <span className="page-subtitle">Système</span>
        <h1 className="page-title">Configuration</h1>
      </header>

      <section className="space-y-6 text-center">
        {/* Logo Branding */}
        <div className="inline-block p-6 rounded-[3rem] bg-white/5 border border-white/10 mb-4">
           <div className="w-16 h-16 bg-menthe rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,163,0.4)]">
             <span className="text-black font-black text-3xl italic">B</span>
           </div>
           <p className="mt-4 font-black text-white tracking-widest uppercase text-xs">Bio-Log Tracker</p>
           <p className="text-[9px] text-menthe font-bold mt-1">Version 3.0.0</p>
        </div>

        <div className="glass-card p-6 rounded-[2.5rem] grid grid-cols-1 gap-3">
          <label className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white cursor-pointer">
            Importer (.json)
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => window.location.hash = "/export"} className="w-full bg-white/5 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Exporter</button>
          <button onClick={() => window.location.hash = "/print"} className="w-full bg-menthe/10 border border-menthe/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-menthe">Imprimer Rapport</button>
        </div>
      </section>
    </div>
  );
}