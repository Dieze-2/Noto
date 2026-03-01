import { exportData } from "../lib/importExport";

export default function ExportPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="relative text-center">
        <button onClick={() => window.history.back()} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 font-black text-[10px] uppercase tracking-widest">← Retour</button>
        
      </header>

      <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 border-b-4 border-menthe">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl border border-white/10">📦</div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Sauvegarde Totale</h2>
          <p className="text-[11px] font-bold text-white/40 mt-2 uppercase tracking-widest leading-relaxed">Générez un fichier JSON de vos données.</p>
        </div>
        <button onClick={exportData} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Générer le fichier</button>
      </div>

      <div className="glass-card p-6 rounded-[2rem] opacity-50">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] text-center">
          Format compatible avec la fonction "Importer" de l'onglet Configuration.
        </p>
      </div>
    </div>
  );
}