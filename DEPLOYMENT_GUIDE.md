# 🚀 FieldWire Deployment Guide

## Architecture

**Database is always remote** (on hosting). Only the API location differs:

```
Local dev:   localhost:5174  →  localhost:8000  →  remote DB
Production:  fieldwire.medicalcontractor.ca  →  fwapi.medicalcontractor.ca  →  remote DB
```

## Окружения

### Development (разработка)
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:8000 (`justin-fieldwire-api`, локально)
- **Database**: remote (на хостинге; бэкенд подключается к ней по credentials)

### Production (продакшн)
- **Frontend**: https://fieldwire.medicalcontractor.ca
- **Backend**: https://fwapi.medicalcontractor.ca
- **Database**: remote (на хостинге)

## Команды для разработки

```bash
# 1. Запустить локальный бэкенд (в репозитории justin-fieldwire-api, порт 8000)
# 2. Запустить фронт
npm run dev

# Сборка для разработки
npm run build:dev

# Сборка для продакшна
npm run build:prod
```

## Команды для деплоя

```bash
./deploy.sh              # production (по умолчанию)
./deploy.sh production
./deploy.sh development
```

## Переменные окружения

### Development (`.env.development`)
```
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_APP_TITLE=FieldWire (Development)
```

### Production (`.env.production`)
```
VITE_API_URL=https://fwapi.medicalcontractor.ca
VITE_APP_ENV=production
VITE_APP_TITLE=FieldWire
```

## Backend

Отдельный репозиторий: [justin-fieldwire-api](https://github.com/serg19xx/justin-fieldwire-api)

- **Локально**: PHP на `:8000`, в `.env` — credentials удалённой БД
- **На хостинге**: `fwapi.medicalcontractor.ca`, та же удалённая БД
