import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { RequestRead } from "../api/types";
import { ClientError } from "../api/client";

export function MasterDashboard() {
  const [requests, setRequests] = useState<RequestRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<number | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RequestRead[]>("/master/requests");
      setRequests(data);
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleTake = async (id: number) => {
    setActing(id);
    setError(null);
    try {
      await api.patch(`/requests/${id}/take`);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка");
    } finally {
      setActing(null);
    }
  };

  const handleDone = async (id: number) => {
    setActing(id);
    setError(null);
    try {
      await api.patch(`/requests/${id}/done`);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="stack stack--lg">
      <h1>Мастер</h1>
      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={fetchRequests}>
          Обновить
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Загрузка…</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Описание</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.clientName}</td>
                  <td>{r.clientPhone}</td>
                  <td>{r.problemText}</td>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>
                    <div className="row">
                      {r.status === "assigned" && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={acting !== null}
                          onClick={() => handleTake(r.id)}
                        >
                          {acting === r.id ? "…" : "Взять в работу"}
                        </button>
                      )}
                      {r.status === "in_work" && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={acting !== null}
                          onClick={() => handleDone(r.id)}
                        >
                          {acting === r.id ? "…" : "Выполнено"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && requests.length === 0 && (
        <p className="muted">Нет назначенных заявок.</p>
      )}
    </div>
  );
}
