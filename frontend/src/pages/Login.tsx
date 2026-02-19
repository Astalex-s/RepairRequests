import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api/client";
import { ErrorBanner, parseErrorMessage } from "../components/ErrorBanner";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.set("username", username.trim());
      formData.set("password", password);
      const res = await api.postForm<{ accessToken: string }>("/auth/token", formData);
      setToken(res.accessToken);
      navigate("/");
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack stack--lg">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} className="stack stack--lg">
        <div className="field">
          <label htmlFor="username" className="label">
            Логин
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password" className="label">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Вход…" : "Войти"}
          </button>
        </div>
      </form>
    </div>
  );
}
