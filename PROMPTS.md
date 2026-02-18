19/02/2026 17:13 мск  DONE
Prompt 0 — PROJECT RULES + .gitignore
Make changes only in these files:
.cursor/rules.md (create)
.gitignore (create)
README.md
Use the connected MCP context (context7) only to validate best practices, but the rules content must match the text below verbatim.
Follow PROJECT RULES (Cursor) in all future changes.
Tasks:
Create .cursor/rules.md and paste exactly this content (verbatim, no edits):
PROJECT RULES (Cursor)
Secrets & credentials
Никогда не хардкодить пароли, JWT_SECRET_KEY, ключи SSH, токены, DSN в коде, миграциях, сидах, docker-compose.yml.
Все секреты только через переменные окружения, .env (локально) и GitHub Secrets (CI/CD); в репозитории держать только .env.example без реальных значений.
Добавить в .gitignore: .env, *.env, pgadmin data, certs, private keys, volumes, pycache, .pytest_cache, .ruff_cache.
Для сидов пользователей хранить только password_hash; исходные пароли показывать только в README как тестовые (и только для dev), в прод-описании запретить.
Modularity & clean architecture
Структура FastAPI: app/main.py (создание приложения), app/api/routers/* (роуты), app/services/* (бизнес-логика), app/repositories/* (DB-операции), app/db/* (engine/session/base), app/models/, app/schemas/ (Pydantic DTO), app/core/* (settings, security, logging).
Роуты не содержат SQL; вся работа с БД через repository/service.
Каждая функция делает одну вещь; избегать “бог-объектов” и циклических импортов.
Везде типизация, явные контракты, единый стиль ошибок.
Database & migrations
Любые изменения моделей сопровождаются Alembic миграцией.
Миграции — идемпотентные и проверяемые, без “ручных” правок БД вне миграций.
Сиды выполняются отдельно от миграций (скрипт/команда), чтобы не смешивать DDL и тестовые данные.
API & validation
Pydantic-схемы: отдельные схемы для Create/Update/Read.
Валидация обязательных полей Request на входе; нормализовать phone (если решено) или явно оставить свободным форматом.
Ошибки возвращать в едином формате JSON (например: code/message/details).
Auth & authorization (JWT)
JWT: короткоживущий access token, алгоритм и срок жизни задаются через env.
Проверка ролей обязательна на уровне зависимостей FastAPI.
Сообщения ошибок безопасные: не раскрывать лишние детали (“неверный логин/пароль” без уточнений).
Concurrency / “race” invariant
Реализация “take in work” должна быть атомарной: один запрос выигрывает, второй получает 409.
Сообщение 409 — короткое и на русском, без технических деталей (например: “Заявка уже взята в работу”).
Code quality gates
Перед коммитом: format (black), lint (ruff), tests (pytest).
Добавить скрипт проверки (scripts/check.sh) и скрипт “проверил → закоммитил” (scripts/commit_checked.sh) с коротким RU сообщением коммита.
В CI повторять те же проверки; CI — источник истины.
Git workflow
main защищён: только merge через PR, обязательный CI green.
develop: интеграция; release: подготовка релиза; feature/*: работа задач.
Запрещены прямые коммиты в main, и любые секреты в истории.
Docker & deployment
Dev compose: app + postgres + pgadmin, volumes, healthchecks.
Prod compose: app + nginx + ssl (Let’s Encrypt), без pgadmin.
Логи писать в stdout/stderr (12-factor), чтобы Docker мог собирать логи.
Documentation

----------------------------------------------------------------------------------------

19/02/2026 17:20 мск  DONE
Prompt 1 — архитектура репо (контракт папок)
Make changes only in these files:
README.md
Use the connected MCP context (context7) to propose a clean folder structure for a monorepo FastAPI + React + Docker that matches our PROJECT RULES (Cursor).
Follow PROJECT RULES (Cursor).
Tasks:
In README add “Architecture” section with exact folders:
backend/app/main.py
backend/app/api/routers/
backend/app/services/
backend/app/repositories/
backend/app/db/
backend/app/models/
backend/app/schemas/
backend/app/core/
backend/alembic/
frontend/src/api/
frontend/src/pages/
frontend/src/components/
frontend/src/styles/
docker-compose.yml, .env.example (root infra)
Add explicit rule text: routers contain no SQL; all DB access via repositories; business logic in services.
Add explicit rule text: everything used by frontend lives in frontend/src/; backend in backend/app/.

----------------------------------------------------------------------------------------

19/02/2026 17:27 мск DONE
Prompt 2 — infra: docker-compose (postgres + pgadmin + healthchecks)
Make changes only in these files:
docker-compose.yml (create or edit)
.env.example (create or edit)
README.md
Use the connected MCP context (context7) to confirm docker-compose best practices for Postgres + pgAdmin + healthchecks.
Follow PROJECT RULES (Cursor): no secrets hardcoded; only placeholders in .env.example.
Tasks:
Create docker-compose.yml with services:
postgres: env from .env, volume for data, port 5432, healthcheck using pg_isready.
pgadmin: env from .env, port 5050, volume for pgadmin data.
Use depends_on with condition: service_healthy where needed later (backend).
Create/Update .env.example: POSTGRES_DB/USER/PASSWORD, PGADMIN_DEFAULT_EMAIL/PASSWORD, plus placeholders for BACKEND/FRONTEND later.
README: “How to connect via pgAdmin”: host postgres, port 5432.
Do not add backend/frontend services yet in this prompt.

----------------------------------------------------------------------------------------

19/02/2026 17:29 мск DONE
Prompt 3 — backend контейнер: Dockerfile + entrypoint (автомиграции)
Make changes only in these files:
backend/Dockerfile (create)
backend/entrypoint.sh (create)
docker-compose.yml
README.md
Use the connected MCP context (context7) to confirm the safest approach: run alembic upgrade head at container startup after DB is healthy.
Follow PROJECT RULES (Cursor): no secrets in compose; logs to stdout; dev compose includes pgadmin; healthchecks.
Tasks:
Create backend/Dockerfile (Python 3.12).
Create backend/entrypoint.sh that:
waits for Postgres availability
runs alembic upgrade head
starts uvicorn
Add backend service to docker-compose.yml:
build: ./backend
env_file: .env (documented)
depends_on postgres: condition service_healthy
expose port 8000
README: document “Migrations run automatically on backend start”.
IMPORTANT: Do NOT seed users here; seed must be a separate script/command step (but can be executed by entrypoint as a separate command after migrations per rule #3).

----------------------------------------------------------------------------------------

19/02/2026 17:35 мск DONE
Prompt 4 — backend: зависимости + settings + app/main.py + единый формат ошибок
Make changes only in these files:
backend/pyproject.toml (create)
backend/app/main.py (create)
backend/app/core/settings.py (create)
backend/app/core/errors.py (create)
Use the connected MCP context (context7) to confirm dependency list and FastAPI error handling patterns.
Follow PROJECT RULES (Cursor): unified JSON error format code/message/details; safe auth errors.
Tasks:
Add dependencies: fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings, passlib[bcrypt], python-jose[cryptography], python-multipart.
Implement Settings (env-based): DATABASE_URL, JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, CORS_ORIGINS.
Create FastAPI app with:
CORS middleware
/health
Implement custom exception handlers so errors return:
{ "code": "...", "message": "...", "details": ... }
and validation errors are also mapped to this format.

----------------------------------------------------------------------------------------

19/02/2026 17:40 мск DONE
Prompt 5 — backend: db engine/session/base
Make changes only in these files:
backend/app/db/engine.py (create)
backend/app/db/session.py (create)
backend/app/db/base.py (create)
backend/app/db/init.py (create)
Use the connected MCP context (context7) for SQLAlchemy 2.0 async patterns.
Follow PROJECT RULES (Cursor).
Tasks:
Implement async engine from settings.DATABASE_URL.
Implement async_sessionmaker and get_db dependency (commit/rollback).
Keep it modular; no business logic here.

----------------------------------------------------------------------------------------

19/02/2026 17:45 мск DONE
Prompt 6 — backend: models
Make changes only in these files:
backend/app/models/user.py (create)
backend/app/models/request.py (create)
backend/app/models/init.py (create)
Use the connected MCP context (context7) for SQLAlchemy model patterns.
Follow PROJECT RULES (Cursor).
Tasks:
Create models User and Request with all fields from ТЗ, indexes, FK.
Use created_at/updated_at timestamps.

----------------------------------------------------------------------------------------

19/02/2026 17:52 мск DONE
Prompt 7 — backend: schemas (Create/Update/Read раздельно)
Make changes only in these files:
backend/app/schemas/auth.py (create)
backend/app/schemas/requests.py (create)
backend/app/schemas/users.py (create)
backend/app/schemas/init.py (create)
Use the connected MCP context (context7) for Pydantic v2 DTO patterns.
Follow PROJECT RULES (Cursor): separate schemas for Create/Update/Read.
Tasks:
Requests: RequestCreate, RequestRead, RequestAssign, RequestStatusUpdate (if needed).
Users/Auth: Token response schema, UserRead.
Keep field names in API as specified in ТЗ (clientName, problemText, assignedTo, etc.), map to DB snake_case internally.

----------------------------------------------------------------------------------------

19/02/2026 17:57 мск
Prompt 8 — Alembic config + initial migration
Make changes only in these files:
backend/alembic.ini (create)
backend/alembic/env.py (create)
backend/alembic/script.py.mako (create)
backend/alembic/versions/0001_initial.py (create)
Use the connected MCP context (context7) for Alembic configuration.
Follow PROJECT RULES (Cursor): migrations are idempotent and checked-in; no manual DB edits.
Tasks:
Configure Alembic to read DATABASE_URL from env/settings.
Set target_metadata from models.
Create initial migration for users + requests + indexes.

----------------------------------------------------------------------------------------

Prompt 9 — backend: repositories (только SQL/DB операции)
Make changes only in these files:
backend/app/repositories/users.py (create)
backend/app/repositories/requests.py (create)
backend/app/repositories/init.py (create)
Use the connected MCP context (context7) to design repository methods.
Follow PROJECT RULES (Cursor): routers contain no SQL; repositories do DB operations.
Tasks:
UsersRepository: get_by_username, get_by_id, upsert_seed_users (or create_if_missing).
RequestsRepository: create_request_public, list_requests(filter), assign_master, cancel, list_for_master, take_in_work_atomic, mark_done.
take_in_work_atomic must be implemented as ONE conditional UPDATE and return whether it succeeded.

Prompt 10 — backend: services (бизнес-логика, проверки статусов)
Make changes only in these files:
backend/app/services/auth.py (create)
backend/app/services/requests.py (create)
backend/app/services/init.py (create)
Use the connected MCP context (context7) for service-layer patterns.
Follow PROJECT RULES (Cursor): services enforce status transitions; return domain errors; routers just glue.
Tasks:
AuthService: verify password, create access token, authenticate user (safe errors).
RequestsService: enforce allowed transitions and call repository methods.
Ensure 409 message for take race is RU and short: “Заявка уже взята в работу”.

Prompt 11 — backend: auth router + deps (JWT dispatcher/master)
Make changes only in these files:
backend/app/api/routers/auth.py (create)
backend/app/core/security.py (create)
backend/app/deps/auth.py (create)
backend/app/main.py
Use the connected MCP context (context7) and follow FastAPI OAuth2PasswordBearer + JWT approach.
Follow PROJECT RULES (Cursor): short-lived access token; role checks in dependencies; safe error messages.
Tasks:
POST /token (OAuth2PasswordRequestForm) -> Token response.
GET /me -> current user.
Dependencies: get_current_user, require_dispatcher, require_master.

Prompt 12 — backend: public router (создание заявки без JWT)
Make changes only in these files:
backend/app/api/routers/requests_public.py (create)
backend/app/main.py
Use the connected MCP context (context7) for router structure.
Follow PROJECT RULES (Cursor).
Tasks:
Implement POST /requests публично (no JWT), validate required fields via schemas, return RequestRead.

Prompt 13 — backend: dispatcher router (JWT + dispatcher)
Make changes only in these files:
backend/app/api/routers/requests_dispatcher.py (create)
backend/app/main.py
Follow PROJECT RULES (Cursor).
Tasks:
Implement dispatcher endpoints:
GET /requests?status=
PATCH /requests/{id}/assign
PATCH /requests/{id}/cancel
Use require_dispatcher dependency.

Prompt 14 — backend: master router (JWT + master) + гонка
Make changes only in these files:
backend/app/api/routers/requests_master.py (create)
backend/app/main.py
Use the connected MCP context (context7) to confirm atomic conditional update pattern.
Follow PROJECT RULES (Cursor): take is atomic, second request gets 409 with RU message.
Tasks:
Implement:
GET /master/requests
PATCH /requests/{id}/take (calls service -> repository.take_in_work_atomic)
PATCH /requests/{id}/done
Ensure take returns 409 with message “Заявка уже взята в работу” when affected rows == 0.

Prompt 15 — seed script (отдельно от миграций, но автозапуск после)
Make changes only in these files:
backend/app/seed.py (create)
backend/entrypoint.sh
README.md
Use the connected MCP context (context7) for safe seeding patterns.
Follow PROJECT RULES (Cursor): seeds are separate from migrations (but can be invoked after migrations in entrypoint as a separate command).
Tasks:
Implement python -m app.seed that creates dev users if missing (dispatcher1, master1, master2) with hashed passwords.
Update entrypoint.sh to run seed after alembic upgrade head (as a separate step).
README: list dev credentials and mark as dev-only.

Prompt 16 — frontend: стиль и каркас “как download.kodacode.ru”
Make changes only in these files:
frontend/package.json (create)
frontend/vite.config.ts (create)
frontend/index.html (create)
frontend/src/main.tsx (create)
frontend/src/App.tsx (create)
frontend/src/styles/theme.css (create)
Use the connected MCP context (context7) for React+Vite scaffolding.
Follow PROJECT RULES (Cursor): frontend code only in frontend/src/**.
UI requirement:
Create a laconic UI inspired by 
https://download.kodacode.ru/
 :
minimal layout, lots of whitespace
clean typography, simple primary button, subtle inputs
avoid heavy UI kits
Keep it consistent across pages.
Tasks:
Implement base layout component (header + centered container).
Add global CSS theme in theme.css.

Prompt 17 — frontend: api client + страницы
Make changes only in these files:
frontend/src/api/client.ts (create)
frontend/src/pages/PublicCreateRequest.tsx (create)
frontend/src/pages/Login.tsx (create)
frontend/src/pages/DispatcherDashboard.tsx (create)
frontend/src/pages/MasterDashboard.tsx (create)
frontend/src/App.tsx
Use the connected MCP context (context7) for clean API client patterns.
Follow PROJECT RULES (Cursor).
Tasks:
Implement API client with VITE_API_URL and Bearer token support.
PublicCreateRequest: POST /requests without token.
Login: POST /token, store token.
DispatcherDashboard: list/filter/assign/cancel.
MasterDashboard: list/take/done.
UI must match laconic theme (reuse same input/button styles).

Prompt 18 — frontend Docker + compose wiring + README smoke tests + scripts
Make changes only in these files:
frontend/Dockerfile (create)
docker-compose.yml
README.md
scripts/check.sh (create)
scripts/commit_checked.sh (create)
Use the connected MCP context (context7) for dockerizing Vite and for basic check scripts.
Follow PROJECT RULES (Cursor): add quality gates scripts; document run; no secrets.
Tasks:
Add frontend service to compose.
Add README:
docker compose up --build
URLs: frontend, backend /docs, pgAdmin
race check with 2 terminals (curl) expecting 200 + 409
Add scripts/check.sh to run black, ruff, pytest (backend) and frontend lint/typecheck if configured.
Add scripts/commit_checked.sh that runs check.sh and then commits with a short RU message prompt.

Prompt 19 — DECISIONS.md (6 решений)
Make changes only in these files:
DECISIONS.md (create)
Use the connected MCP context (context7) before writing to confirm best-practice phrasing for: FastAPI clean architecture layering, Docker entrypoint migrations, Postgres concurrency control with conditional UPDATE, and minimal React UI without component libraries.
Follow PROJECT RULES (Cursor) strictly (no secrets, clear architecture, concise documentation).
Tasks:
Create DECISIONS.md with title: DECISIONS.
Add exactly 6 decisions in numbered list format. Each decision must include:
Decision (1 sentence)
Rationale (1–2 sentences)
Trade-offs (1 sentence)
The 6 decisions must cover these topics (in this order):
Why we use repository + service layers (routers contain no SQL).
Why we use async SQLAlchemy + Postgres (and keep DB logic in repositories).
Why Alembic migrations run automatically in backend container entrypoint (and why seeds are still a separate script/step, even if invoked after migrations).
Why “take in work” uses a single conditional UPDATE and returns 409 on race.
Why JWT Bearer auth for internal roles (dispatcher/master) and public endpoint only for creating requests.
Why frontend UI is implemented with plain CSS (no heavy UI library) and is intentionally laconic, inspired by 
https://download.kodacode.ru/
 (whitespace, clean typography, minimal components).
Content constraints:
Keep the whole file under ~200 lines.
Do not include any real credentials, tokens, DSNs, or secret values.
Write in Russian, concise and practical (no marketing).
After writing DECISIONS.md, output a short summary: what decisions were captured (one line).
