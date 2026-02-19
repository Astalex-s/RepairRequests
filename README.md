# RepairRequests

**Система управления заявками на ремонт** — веб-приложение для приёма заявок от клиентов, распределения работ между мастерами и отслеживания статусов выполнения. Подходит для сервисных центров, аварийных служб и компаний, оказывающих услуги по вызову.

## Назначение программы

RepairRequests автоматизирует типичный цикл работы с заявками на ремонт:

1. **Клиент** оставляет заявку через публичную форму (без регистрации): указывает имя, телефон, адрес и описание проблемы.
2. **Диспетчер** видит все заявки, фильтрует по статусу, назначает мастера и при необходимости отменяет заявку.
3. **Мастер** получает список назначенных на него заявок, берёт их в работу и отмечает выполнение.

Система фиксирует все изменения в **истории заявки (audit log)** — кто и когда создал, назначил, взял в работу или завершил заявку. При одновременной попытке двух мастеров взять одну заявку срабатывает защита от гонки: один запрос успешен, второй получает понятный отказ.

**Технологический стек:** FastAPI (backend), React + TypeScript (frontend), PostgreSQL, Docker Compose. REST API с JWT-аутентификацией, Pydantic-валидацией и единым форматом ошибок.

---

## Функционал

### Для клиентов (без входа)

- **Создание заявки** — форма с полями: имя клиента, телефон, адрес (необязательно), описание проблемы. После отправки заявка получает статус `new`.

### Для диспетчера

- **Список заявок** — таблица с ID, клиентом, телефоном, описанием, статусом, назначенным мастером.
- **Фильтр по статусу** — `new`, `assigned`, `in_progress`, `done`, `cancelled`.
- **Назначение мастера** — выбор из списка мастеров, перевод заявки в статус `assigned`.
- **Отмена заявки** — перевод в статус `cancelled`.
- **История заявки** — кнопка «▼ История» раскрывает строку с событиями: создание, назначение, взятие в работу, выполнение, отмена (с указанием пользователя и перехода статусов).

### Для мастера

- **Список назначенных заявок** — только заявки, назначенные на текущего мастера.
- **Взять в работу** — перевод `assigned` → `in_progress` (атомарно, защита от гонки).
- **Выполнено** — перевод `in_progress` → `done`.
- **История заявки** — та же раскрываемая строка с событиями.

### Общее

- **JWT-аутентификация** — логин по имени и паролю, автоматический редирект на панель по роли.
- **Детальные ошибки в UI** — валидация по полям (например, «Телефон: обязательное поле»), единый формат сообщений об ошибках.
- **Audit log** — события хранятся в БД, отображаются в панелях диспетчера и мастера.

---

## Архитектура

Монорепозиторий. Разделение слоёв: роуты не содержат SQL, работа с БД — через repositories, бизнес-логика — в services.

### Backend (FastAPI)

```
backend/
├── app/
│   ├── main.py              # Создание приложения, CORS, обработчики ошибок
│   ├── api/routers/         # HTTP-эндпоинты
│   │   ├── auth.py          # POST /auth/token, GET /auth/me
│   │   ├── requests_public.py   # POST /requests (создание, публично)
│   │   ├── requests_dispatcher.py # GET/PATCH /requests (список, assign, cancel, history)
│   │   ├── requests_master.py    # GET /master/requests, PATCH take/done, history
│   │   └── users.py         # GET /users/masters
│   ├── services/            # Бизнес-логика, проверки переходов статусов
│   ├── repositories/        # SQL, работа с БД (requests, users, audit)
│   ├── models/              # SQLAlchemy (User, RepairRequest, RequestAuditEvent)
│   ├── schemas/             # Pydantic (RequestCreate, RequestRead, RequestAssign и др.)
│   ├── core/                # settings, errors, security
│   └── db/                  # engine, session, base
├── alembic/                 # Миграции БД
├── tests/                   # pytest (health, create, auth)
└── seed.py                  # Сиды: пользователи и тестовые заявки
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── api/                 # client.ts (fetch + Bearer), types.ts
│   ├── pages/               # PublicCreateRequest, Login, DispatcherDashboard, MasterDashboard
│   ├── components/          # ErrorBanner (parseErrorMessage)
│   ├── hooks/               # useCurrentUser
│   └── styles/              # theme.css (design tokens)
└── vite.config.ts           # Прокси /api → backend:8000
```

### Инфраструктура

- `docker-compose.yml` — dev: postgres, pgadmin, backend, frontend
- `docker-compose.prod.yml` — prod: образы из GHCR, без pgadmin (для деплоя)
- `.env.example` — шаблон переменных окружения
- `.github/workflows/workflow.yaml` — CI/CD: сборка → GHCR → деплой по SSH
- `scripts/race_test.sh`, `scripts/race_test.ps1` — проверка гонки
- `scripts/check.sh`, `scripts/commit_checked.sh` — quality gates

---

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

