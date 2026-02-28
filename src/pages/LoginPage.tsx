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
    if (!authLoading && session) navigate("/", { replace: true });
  }, [authLoading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Vérifie tes e-mails.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) { setMessage(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
          <img src="/icons/android-chrome-512x512.png" alt="Logo" className="w-40 h-40 mx-auto drop-shadow-[0_0_30px_rgba(0,255,163,0.3)]" />
          <h1 className="page-title text-4xl italic">BIO-LOG</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-10 rounded-[3.5rem] space-y-6">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-menthe" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-menthe" required />
          
          <button type="submit" disabled={loading} className="w-full bg-menthe text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
            {loading ? "..." : mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>

          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-[10px] font-black text-white/30 uppercase tracking-widest">
            {mode === "login" ? "Créer un compte" : "Déjà membre ? Connexion"}
          </button>
          {message && <p className="text-menthe text-[10px] font-black uppercase">{message}</p>}
        </form>
      </div>
    </div>
  );
}