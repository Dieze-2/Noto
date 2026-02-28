import { exportData } from "../lib/importExport";

export default function ExportPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="relative">
        <button 
          onClick={() => window.history.back()} 
          className="absolute left-0 top-1/2 -translate-y-1/2 text-menthe font-black text-[10px] uppercase tracking-widest"
        >
          ← Retour
        </button>
        <span className="page-subtitle">Sécurité</span>
        <h1 className="page-title">Exportation</h1>
      </header>

      <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 border-b-4 border-menthe">
        <div className="w-20 h-20 bg-menthe/10 rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_20px_rgba(0,255,163,0.1)]">
          📦
        </div>
        
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Sauvegarde Totale</h2>
          <p className="text-[11px] font-bold text-white/40 mt-2 uppercase tracking-widest leading-relaxed">
            Générez un fichier JSON contenant l'intégralité de vos mesures, entraînements, catalogue et événements.
          </p>
        </div>

        <button 
          onClick={exportData}
          className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,255,163,0.2)] active:scale-95 transition-all"
        >
          Générer le fichier .json
        </button>
      </div>

      <div className="glass-card p-6 rounded-[2rem] opacity-50">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] text-center">
          Format compatible avec la fonction "Importer" de l'onglet Configuration.
        </p>
      </div>
    </div>
  );
}