Миграции (`alembic upgrade head`) и сиды (`python -m app.seed`) выполняются автоматически при старте backend (см. `backend/entrypoint.sh`).

### Запуск без Docker

```bash
# 1. PostgreSQL — создайте БД и пользователя, настройте DATABASE_URL в .env

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000

# 3. Frontend (в другой консоли)
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 (проксирует `/api` на backend:8000).

---

## Переменные окружения

См. `.env.example`. Ключевые:

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | DSN PostgreSQL |
| `JWT_SECRET_KEY` | Секрет для подписи JWT |
| `JWT_ALGORITHM` | Алгоритм (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена |
| `CORS_ORIGINS` | Разрешённые origins (через запятую) |
| `POSTGRES_*`, `PGADMIN_*` | Для Docker-сервисов |

Секреты только через env; в репозитории — только `.env.example` без реальных значений.

---

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

---

## История заявок (audit log)

В панелях диспетчера и мастера — колонка «История». Кнопка «▼ История» раскрывает строку с событиями:

- **Создана** — заявка создана через публичную форму
- **Назначена** — диспетчер назначил мастера (указывается пользователь)
- **Взята в работу** — мастер начал выполнение
- **Выполнена** — мастер отметил завершение
- **Отменена** — диспетчер отменил заявку

Для каждого события отображаются: действие, пользователь, переход статусов (old → new), дата и время.

---

## Проверка гонки (take in work)

При одновременной попытке двух мастеров взять одну заявку: один запрос возвращает 200, второй — 409 («Заявка уже взята в работу») или 400. Реализация атомарная (условный UPDATE в PostgreSQL).

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

---

## Backend tests

```bash
cd backend
pip install -e ".[dev]"
# Windows PowerShell:
$env:DATABASE_URL="sqlite+aiosqlite:///:memory:"; $env:JWT_SECRET_KEY="test"; python -m pytest tests/ -v
```

Через Docker:

```bash
docker compose run --rm --no-deps --entrypoint "" backend sh -c "pip install pytest pytest-asyncio httpx aiosqlite -q && DATABASE_URL=sqlite+aiosqlite:///:memory: JWT_SECRET_KEY=test python -m pytest tests/ -v"
```

Тесты: health, создание заявки, auth (валидный/невалидный токен).

---

## Quality gates

```bash
./scripts/check.sh
```

Запускает: black, ruff, pytest (backend), npm run build (frontend). Требует `pip install -e ".[dev]"` в venv backend.

```bash
./scripts/commit_checked.sh "сообщение коммита"
```

Выполняет check.sh и коммит с коротким RU-сообщением. На Windows: Git Bash или WSL.

---

## GitHub Actions (CI/CD)

Workflow `.github/workflows/workflow.yaml` запускается при push в ветку `main` и выполняет:

1. **Build and Push** — сборка образов backend и frontend, публикация в GitHub Container Registry (ghcr.io)
2. **Deploy** — подключение к серверу по SSH, обновление образов и перезапуск контейнеров

### Настройка GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Описание |
|--------|----------|
| `SSH_HOST` | Hostname или IP сервера |
| `SSH_PORT` | Порт SSH (например, 22) |
| `SSH_USERNAME` | Имя пользователя для SSH |
| `SSH_PRIVATE_KEY` | Приватный SSH-ключ (полностью, включая `-----BEGIN/END-----`) |
| `DEPLOY_PATH` | Путь на сервере (например, `/opt/repairrequests`) |
| `GHCR_TOKEN` | GitHub PAT с `read:packages` для `docker login` на сервере |
| `GHCR_USERNAME` | GitHub username для `docker login` |

**Создание GHCR_TOKEN:** GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic). Scope: `read:packages`.

### Подготовка сервера

1. Установить Docker и Docker Compose.
2. Создать каталог `DEPLOY_PATH` (например, `/opt/repairrequests`).
3. Создать `.env` в `DEPLOY_PATH` с переменными окружения (см. `.env.example`): `POSTGRES_*`, `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS` (укажите production-домен) и т.д.
4. Убедиться, что SSH-ключ добавлен в `~/.ssh/authorized_keys` пользователя `SSH_USERNAME`.

### Запуск workflow

1. Влить изменения в ветку `main` (или merge PR в `main`). 
2. В Actions → Build and Deploy — проверить статус.
3. При успехе: workflow копирует `docker-compose.prod.yml` на сервер, выполняет `docker compose pull` и `docker compose up -d`.

### Образы в GHCR

- `ghcr.io/<owner>/repairrequests-backend:latest`, `:sha`
- `ghcr.io/<owner>/repairrequests-frontend:latest`, `:sha`

---

## Документация

- `DECISIONS.md` — ключевые архитектурные решения
- `PROMPTS.md` — история промптов для AI
- `.cursor/rules.md` — PROJECT RULES для Cursor
- `.github/workflows/workflow.yaml` — CI/CD workflow (см. раздел GitHub Actions выше)
