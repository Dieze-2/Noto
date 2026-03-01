import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Footprints, CalendarDays, BookOpen, Sparkles, Settings } from "lucide-react";

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: <Footprints size={24} /> },
    { path: "/week", icon: <CalendarDays size={24} /> },
    { path: "/catalog", icon: <BookOpen size={24} /> },
    { path: "/events", icon: <Sparkles size={24} /> },
    { path: "/import", icon: <Settings size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <main className="animate-in fade-in duration-500">
        {children}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="flex items-center justify-around p-2 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isActive ? "bg-menthe text-black scale-110 shadow-[0_0_20px_rgba(0,255,163,0.3)]" : "text-white/30"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
