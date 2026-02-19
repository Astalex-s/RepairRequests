import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import type { RequestRead, AuditEvent } from "../api/types";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ErrorBanner, parseErrorMessage } from "../components/ErrorBanner";

const ACTION_LABELS: Record<string, string> = {
  create: "Создана",
  assign: "Назначена",
  cancel: "Отменена",
  take: "Взята в работу",
  done: "Выполнена",
};

export function MasterDashboard() {
  const { user } = useCurrentUser();
  const [requests, setRequests] = useState<RequestRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState<number | null>(null);
  const [historyByRequest, setHistoryByRequest] = useState<Record<number, AuditEvent[]>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RequestRead[]>("/master/requests");
      setRequests(data);
    } catch (err) {
      setError(parseErrorMessage(err));
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
      setError(parseErrorMessage(err));
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
      setError(parseErrorMessage(err));
    } finally {
      setActing(null);
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
      const data = await api.get<AuditEvent[]>(`/master/requests/${id}/history`);
      setHistoryByRequest((prev) => ({ ...prev, [id]: data }));
    } catch {
      setHistoryByRequest((prev) => ({ ...prev, [id]: [] }));
    }
  };

  return (
    <div className="stack stack--lg">
      <h1>Мастер{user?.username ? ` — ${user.username}` : ""}</h1>
      <div className="row">
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
                      {r.status === "in_progress" && (
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
                    <td colSpan={7} style={{ padding: "var(--space-3)", background: "var(--color-neutral-100)", borderTop: "none" }}>
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
        <p className="muted">Нет назначенных заявок.</p>
      )}
    </div>
  );
}
