# RepairRequests

Система управления заявками на ремонт. FastAPI + React + PostgreSQL + Docker.

## Функционал

- **Создание заявок** — публичная форма (клиент, телефон, адрес, описание)
- **Панель диспетчера** — список заявок, фильтр по статусу, назначение мастера, отмена
- **Панель мастера** — список назначенных заявок, «Взять в работу», «Выполнено»
- **История заявок (audit log)** — раскрываемая строка с событиями (создание, назначение, взятие, выполнение, отмена)
- **Детальные ошибки в UI** — валидация по полям, сообщения об ошибках в едином формате
- **Взятие в работу** — атомарная операция, защита от гонки (409 при конфликте)
- **JWT-аутентификация** — роли dispatcher и master

## Архитектура

Монорепозиторий FastAPI + React + Docker. Структура:

```
backend/app/main.py
backend/app/api/routers/
backend/app/services/
backend/app/repositories/
backend/app/models/
backend/app/schemas/
backend/app/core/
backend/alembic/
frontend/src/api/
frontend/src/pages/
frontend/src/components/
frontend/src/styles/
docker-compose.yml, .env.example
```

**Правила:** роуты без SQL; БД через repositories; бизнес-логика в services. Frontend — в `frontend/src/`, backend — в `backend/app/`.

## Запуск

### Docker Compose (рекомендуется)

```bash
cp .env.example .env
# Заполните .env реальными значениями (не коммитить!)
docker compose up --build
```

**URLs:**

| Сервис   | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173     |
| Backend  | http://localhost:8000     |
| API docs | http://localhost:8000/docs |
| pgAdmin  | http://localhost:5050     |

Миграции и сиды выполняются автоматически при старте backend (entrypoint).

### Запуск без Docker

```bash
# 1. PostgreSQL
# Создайте БД и пользователя, настройте DATABASE_URL в .env

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000

# 3. Frontend (в другой консоли)
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 (проксирует /api на backend:8000).

## Переменные окружения

См. `.env.example`. Ключевые:

- `DATABASE_URL` — DSN PostgreSQL
- `JWT_SECRET_KEY` — секрет для JWT
- `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` — параметры токена
- `CORS_ORIGINS` — разрешённые origins для CORS

Секреты только через env; в репо — только `.env.example` без реальных значений.

## Тестовые пользователи (только dev)

**⚠️ Только для разработки. В продакшене не использовать.**

| Роль      | Логин      | Пароль |
|-----------|------------|--------|
| dispatcher| dispatcher1| dev123 |
| master    | master1    | dev123 |
| master    | master2    | dev123 |

Сиды создают пользователей и 3 тестовые заявки. В БД хранится только `password_hash`.

**Проверка после запуска:**

1. Войдите как **dispatcher1** → панель диспетчера: 3 заявки, фильтр, назначение, отмена, кнопка «История».
2. Войдите как **master1** → панель мастера: 1 заявка (Петрова), «Взять в работу», «История».
3. Войдите как **master2** → панель мастера: 1 заявка (Сидоров), «Выполнено», «История».

## История заявок (audit log)

В панелях диспетчера и мастера — колонка «История». Кнопка «▼ История» раскрывает строку с событиями: создание, назначение, взятие в работу, выполнение, отмена. Указывается пользователь и переход статусов.

## Проверка гонки (take in work)

Одновременный запрос на взятие одной заявки двумя мастерами: один получает 200, второй — 409 («Заявка уже взята в работу») или 400.

### Скрипты race_test

**Требования:** backend и frontend запущены (`docker compose up`), curl (bash) или PowerShell (Windows).

```bash
# Linux / macOS / Git Bash
chmod +x scripts/race_test.sh
./scripts/race_test.sh
```

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/race_test.ps1
```

По умолчанию: `http://localhost:5173/api`. Для прямого backend: `BASE_URL=http://localhost:8000 ./scripts/race_test.sh`.

Успех: `PASS: One 200, one 409/400`. Ошибка: `FAIL`, exit code 1.

## Backend tests

```bash
cd backend
pip install -e ".[dev]"
$env:DATABASE_URL="sqlite+aiosqlite:///:memory:"; $env:JWT_SECRET_KEY="test"; python -m pytest tests/ -v
```

Через Docker:

```bash
docker compose run --rm --no-deps --entrypoint "" backend sh -c "pip install pytest pytest-asyncio httpx aiosqlite -q && DATABASE_URL=sqlite+aiosqlite:///:memory: JWT_SECRET_KEY=test python -m pytest tests/ -v"
```

Тесты: health, создание заявки, auth (валидный/невалидный токен).

## Quality gates

```bash
./scripts/check.sh
```

Запускает: black, ruff, pytest (backend), npm run build (frontend). Требует `pip install -e ".[dev]"` в venv backend.

```bash
./scripts/commit_checked.sh "сообщение коммита"
```

Выполняет check.sh и коммит с коротким RU-сообщением. На Windows: Git Bash или WSL.

## Документация

- `DECISIONS.md` — ключевые решения
- `PROMPTS.md` — история промптов для AI
- `.cursor/rules.md` — PROJECT RULES для Cursor
