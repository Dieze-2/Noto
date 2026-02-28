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
      <main className="animate-in fade-in duration-500">{children}</main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl shadow-black/50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isActive 
                    ? "bg-menthe text-black scale-110 shadow-[0_0_20px_rgba(0,255,163,0.4)]" 
                    : "text-white/30 hover:bg-white/5"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-black rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}