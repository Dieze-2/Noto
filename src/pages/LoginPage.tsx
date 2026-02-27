
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

 

export default function LoginPage() {

  const navigate = useNavigate();

 

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"login" | "signup">("login");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

 

  // Si déjà connecté, on redirige

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {

      if (data.session) navigate("/", { replace: true });

    });

  }, [navigate]);

 

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    setLoading(true);

    setMessage(null);

 

    try {

      if (mode === "signup") {

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) throw error;

 

        // Selon ta config Supabase, l’email peut devoir être confirmé.

        setMessage("Compte créé. Si la confirmation email est activée, valide ton email puis connecte-toi.");

        setMode("login");

        return;

      }

 

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

 

      // Debug utile

      console.log("Login OK session:", data.session);

 

      // Redirection immédiate

      navigate("/", { replace: true });

    } catch (err: any) {

      console.error(err);

      setMessage(err?.message ?? "Erreur inconnue");

    } finally {

      setLoading(false);

    }

  }

 

  return (

    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>

      <h1>Journal de bord</h1>

      <p>Connexion requise (session mémorisée).</p>

 

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>

        <label>

          Email

          <input

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            type="email"

            required

            autoComplete="email"

            style={{ width: "100%", padding: 10 }}

          />

        </label>

 

        <label>

          Mot de passe

          <input

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            type="password"

            required

            autoComplete={mode === "signup" ? "new-password" : "current-password"}

            style={{ width: "100%", padding: 10 }}

          />

        </label>

 

        <button type="submit" disabled={loading} style={{ padding: 12 }}>

          {loading ? "..." : mode === "signup" ? "Créer le compte" : "Se connecter"}

        </button>

 

        <button

          type="button"

          onClick={() => {

            setMessage(null);

            setMode(mode === "signup" ? "login" : "signup");

          }}

          style={{ padding: 12 }}

        >

          {mode === "signup" ? "J’ai déjà un compte" : "Créer un compte"}

        </button>

 

        {message && (

          <div style={{ background: "#111827", color: "white", padding: 12 }}>

            {message}

          </div>

        )}

      </form>

    </div>

  );

}