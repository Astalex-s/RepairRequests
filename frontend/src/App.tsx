import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, clearToken } from "./api/client";
import { PublicCreateRequest } from "./pages/PublicCreateRequest";
import { Login } from "./pages/Login";
import { DispatcherDashboard } from "./pages/DispatcherDashboard";
import { MasterDashboard } from "./pages/MasterDashboard";

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
          <Link to="/dispatcher" className="nav-link">
            Dispatcher
          </Link>
          <Link to="/master" className="nav-link">
            Master
          </Link>
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
              <ProtectedRoute>
                <DispatcherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/master"
            element={
              <ProtectedRoute>
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
  const message = (location.state as { message?: string })?.message;

  return (
    <div className="stack stack--lg">
      <h1>RepairRequests</h1>
      {message && <p className="muted">{message}</p>}
      <p className="muted">
        Система управления заявками на ремонт. Создайте заявку, войдите как диспетчер или мастер.
      </p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: { pathname: window.location.pathname } }} replace />;
  }
  return <>{children}</>;
}

export default App;
