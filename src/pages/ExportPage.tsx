import { useState } from "react";
import { exportAllDataToJSON } from "../db/export"; // Supposons que tu as cette fonction

export default function ExportPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">
      <header className="px-2">
        <button onClick={() => window.history.back()} className="text-sauge-600 font-bold text-sm mb-4">← Retour</button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Export & Backup</h1>
      </header>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-3xl mx-auto">💾</div>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Sauvegarder vos données</h2>
          <p className="text-sm text-slate-400 mt-2">Exportez l'intégralité de votre journal au format JSON pour une sauvegarde externe.</p>
        </div>
        <button 
          onClick={() => exportAllDataToJSON()}
          className="w-full bg-mineral-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sauge-600/20 active:scale-95 transition-all"
        >
          Générer le fichier .json
        </button>
      </div>
    </div>
  );
}