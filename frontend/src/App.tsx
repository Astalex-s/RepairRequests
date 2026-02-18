import { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { api } from "./api/client";
import { isAuthenticated, clearToken } from "./api/client";
import { PublicCreateRequest } from "./pages/PublicCreateRequest";
import { Login } from "./pages/Login";
import { DispatcherDashboard } from "./pages/DispatcherDashboard";
import { MasterDashboard } from "./pages/MasterDashboard";

function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    api
      .get<{ role: string }>("/auth/me")
      .then((me) => setRole(me.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);
  return { role, loading };
}

function App() {
  return (
    <>
      <header className="header">
        <Link to="/" className="header__brand">
          RepairRequests
        </Link>
        <nav className="header__nav">
          <Link to="/create" className="nav-link">
            Create request
          </Link>
          {isAuthenticated() ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                clearToken();
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="nav-link">
              Login
            </Link>
          )}
          {isAuthenticated() && (
            <Link to="/" className="nav-link">
              Панель
            </Link>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<PublicCreateRequest />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dispatcher"
            element={
              <ProtectedRoute requireRole="dispatcher">
                <DispatcherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master"
            element={
              <ProtectedRoute requireRole="master">
                <MasterDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

function HomePage() {
  const location = useLocation();
  const { role, loading } = useUserRole();
  const message = (location.state as { message?: string })?.message;

  if (isAuthenticated()) {
    if (loading) return <p className="muted">Загрузка…</p>;
    if (role === "master") return <Navigate to="/master" replace />;
    if (role === "dispatcher") return <Navigate to="/dispatcher" replace />;
  }

  return (
    <div className="stack stack--lg">
      <h1>RepairRequests</h1>
      {message && <p className="muted">{message}</p>}
      <p className="muted">
        Система управления заявками на ремонт. Создайте заявку или войдите в систему.
      </p>
    </div>
  );
}

function ProtectedRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: "dispatcher" | "master";
}) {
  const { role: userRole, loading } = useUserRole();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: { pathname: window.location.pathname } }} replace />;
  }

  if (loading) {
    return <p className="muted">Загрузка…</p>;
  }

  if (requireRole && userRole !== requireRole) {
    const redirectTo = userRole === "master" ? "/master" : "/dispatcher";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default App;
