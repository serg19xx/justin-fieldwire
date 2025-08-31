# 🚀 FieldWire Deployment Guide

## Окружения

### Development (Разработка)
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API URL**: http://localhost:8000

### Production (Продакшн)
- **Frontend**: https://fieldwire.medicalcontractor.ca
- **Backend**: https://fwapi.medicalcontractor.ca
- **API URL**: https://fwapi.medicalcontractor.ca

## Команды для разработки

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для разработки
npm run build:dev

# Сборка для продакшна
npm run build:prod
```

## Команды для деплоя

```bash
# Деплой в продакшн (по умолчанию)
./deploy.sh

# Деплой в продакшн (явно)
./deploy.sh production

# Деплой в development (если нужно)
./deploy.sh development
```

## Переменные окружения

### Development (env.development)
```
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_APP_TITLE=FieldWire (Development)
```

### Production (env.production)
```
VITE_API_URL=https://fwapi.medicalcontractor.ca
VITE_APP_ENV=production
VITE_APP_TITLE=FieldWire
```

## Автоматическое определение окружения

Приложение автоматически определяет окружение по hostname:

- `localhost` или `127.0.0.1` → Development
- Содержит `staging` или `dev` → Staging  
- Остальные → Production

## Индикатор окружения

На всех окружениях кроме production отображается индикатор в правом верхнем углу:
- 🟡 **DEVELOPMENT** - желтый
- 🔵 **STAGING** - синий
- 🟢 **PRODUCTION** - зеленый (не показывается)

## Тестирование API

### Локально
```bash
# Запустите локальный бэкенд на порту 8000
# Затем откройте http://localhost:5173/api-tester
```

### На продакшне
```
https://fieldwire.medicalcontractor.ca/api-tester
```

## Troubleshooting

### CORS ошибки
- Убедитесь, что бэкенд настроен для CORS
- Проверьте правильность API URL в конфигурации

### Проблемы с роутингом
- Убедитесь, что .htaccess загружен на сервер
- Проверьте настройки Apache/Nginx для SPA

### Проблемы с авторизацией
- API Tester не требует авторизации
- Остальные страницы требуют логин
