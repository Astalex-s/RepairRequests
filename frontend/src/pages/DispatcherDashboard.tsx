import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import type { RequestRead, MasterOption, AuditEvent } from "../api/types";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ErrorBanner, parseErrorMessage } from "../components/ErrorBanner";

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
  const [historyOpen, setHistoryOpen] = useState<number | null>(null);
  const [historyByRequest, setHistoryByRequest] = useState<Record<number, AuditEvent[]>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const data = await api.get<RequestRead[]>(`/requests${params}`);
      setRequests(data);
    } catch (err) {
      setError(parseErrorMessage(err));
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
      setError(parseErrorMessage(err));
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
      setError(parseErrorMessage(err));
    } finally {
      setCancelling(null);
    }
  };

  const toggleHistory = async (id: number) => {
    if (historyOpen === id) {
      setHistoryOpen(null);
      return;
    }
    setHistoryOpen(id);
    if (historyByRequest[id] !== undefined) return;
    try {
      const data = await api.get<AuditEvent[]>(`/requests/${id}/history`);
      setHistoryByRequest((prev) => ({ ...prev, [id]: data }));
    } catch {
      setHistoryByRequest((prev) => ({ ...prev, [id]: [] }));
    }
  };

  const ACTION_LABELS: Record<string, string> = {
    create: "Создана",
    assign: "Назначена",
    cancel: "Отменена",
    take: "Взята в работу",
    done: "Выполнена",
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
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
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
                <th>История</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <React.Fragment key={r.id}>
                <tr>
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
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => toggleHistory(r.id)}
                      title="Показать историю изменений"
                    >
                      {historyOpen === r.id ? "▲ Скрыть" : "▼ История"}
                    </button>
                  </td>
                </tr>
                {historyOpen === r.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: "var(--space-3)", background: "var(--color-neutral-100)", borderTop: "none" }}>
                      {historyByRequest[r.id] === undefined ? (
                        <p className="muted">Загрузка…</p>
                      ) : historyByRequest[r.id].length === 0 ? (
                        <p className="muted">Нет событий</p>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "var(--space-5)", fontSize: "var(--font-size-0)" }}>
                          {historyByRequest[r.id].map((e) => (
                            <li key={e.id}>
                              {ACTION_LABELS[e.action] ?? e.action}
                              {e.actorUsername && ` (${e.actorUsername})`}
                              {e.oldStatus && e.newStatus && `: ${e.oldStatus} → ${e.newStatus}`}
                              {" — "}
                              {new Date(e.createdAt).toLocaleString("ru")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
                </React.Fragment>
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
