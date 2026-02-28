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
    <div className="min-h-screen">
      <main className="animate-in fade-in duration-700">
        {children}
      </main>

      {/* Navigation Flottante Ultra-Contraste */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 bg-white/90 dark:bg-mineral-950/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-[3rem] shadow-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "bg-black dark:bg-menthe-flash text-white dark:text-black scale-110 shadow-xl" 
                    : "text-black/30 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-current rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}