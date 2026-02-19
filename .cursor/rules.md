PROJECT RULES (Cursor)
Secrets & credentials
Никогда не хардкодить пароли, JWT_SECRET_KEY, ключи SSH, токены, DSN в коде, миграциях, сидах, docker-compose.yml.
Все секреты только через переменные окружения, .env (локально) и GitHub Secrets (CI/CD); в репозитории держать только .env.example без реальных значений.
Добавить в .gitignore: .env, *.env, pgadmin data, certs, private keys, volumes, pycache, .pytest_cache, .ruff_cache.
Для сидов пользователей хранить только password_hash; исходные пароли показывать только в README как тестовые (и только для dev), в прод-описании запретить.
Modularity & clean architecture
Структура FastAPI: app/main.py (создание приложения), app/api/routers/* (роуты), app/services/* (бизнес-логика), app/repositories/* (DB-операции), app/db/* (engine/session/base), app/models/, app/schemas/ (Pydantic DTO), app/core/* (settings, security, logging).
Роуты не содержат SQL; вся работа с БД через repository/service.
Каждая функция делает одну вещь; избегать "бог-объектов" и циклических импортов.
Везде типизация, явные контракты, единый стиль ошибок.
Database & migrations
Любые изменения моделей сопровождаются Alembic миграцией.
Миграции — идемпотентные и проверяемые, без "ручных" правок БД вне миграций.
Сиды выполняются отдельно от миграций (скрипт/команда), чтобы не смешивать DDL и тестовые данные.
API & validation
Pydantic-схемы: отдельные схемы для Create/Update/Read.
Валидация обязательных полей Request на входе; нормализовать phone (если решено) или явно оставить свободным форматом.
Ошибки возвращать в едином формате JSON (например: code/message/details).
Auth & authorization (JWT)
JWT: короткоживущий access token, алгоритм и срок жизни задаются через env.
Проверка ролей обязательна на уровне зависимостей FastAPI.
Сообщения ошибок безопасные: не раскрывать лишние детали ("неверный логин/пароль" без уточнений).
Concurrency / "race" invariant
Реализация "take in work" должна быть атомарной: один запрос выигрывает, второй получает 409.
Сообщение 409 — короткое и на русском, без технических деталей (например: "Заявка уже взята в работу").
Code quality gates
Перед коммитом: format (black), lint (ruff), tests (pytest).
Добавить скрипт проверки (scripts/check.sh) и скрипт "проверил → закоммитил" (scripts/commit_checked.sh) с коротким RU сообщением коммита.
В CI повторять те же проверки; CI — источник истины.
Git workflow
main защищён: только merge через PR, обязательный CI green.
develop: интеграция; release: подготовка релиза; feature/*: работа задач.
Запрещены прямые коммиты в main, и любые секреты в истории.
Docker & deployment
Dev compose: app + postgres + pgadmin, volumes, healthchecks.
Prod compose: app + nginx + ssl (Let's Encrypt), без pgadmin.
Логи писать в stdout/stderr (12-factor), чтобы Docker мог собирать логи.
Documentation
