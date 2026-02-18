import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { RequestRead } from "../api/types";
import { ClientError } from "../api/client";

const STATUS_OPTIONS = ["", "new", "assigned", "in_work", "done", "cancelled"];

export function DispatcherDashboard() {
  const [requests, setRequests] = useState<RequestRead[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [assignForm, setAssignForm] = useState<Record<number, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const data = await api.get<RequestRead[]>(`/requests${params}`);
      setRequests(data);
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAssign = async (id: number) => {
    const masterId = assignForm[id];
    if (!masterId || !/^\d+$/.test(masterId)) return;
    setAssigning(id);
    setError(null);
    try {
      await api.patch(`/requests/${id}/assign`, { masterId: parseInt(masterId, 10) });
      setAssignForm((f) => ({ ...f, [id]: "" }));
      await fetchRequests();
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка назначения");
    } finally {
      setAssigning(null);
    }
  };

  const handleCancel = async (id: number) => {
    setCancelling(id);
    setError(null);
    try {
      await api.patch(`/requests/${id}/cancel`);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof ClientError ? err.body.message : "Ошибка отмены");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="stack stack--lg">
      <h1>Диспетчер</h1>
      <div className="row">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="statusFilter" className="label">
            Статус
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "_"} value={s}>
                {s || "все"}
              </option>
            ))}
          </select>
        </div>
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
                <th>Мастер</th>
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
                  <td>{r.assignedTo ?? "—"}</td>
                  <td>
                    <div className="row">
                      {r.status === "new" && (
                        <>
                          <input
                            type="number"
                            placeholder="ID мастера"
                            value={assignForm[r.id] ?? ""}
                            onChange={(e) =>
                              setAssignForm((f) => ({ ...f, [r.id]: e.target.value }))
                            }
                            style={{ width: "100px" }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={assigning !== null}
                            onClick={() => handleAssign(r.id)}
                          >
                            {assigning === r.id ? "…" : "Назначить"}
                          </button>
                        </>
                      )}
                      {(r.status === "new" || r.status === "assigned" || r.status === "in_work") && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={cancelling !== null}
                          onClick={() => handleCancel(r.id)}
                        >
                          {cancelling === r.id ? "…" : "Отменить"}
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
        <p className="muted">Заявок нет.</p>
      )}
    </div>
  );
}
