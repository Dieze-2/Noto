import { useState } from "react";
import { exportData, importData } from "../lib/importExport";

export default function ExportPage() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8">
      <header className="relative text-center">
        <button
          onClick={() => window.history.back()}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40 font-black text-[10px] uppercase tracking-widest"
        >
          ← Retour
        </button>
        <h1 className="text-4xl font-black text-menthe italic uppercase tracking-tighter">Backup</h1>
      </header>

      {/* EXPORT */}
      <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 border-b-4 border-menthe">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl border border-white/10">
          📦
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Sauvegarde Totale</h2>
          <p className="text-[11px] font-bold text-white/40 mt-2 uppercase tracking-widest leading-relaxed">
            Générez un fichier JSON de vos données.
          </p>
        </div>
        <button
          onClick={() => {
            setStatus(null);
            exportData();
            setStatus("EXPORT GÉNÉRÉ.");
          }}
          className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
        >
          Générer le fichier
        </button>
      </div>

      {/* IMPORT */}
      <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 border-b-4 border-white/10">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl border border-white/10">
          ⬆
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Restauration</h2>
          <p className="text-[11px] font-bold text-white/40 mt-2 uppercase tracking-widest leading-relaxed">
            Importez un fichier JSON (format NOTO).
          </p>
        </div>

        <label className="w-full block bg-white/5 border border-white/10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white cursor-pointer hover:bg-white/10">
          Importer (.json)
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              setStatus(null);
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = async (ev) => {
                try {
                  await importData(ev.target?.result as string);
                  setStatus("IMPORT OK.");
                } catch (err: any) {
                  setStatus(err?.message?.toUpperCase?.() ?? "IMPORT FAIL.");
                }
              };
              reader.readAsText(file);

              // reset input (permet re-import du même fichier)
              e.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {status && (
        <div className="glass-card p-6 rounded-[2rem]">
          <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] text-center">{status}</p>
        </div>
      )}

      <div className="glass-card p-6 rounded-[2rem] opacity-50">
        <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] text-center">
          Format compatible NOTO. Import écrase/merge selon la logique du module importExport.
        </p>
      </div>
    </div>
  );
}
