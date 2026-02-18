import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { RequestCreate } from "../api/types";
import { ClientError } from "../api/client";

export function PublicCreateRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RequestCreate>({
    clientName: "",
    clientPhone: "",
    problemText: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body: RequestCreate = {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        problemText: form.problemText.trim(),
        address: (form.address ?? "").trim() || undefined,
      };
      await api.post("/requests", body);
      navigate("/", { state: { message: "Заявка создана" } });
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка при создании заявки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack stack--lg">
      <h1>Создать заявку</h1>
      <form onSubmit={handleSubmit} className="stack stack--lg">
        <div className="field">
          <label htmlFor="clientName" className="label">
            Имя клиента
          </label>
          <input
            id="clientName"
            type="text"
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="clientPhone" className="label">
            Телефон
          </label>
          <input
            id="clientPhone"
            type="tel"
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="problemText" className="label">
            Описание проблемы
          </label>
          <textarea
            id="problemText"
            value={form.problemText}
            onChange={(e) => setForm((f) => ({ ...f, problemText: e.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="address" className="label">
            Адрес (необязательно)
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Отправка…" : "Создать заявку"}
          </button>
        </div>
      </form>
    </div>
  );
}
