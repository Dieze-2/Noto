import { useState } from "react";
import { Link } from "react-router-dom";

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-24 space-y-8">
      <header className="px-2">
        <p className="text-xs font-black tracking-[0.2em] text-indigo-500 uppercase mb-1">Configuration</p>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Paramètres</h1>
      </header>

      <section className="grid gap-4">
        <Link to="/import" className="group p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:border-indigo-500/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xl">📥</div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Importation CSV</h2>
            <p className="text-xs text-slate-400">Fusionner vos données externes</p>
          </div>
        </Link>

        <Link to="/export" className="group p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:border-emerald-500/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-xl">📤</div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Exportation & Backup</h2>
            <p className="text-xs text-slate-400">Télécharger votre journal (CSV/PDF)</p>
          </div>
        </Link>
      </section>

      <div className="p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30">
        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Zone de danger</p>
        <button className="text-sm font-bold text-rose-600 dark:text-rose-400">Réinitialiser les données locales</button>
      </div>
    </div>
  );
}