import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Aujourd'hui", icon: "🗓️" },
    { path: "/week", label: "Stats", icon: "📊" },
    { path: "/catalog", label: "Exos", icon: "📖" },
    { path: "/events", label: "Agenda", icon: "✨" },
    { path: "/import", label: "Plus", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen pb-32">
      {/* Contenu principal */}
      <main className="animate-in fade-in duration-700">
        {children}
      </main>

      {/* Navigation Flottante Glassmorphism */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110" 
                    : "text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}