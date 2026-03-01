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
    } catch (e: any) { setMessage(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo Circulaire Glassmorphism */}
      <div className="w-56 h-56 mb-16 relative flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
        <img 
          src="./logo.png" 
          alt="Logo" 
          className="w-full h-full object-cover scale-110" 
        />
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] rounded-full" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-menthe" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-menthe" />
          <button type="submit" disabled={loading} className="w-full bg-menthe text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest">{loading ? "..." : mode === "login" ? "Connexion" : "Inscription"}</button>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest">{mode === "login" ? "Créer un compte" : "Déjà membre ?"}</button>
        </form>
        {message && <p className="text-xs font-bold text-white text-center uppercase italic">{message}</p>}
      </div>
    </div>
  );
}