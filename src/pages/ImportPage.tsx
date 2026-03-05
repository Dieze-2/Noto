import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

function isStrongPassword(pwd: string) {
  if (pwd.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  return hasLetter && hasDigit && hasSpecial;
}

export default function ImportPage() {
  const [status, setStatus] = useState<string | null>(null);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  async function handleChangePassword() {
    setStatus(null);

    if (!isStrongPassword(pwd1)) {
      setStatus("MDP: 8+ / LETTRE + CHIFFRE + SPÉCIAL.");
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
      setPwdOpen(false);
      setStatus("MOT DE PASSE MIS À JOUR.");
    } catch (e: any) {
      setStatus(e?.message?.toUpperCase?.() ?? "ERREUR.");
    } finally {
      setPwdLoading(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPwdOpen(false);
    }
    if (pwdOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pwdOpen]);

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto px-4 pt-12 pb-32">
      <header className="flex-1 flex flex-col items-center justify-center">
        <div className="w-48 h-48 relative rounded-full border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden mb-12">
          <img src="./logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black text-menthe italic uppercase tracking-tighter">Système</h1>
        </div>
      </header>

      <section className="space-y-6 text-center">
        <div className="glass-card p-10 rounded-[3rem] grid grid-cols-1 gap-5 shadow-2xl border-t border-white/10">
          {/* Backup */}
          <button
            onClick={() => (window.location.hash = "/export")}
            className="w-full bg-white/5 border border-white/5 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white hover:bg-white/10"
          >
            Backup (Import / Export)
          </button>

          {/* Drawer open */}
          <button
            onClick={() => {
              setStatus(null);
              setPwdOpen(true);
            }}
            className="w-full bg-white/5 border border-white/5 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white hover:bg-white/10"
          >
            Changer le mot de passe
          </button>

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

      {/* DRAWER */}
      <AnimatePresence>
        {pwdOpen && (
          <>
            {/* Overlay */}
            <motion.button
              type="button"
              aria-label="Fermer"
              onClick={() => setPwdOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                const shouldClose = info.offset.y > 90 || info.velocity.y > 600;
                if (shouldClose) setPwdOpen(false);
              }}
              initial={{ y: 700 }}
              animate={{ y: 0 }}
              exit={{ y: 700 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 right-0 bottom-0 z-[70]"
            >
              <div className="mx-auto max-w-xl">
                <div className="rounded-t-[2.5rem] border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-[0_-30px_80px_rgba(0,0,0,0.75)]">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between relative">
                    <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                    <h2 className="text-sm font-black uppercase italic tracking-widest text-white/70">Mot de passe</h2>
                    <button type="button" onClick={() => setPwdOpen(false)} className="p-2 text-white/30 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-6 max-h-[75vh] overflow-auto no-scrollbar space-y-4">
                    <div className="glass-card p-6 rounded-[2rem] space-y-3 border border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">
                        8+ / LETTRE + CHIFFRE + SPÉCIAL
                      </p>

                      <input
                        type="password"
                        value={pwd1}
                        onChange={(e) => setPwd1(e.target.value)}
                        placeholder="Nouveau mot de passe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-white outline-none focus:border-menthe"
                      />
                      <input
                        type="password"
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        placeholder="Confirmer"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black uppercase italic text-white outline-none focus:border-menthe"
                      />

                      <button
                        type="button"
                        disabled={pwdLoading}
                        onClick={handleChangePassword}
                        className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest ${
                          pwdLoading ? "bg-white/5 text-white/20 border border-white/10" : "bg-menthe text-black"
                        }`}
                      >
                        {pwdLoading ? "..." : "Mettre à jour"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
