import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
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

  // If already logged in, leave /login
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
        setMessage("Compte créé. Tu peux maintenant te connecter.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // redirect immediately
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setMessage(err?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Noto</CardTitle>
            <div className="text-sm text-slate-600">
              Connecte-toi pour accéder à ton journal.
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <Label>Mot de passe</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "..." : mode === "signup" ? "Créer le compte" : "Se connecter"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMessage(null);
                  setMode(mode === "signup" ? "login" : "signup");
                }}
              >
                {mode === "signup" ? "J’ai déjà un compte" : "Créer un compte"}
              </Button>

              {message && (
                <div className="rounded-md bg-slate-900 text-white p-3 text-sm">
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
