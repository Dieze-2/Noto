import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Aujourd’hui" },
  { to: "/week", label: "Semaine" },
  { to: "/events", label: "Événements" },
  { to: "/catalog", label: "Catalogue" },
  { to: "/import", label: "Import" },
  { to: "/export", label: "Export" },
];

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  // Basculer le mode sombre
  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Persistance au chargement
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400">Noto</div>
              <button 
                onClick={toggleDark}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 sm:ml-4 text-lg"
              >
                {isDark ? "☀️" : "🌙"}
              </button>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links.map((l) => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      "inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "bg-slate-900 text-white border-transparent dark:bg-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
                      "border shadow-sm"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}