import type { ApiError } from "../api/client";

const FIELD_LABELS: Record<string, string> = {
  clientName: "Имя клиента",
  clientPhone: "Телефон",
  problemText: "Описание проблемы",
  address: "Адрес",
  body: "",
};

/** Parse API error into user-friendly message. */
export function parseErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "body" in err) {
    const body = (err as { body: ApiError }).body;
    if (body.details && Array.isArray(body.details)) {
      const parts = body.details.map((d: { loc?: unknown[]; msg?: string }) => {
        const loc = Array.isArray(d.loc) ? d.loc : [];
        const fieldKey = loc.filter((x) => typeof x === "string" && x !== "body").pop();
        const field = typeof fieldKey === "string" ? (FIELD_LABELS[fieldKey] ?? fieldKey) : "";
        return field ? `${field}: ${d.msg ?? ""}` : (d.msg ?? "").toString();
      });
      return parts.filter(Boolean).join("; ") || body.message;
    }
    return body.message ?? "Ошибка запроса";
  }
  return "Ошибка запроса";
}

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="error-banner" role="alert">
      <span>{error}</span>
      {onDismiss && (
        <button
          type="button"
          className="btn btn-ghost error-banner__dismiss"
          onClick={onDismiss}
          aria-label="Закрыть"
        >
          ×
        </button>
      )}
    </div>
  );
}
