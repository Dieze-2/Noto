import { useState, useEffect } from "react";
import { exportAllDataToJSON } from "../db/export";

export default function SettingsPage() {
  // --- LOGIQUE DE THÈME ---
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-light', 'theme-dark');
    
    if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      // Auto : suit les préférences système
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- LOGIQUE D'IMPORT ---
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        console.log("Données reçues:", json);
        alert("Importation réussie (Logique de fusion à finaliser en DB)");
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-32 space-y-8 animate-in fade-in duration-500">
      {/* Header avec Logo */}
      <header className="flex flex-col items-center gap-4 px-2">
        <div className="w-20 h-20 bg-mineral-800 dark:bg-sauge-200 rounded-[2rem] flex items-center justify-center shadow-xl">
          <span className="text-3xl font-black text-white dark:text-mineral-900">N</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-mineral-900 dark:text-white">Configuration</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sauge-600">Noto Ecosystem</p>
        </div>
      </header>

      {/* Sélecteur de Thème */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4">
        <h2 className="text-[10px] font-black uppercase text-mineral-700/50 tracking-widest ml-2">Apparence globale</h2>
        <div className="flex bg-sauge-100 dark:bg-mineral-900/50 p-1.5 rounded-2xl gap-1">
          {['auto', 'light', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                theme === t 
                  ? 'bg-white dark:bg-mineral-800 shadow-lg text-mineral-900 dark:text-sauge-200 scale-[1.02]' 
                  : 'text-mineral-700/40'
              }`}
            >
              {t === 'auto' ? 'Système' : t === 'light' ? 'Clair' : 'Sombre'}
            </button>
          ))}
        </div>
      </section>

      {/* Gestion des Données */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black uppercase text-mineral-700/50 tracking-widest ml-4">Données & Sauvegarde</h2>
        
        <div className="grid gap-3">
          {/* Export */}
          <button 
            onClick={exportAllDataToJSON}
            className="group flex items-center gap-4 p-5 glass-card rounded-3xl transition-all active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-sauge-100 dark:bg-sauge-900/20 flex items-center justify-center text-xl">📤</div>
            <div className="text-left">
              <p className="font-black text-sm text-mineral-900 dark:text-white">Exporter le Backup</p>
              <p className="text-[10px] font-bold text-mineral-700/40 uppercase">Format .JSON universel</p>
            </div>
          </button>

          {/* Import */}
          <label className="group flex items-center gap-4 p-5 glass-card rounded-3xl cursor-pointer active:scale-95">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <div className="w-12 h-12 rounded-2xl bg-mineral-100 dark:bg-mineral-800 flex items-center justify-center text-xl">📥</div>
            <div className="text-left">
              <p className="font-black text-sm text-mineral-900 dark:text-white">Importer des données</p>
              <p className="text-[10px] font-bold text-mineral-700/40 uppercase">Restaurer un fichier</p>
            </div>
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 space-y-4">
        <div className="flex items-center gap-2 text-rose-500">
          <span className="text-xs">⚠️</span>
          <h2 className="text-[10px] font-black uppercase tracking-widest">Zone critique</h2>
        </div>
        <button 
          onClick={() => confirm("Voulez-vous vraiment supprimer toutes vos données locales ?") && localStorage.clear()}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
        >
          Réinitialiser l'application
        </button>
      </section>

      <footer className="text-center opacity-20 py-4">
        <p className="text-[8px] font-black uppercase tracking-widest">Noto v2.0.26 — Bio-Design Edition</p>
      </footer>
    </div>
  );
}