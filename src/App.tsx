import React from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import AppShell from "./components/AppShell";

import TodayPage from "./pages/AppHomePage";
import WeekPage from "./pages/WeekPage";
import CatalogPage from "./pages/CatalogPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import LoginPage from "./pages/LoginPage";
import PrintPage from "./pages/PrintPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-white/40 font-black tracking-widest uppercase text-xs italic">
          Initialisation...
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppShell>{children}</AppShell>;
}

function RootRedirect() {
  // Conserve ?date si quelqu’un arrive sur /?date=...
  const location = useLocation();
  return <Navigate to={`/today${location.search}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Root -> today */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RootRedirect />
              </PrivateRoute>
            }
          />

          {/* Pages privées */}
          <Route
            path="/today"
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

          {/* Print volontairement public (si tu veux le protéger, dis-le) */}
          <Route path="/print" element={<PrintPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
