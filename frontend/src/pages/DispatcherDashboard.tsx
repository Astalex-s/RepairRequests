import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { RequestRead, MasterOption } from "../api/types";
import { ClientError } from "../api/client";
import { useCurrentUser } from "../hooks/useCurrentUser";

const STATUS_OPTIONS = ["", "new", "assigned", "in_progress", "done", "cancelled"];

export function DispatcherDashboard() {
  const { user } = useCurrentUser();
  const [masters, setMasters] = useState<MasterOption[]>([]);
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

  useEffect(() => {
    api
      .get<MasterOption[]>("/users/masters")
      .then(setMasters)
      .catch(() => setMasters([]));
  }, []);

  const handleAssign = async (id: number) => {
    const masterId = assignForm[id];
    if (!masterId) return;
    const idNum = parseInt(masterId, 10);
    if (isNaN(idNum)) return;
    setAssigning(id);
    setError(null);
    try {
      await api.patch(`/requests/${id}/assign`, { masterId: idNum });
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
      <h1>Диспетчер{user?.username ? ` — ${user.username}` : ""}</h1>
      <div className="row">
        <label htmlFor="statusFilter" className="label" style={{ marginBottom: 0 }}>
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
                  <td>{r.assignedToUsername ?? r.assignedTo ?? "—"}</td>
                  <td>
                    <div className="row">
                      {r.status === "new" && (
                        <>
                          <select
                            value={assignForm[r.id] ?? ""}
                            onChange={(e) =>
                              setAssignForm((f) => ({ ...f, [r.id]: e.target.value }))
                            }
                            style={{ minWidth: "120px" }}
                          >
                            <option value="">Выберите мастера</option>
                            {masters.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.username}
                              </option>
                            ))}
                          </select>
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
                      {(r.status === "new" || r.status === "assigned" || r.status === "in_progress") && (
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
