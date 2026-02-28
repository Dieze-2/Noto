import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "🗓️" },
    { path: "/week", icon: "📊" },
    { path: "/catalog", icon: "📖" },
    { path: "/events", icon: "✨" },
    { path: "/import", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen">
      <main>{children}</main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 bg-[var(--nav-bg)] backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-[3rem] shadow-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all ${
                  isActive 
                    ? "bg-black dark:bg-[var(--text-secondary)] text-white dark:text-black scale-110" 
                    : "text-black/40 dark:text-white/40 hover:bg-black/5"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}