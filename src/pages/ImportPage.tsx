import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  async function handleChangePassword() {
    setStatus(null);

    if (!pwd1 || pwd1.length < 8) {
      setStatus("MOT DE PASSE TROP COURT (MIN 8).");
      return;
    }
    if (pwd1 !== pwd2) {
      setStatus("CONFIRMATION INCORRECTE.");
      return;
    }

    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd1 });
      if (error) throw error;

      setPwd1("");
      setPwd2("");
      setStatus("MOT DE PASSE MIS À JOUR.");
    } catch (e: any) {
      setStatus(e?.message?.toUpperCase?.() ?? "ERREUR.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex-1 flex flex-col items-center justify-center">
        <div className="w-48 h-48 relative rounded-full border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden mb-12">
          <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Système</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2">Profil / Backup</p>
        </div>
      </header>

      <section className="space-y-6 text-center">
        <div className="glass-card p-10 rounded-[3rem] grid grid-cols-1 gap-5 shadow-2xl border-t border-white/10">
          {/* Backup (redirige vers page Export/Import) */}
          <button
            onClick={() => (window.location.hash = "/export")}
            className="w-full bg-white/5 border border-white/5 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white hover:bg-white/10"
          >
            Backup (Import / Export)
          </button>

          {/* Changement mot de passe */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Mot de passe</p>

            <input
              type="password"
              value={pwd1}
              onChange={(e) => setPwd1(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-white outline-none focus:border-menthe"
            />
            <input
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              placeholder="Confirmer"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-white outline-none focus:border-menthe"
            />

            <button
              onClick={handleChangePassword}
              disabled={pwdLoading}
              className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest ${
                pwdLoading ? "bg-white/5 text-white/20 border border-white/10" : "bg-menthe text-black"
              }`}
            >
              {pwdLoading ? "..." : "Mettre à jour"}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-rose-600/20 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-rose-500"
          >
            Déconnexion
          </button>
        </div>

        {status && <p className="text-menthe font-black uppercase text-xs tracking-widest mt-4">{status}</p>}
      </section>
    </div>
  );
}
