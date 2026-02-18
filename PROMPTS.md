19/02/2026 17:13 мск 
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

19/02/2026 17:20 мск 
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

19/02/2026 17:27 мск
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


19/02/2026 17:29 мск
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


19/02/2026 17:35 мск
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


19/02/2026 17:40 мск
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


19/02/2026 17:45 мск
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


19/02/2026 17:45 мск
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
