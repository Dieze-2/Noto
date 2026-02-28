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
    <div className="min-h-screen bg-black flex flex-col justify-center px-6 py-12">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          {/* LOGO EN GRAND */}
          <img src="/icons/android-chrome-512x512.png" alt="Logo" className="w-32 h-32 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Bio-Log</h2>
          <p className="text-menthe text-[10px] font-black uppercase tracking-[0.3em] mt-2">Elite Performance Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-[3rem] space-y-6 border-b-4 border-menthe">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:ring-2 ring-menthe transition-all"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:ring-2 ring-menthe transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-white/40 text-[9px] font-black uppercase tracking-widest hover:text-menthe transition-colors"
          >
            {mode === "login" ? "Créer un compte" : "Déjà membre ? Connexion"}
          </button>

          {message && (
            <div className="p-4 bg-white/5 rounded-xl text-center">
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">{message}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}