import { Routes, Route, Link } from "react-router-dom";

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
          <Link to="/login" className="nav-link">
            Login
          </Link>
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
          <Route path="/create" element={<PlaceholderPage title="Create request" />} />
          <Route path="/login" element={<PlaceholderPage title="Login" />} />
          <Route path="/dispatcher" element={<PlaceholderPage title="Dispatcher" />} />
          <Route path="/master" element={<PlaceholderPage title="Master" />} />
        </Routes>
      </main>
    </>
  );
}

function HomePage() {
  return (
    <div className="stack stack--lg">
      <h1>RepairRequests</h1>
      <p className="muted">
        Система управления заявками на ремонт. Создайте заявку, войдите как диспетчер или мастер.
      </p>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="stack stack--lg">
      <h1>{title}</h1>
      <p className="muted">Страница в разработке.</p>
    </div>
  );
}

export default App;
