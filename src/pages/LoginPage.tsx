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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Orbes décoratifs en arrière-plan pour accentuer le glassmorphism */}
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[150px]"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[3rem] p-8 shadow-2xl shadow-black/50">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Noto</h1>
            <p className="text-indigo-300/80 text-sm font-bold uppercase tracking-widest">
              {mode === "login" ? "Bon retour" : "Rejoindre l'expérience"}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ring-indigo-500/50 transition-all placeholder:text-slate-500"
                placeholder="nom@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 ring-indigo-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-indigo-300/60 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà membre ? Se connecter"}
            </button>

            {message && (
              <div className="mt-4 p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold text-center">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}