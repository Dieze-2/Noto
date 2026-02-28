import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      navigate("/", { replace: true });
    }
  }, [authLoading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Compte créé. Vérifie tes e-mails.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-sauge-50 via-sauge-100 to-abd1b5 dark:from-mineral-900 dark:via-mineral-800 dark:to-0a0e0e">
      {/* Reflets décoratifs Sauge/Minéral */}
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-sauge-200/40 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-mineral-800/10 rounded-full blur-[150px]"></div>

      <div className="relative w-full max-w-md">
        <div className="glass-card bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-slate-800/50 rounded-[3rem] p-10 shadow-2xl shadow-mineral-900/10 dark:shadow-black/50">
          <header className="text-center mb-10 space-y-3">
            {/* Logo Noto Intégré (N en CSS inspiré par le logo généré) */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-mineral-800 dark:bg-sauge-100 rounded-[2rem] flex items-center justify-center shadow-xl">
                <span className="text-4xl font-black text-white dark:text-mineral-900">N</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-mineral-900 dark:text-white tracking-tight">NOTO</h1>
            <p className="text-sauge-600 dark:text-abd1b5 text-[10px] font-black uppercase tracking-[0.3em]">
              Bio-Metric Performance
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sauge-600 dark:text-abd1b5 uppercase tracking-widest ml-4">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-sauge-50/50 border border-sauge-100 p-4 rounded-2xl text-mineral-900 dark:text-white outline-none focus:ring-2 ring-sauge-200 transition-all placeholder:text-mineral-800/40"
                placeholder="nom@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-sauge-600 dark:text-abd1b5 uppercase tracking-widest ml-4">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-sauge-50/50 border border-sauge-100 p-4 rounded-2xl text-mineral-900 dark:text-white outline-none focus:ring-2 ring-sauge-200 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mineral-800 text-white dark:bg-abd1b5 dark:text-mineral-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-mineral-700/60 dark:text-abd1b5 text-[10px] font-black uppercase tracking-widest hover:text-mineral-900 dark:hover:text-white transition-colors"
            >
              {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà membre ? Se connecter"}
            </button>

            {message && (
              <div className="mt-4 p-4 rounded-2xl bg-sauge-200/20 border border-sauge-200 text-sauge-600 dark:text-abd1b5 text-xs font-bold text-center">
                {message}
              </div>
            )}
          </form>
        </div>
      </footer>
    </div>
  );
}