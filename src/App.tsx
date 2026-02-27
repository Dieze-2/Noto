import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import LoginPage from "./pages/LoginPage";
import TodayPage from "./pages/AppHomePage";
import WeekPage from "./pages/WeekPage";
import ImportPage from "./pages/ImportPage";
import EventsPage from "./pages/EventsPage";
import CatalogPage from "./pages/CatalogPage";
import ExportPage from "./pages/ExportPage";
import PrintPage from "./pages/PrintPage";


function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Chargement…</div>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div>
      <nav style={{ padding: 12, borderBottom: "1px solid #e5e7eb", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/">Aujourd’hui</Link>
        <Link to="/week">Semaine</Link>
        <Link to="/events">Événements</Link>
        <Link to="/catalog">Catalogue</Link>
        <Link to="/import">Import Journal</Link>
        <Link to="/export">Export</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/week" element={<WeekPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
