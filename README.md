# RepairRequests

Система управления заявками на ремонт (FastAPI).

## Функционал

- Создание и просмотр заявок
- Взятие заявки в работу (атомарная операция, защита от гонки)
- JWT-аутентификация, роли пользователей
- REST API с Pydantic-валидацией

## Architecture

Монорепозиторий FastAPI + React + Docker. Структура папок:

```
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
```

**Правила:**

- Роуты не содержат SQL; вся работа с БД через repositories; бизнес-логика в services.
- Всё, что использует frontend, живёт в `frontend/src/`; backend — в `backend/app/`.

## Запуск

### Полный стек (dev)

```bash
cp .env.example .env
# Заполните .env реальными значениями (не коммитить!)
docker compose up --build
```

**URLs:**

| Сервис   | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:8000    |
| API docs | http://localhost:8000/docs|
| pgAdmin  | http://localhost:5050     |

Сервисы: postgres (5432), pgadmin (5050), backend (8000), frontend (5173). Volumes и healthchecks включены.

**Миграции и сиды выполняются автоматически при старте backend** (alembic upgrade head, затем python -m app.seed).

#### Подключение через pgAdmin

1. Откройте http://localhost:5050, войдите с учётом из `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`.
2. Добавьте сервер: правый клик по "Servers" → "Register" → "Server...".
3. Вкладка "Connection": **Host** — `postgres`, **Port** — `5432`, **Username** — `POSTGRES_USER`, **Password** — `POSTGRES_PASSWORD` из `.env`.

### Prod

```bash
docker compose -f docker-compose.prod.yml up -d
```

Сервисы: app, nginx, ssl (Let's Encrypt). pgadmin не используется.

## Переменные окружения

См. `.env.example`. Ключевые переменные:

- `DATABASE_URL` — DSN PostgreSQL
- `JWT_SECRET_KEY` — секрет для JWT
- `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` — параметры токена

Секреты только через env; в репозитории — только `.env.example` без реальных значений.

## Тестовые пользователи (только dev)

**⚠️ Только для разработки. В продакшене не использовать.**

| Роль      | Логин      | Пароль |
|-----------|------------|--------|
| dispatcher| dispatcher1| dev123 |
| master    | master1    | dev123 |
| master    | master2    | dev123 |

Сиды создают пользователей при первом запуске (`python -m app.seed`). В БД хранится только `password_hash`.

## Проверка гонки (take in work)

Одновременный запрос на взятие одной заявки двумя мастерами: один получает 200, второй — 409 («Заявка уже взята в работу») или 400 (недопустимый переход). Реализация атомарная.

### Скрипты race_test

Автоматическая проверка: создаёт заявку, отправляет два параллельных PATCH-запроса от master1 и master2, проверяет, что один вернул 200, другой — 409 или 400.

**Требования:** backend и frontend должны быть запущены (`docker compose up`), curl (bash) или PowerShell 5.1+ (Windows).

#### Linux / macOS / Git Bash

```bash
chmod +x scripts/race_test.sh
./scripts/race_test.sh
```

#### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/race_test.ps1
```

По умолчанию используется `http://localhost:5173/api` (frontend proxy при `docker compose up`). Для прямого доступа к backend:

```bash
# Bash
BASE_URL=http://localhost:8000 ./scripts/race_test.sh
```

```powershell
# PowerShell
$env:BASE_URL="http://localhost:8000"; .\scripts\race_test.ps1
```

Успех: `PASS: One 200, one 409/400`. Ошибка: `FAIL` и exit code 1.

**Проверка вручную (2 терминала):** создайте заявку, получите токены master1/master2, в двух терминалах одновременно выполните `curl -X PATCH .../requests/{id}/take` с разными токенами. Ожидается один 200, другой 409 или 400.

## Backend tests

```bash
# В backend venv (Python 3.12+)
cd backend && pip install -e ".[dev]" && python -m pytest -v
```

Через Docker (без PostgreSQL):

```bash
docker compose run --rm --no-deps --entrypoint "" backend sh -c "pip install pytest pytest-asyncio httpx aiosqlite -q && DATABASE_URL=sqlite+aiosqlite:///:memory: JWT_SECRET_KEY=test python -m pytest tests/ -v"
```

Тесты: health, создание заявки, auth (валидный/невалидный токен).

## Quality gates (перед коммитом)

```bash
./scripts/check.sh
```

Запускает: black, ruff, pytest (backend), npm run build (frontend). Требует: `pip install -e ".[dev]"` в venv backend (Python 3.12+).

```bash
./scripts/commit_checked.sh "сообщение коммита"
```

Выполняет check.sh и коммит с коротким RU-сообщением. На Windows: Git Bash или WSL.

## Документация

- `DECISIONS.md` — ключевые решения и причины
- `.cursor/rules.md` — PROJECT RULES для Cursor
