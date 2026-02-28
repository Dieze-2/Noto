import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import AppShell from "./components/AppShell";
import React from "react";

// Import des pages
import TodayPage from "./pages/AppHomePage";
import WeekPage from "./pages/WeekPage";
import CatalogPage from "./pages/CatalogPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/ImportPage"; 
import ExportPage from "./pages/ExportPage";
import LoginPage from "./pages/LoginPage";
import PrintPage from "./pages/PrintPage";

/**
 * Gardien de route : Redirige vers /login si non authentifié
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sauge-50 dark:bg-mineral-900">
        <div className="animate-pulse text-sauge-600 font-black tracking-widest uppercase text-xs">
          Initialisation Bio-Log...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      {/* HashRouter est la solution miracle pour GitHub Pages sans erreurs de routage */}
      <HashRouter>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<LoginPage />} />

          {/* Routes privées */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <TodayPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/week"
            element={
              <PrivateRoute>
                <WeekPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <PrivateRoute>
                <CatalogPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/events"
            element={
              <PrivateRoute>
                <EventsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/import"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/export"
            element={
              <PrivateRoute>
                <ExportPage />
              </PrivateRoute>
            }
          />

          {/* Route d'impression (sans Shell) */}
          <Route path="/print" element={<PrintPage />} />

          {/* Fallback vers l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}