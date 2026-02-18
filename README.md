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

### Infra (postgres + pgAdmin)

```bash
cp .env.example .env
# Заполните .env реальными значениями (не коммитить!)
docker compose up -d
```

Сервисы: postgres (порт 5432), pgadmin (порт 5050), backend (порт 8000). Volumes и healthchecks включены.

**Миграции выполняются автоматически при старте backend** (alembic upgrade head в entrypoint).

#### Подключение через pgAdmin

1. Откройте http://localhost:5050, войдите с учётом из `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD`.
2. Добавьте сервер: правый клик по "Servers" → "Register" → "Server...".
3. Вкладка "Connection": **Host** — `postgres`, **Port** — `5432`, **Username** — `POSTGRES_USER`, **Password** — `POSTGRES_PASSWORD` из `.env`.

### Dev (полный стек, позже)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Сервисы: app, postgres, pgadmin. Volumes и healthchecks включены.

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

| Роль   | Логин | Пароль (только для dev) |
|--------|-------|-------------------------|
| admin  | admin | см. сиды / README dev   |
| master | master| см. сиды / README dev   |

В прод-описании исходные пароли не указывать. В сидах хранится только `password_hash`.

## Проверка гонки (take in work)

Одновременный запрос на взятие одной заявки двумя мастерами: один получает 200, второй — 409 («Заявка уже взята в работу»). Реализация атомарная.

## Документация

- `DECISIONS.md` — ключевые решения и причины
- `.cursor/rules.md` — PROJECT RULES для Cursor
