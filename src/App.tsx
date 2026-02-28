import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";

import LoginPage from "./pages/LoginPage";
import TodayPage from "./pages/AppHomePage";
import WeekPage from "./pages/WeekPage";
import ImportPage from "./pages/ImportPage";
import EventsPage from "./pages/EventsPage";
import CatalogPage from "./pages/CatalogPage";
import ExportPage from "./pages/ExportPage";
import PrintPage from "./pages/PrintPage";

import AppShell from "./components/AppShell";

function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/week" element={<WeekPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const basename = import.meta.env.DEV ? "" : "/Noto";

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
