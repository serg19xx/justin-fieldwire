# API Endpoints для работы с клиентами проектов

## Описание

Эндпоинты для работы с клиентами из различных таблиц базы данных. Клиенты могут быть из таблиц:
- `pharma` - Pharmacies
- `physician` - Physicians & Providers
- `pharmacist` - Pharmacists
- `medical_clinic` - Medical Clinic

## Поле client_data в проектах

При выборе клиента для проекта, поле `data` из ответа `GET /api/v1/clients/{clientTable}/{clientId}` сохраняется напрямую в поле `client_data` (JSON) проекта.

**Структура:**
- При выборе клиента, поле `client_data` проекта получает значение из `client.data` ответа API
- Это упрощает сохранение, так как структура таблиц может отличаться, и все дополнительные поля хранятся в JSON формате
- При отображении информации о клиенте в проекте, данные берутся из `client_data` (например: `client_data.name`, `client_data.address`, `client_data.phone`, `client_data.email` и т.д.)

**Пример сохранения:**
```javascript
// Ответ API: { id: 123, name: "Pharmacy", data: { address: "...", phone: "..." } }
// В проекте сохраняется:
client_id: 123
client_table: "pharma"
client_type: "Pharmacies"
client_data: { address: "...", phone: "..." }  // только поле data из ответа
```

## Эндпоинты

### 1. Поиск клиентов с пагинацией

**Эндпоинт:** `GET /api/v1/clients/{clientTable}`

**Описание:** Поиск клиентов в указанной таблице с поддержкой поискового запроса и пагинации.

**Параметры URL:**
- `clientTable` (path parameter, required) - Тип таблицы клиента:
  - `pharma`
  - `physician`
  - `pharmacist`
  - `medical_clinic`

**Query параметры:**
- `search` (string, optional) - Поисковый запрос для фильтрации по имени. Если не указан, возвращаются все клиенты.
- `page` (integer, optional, default: 1) - Номер страницы (начиная с 1)
- `limit` (integer, optional, default: 20) - Количество записей на странице (рекомендуется 20-50)

**Примеры запросов:**
```
GET /api/v1/clients/pharma?search=pharmacy&page=1&limit=20
GET /api/v1/clients/physician?search=doctor&page=2&limit=20
GET /api/v1/clients/pharmacist?page=1&limit=50
GET /api/v1/clients/medical_clinic?search=clinic
```

**Формат ответа:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": 1,
        "name": "Pharmacy Name",
        "data": {}
      },
      {
        "id": 2,
        "name": "Another Pharmacy",
        "data": {}
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

**Структура ответа:**
- `clients` (array) - Массив клиентов. Каждый клиент содержит:
  - `id` (integer) - ID клиента
  - `name` (string) - Название клиента
  - `data` (object) - JSON объект (может быть пустым для списка, так как содержит только id и name)
- `total` (integer) - Общее количество клиентов, соответствующих запросу
- `page` (integer) - Текущая страница
- `limit` (integer) - Количество записей на странице
- `total_pages` (integer) - Общее количество страниц

**Ошибки:**
- `400 Bad Request` - Неверный тип таблицы клиента
- `404 Not Found` - Таблица не найдена
- `500 Internal Server Error` - Ошибка сервера

---

### 2. Получение клиента по ID

**Эндпоинт:** `GET /api/v1/clients/{clientTable}/{clientId}`

**Описание:** Получение полной информации о клиенте по его ID из указанной таблицы.

**Параметры URL:**
- `clientTable` (path parameter, required) - Тип таблицы клиента:
  - `pharma`
  - `physician`
  - `pharmacist`
  - `medical_clinic`
- `clientId` (path parameter, required) - ID клиента

**Примеры запросов:**
```
GET /api/v1/clients/pharma/123
GET /api/v1/clients/physician/456
GET /api/v1/clients/pharmacist/789
GET /api/v1/clients/medical_clinic/101
```

**Формат ответа:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 123,
      "name": "Pharmacy Name",
      "data": {
        "address": "123 Main St",
        "phone": "+1-555-1234",
        "email": "pharmacy@example.com",
        // ... все остальные поля из таблицы в формате JSON
      }
    }
  }
}
```

**Структура ответа:**
- `client` (object) - Объект клиента со следующей структурой:
  - `id` (integer) - ID клиента
  - `name` (string) - Название клиента
  - `data` (object) - JSON объект со всеми остальными полями из соответствующей таблицы:
    - Может содержать любые поля в зависимости от структуры таблицы (address, phone, email и т.д.)
    - Структура может отличаться для разных типов таблиц (pharma, physician, pharmacist, medical_clinic)

**Примечание:** Поле `data` из ответа сохраняется напрямую в поле `client_data` (JSON) проекта. Это упрощает сохранение данных, так как структура таблиц может отличаться, и все дополнительные поля хранятся в JSON формате.

**Ошибки:**
- `400 Bad Request` - Неверный тип таблицы клиента
- `404 Not Found` - Клиент не найден
- `500 Internal Server Error` - Ошибка сервера

---

## Требования к реализации

### Поиск клиентов

1. **Поисковый запрос:**
   - Должен искать по полю `name` (или соответствующему полю в таблице)
   - Поиск должен быть case-insensitive
   - Рекомендуется использовать LIKE или полнотекстовый поиск

2. **Пагинация:**
   - Должна работать корректно с большими таблицами
   - Рекомендуемый размер страницы: 20-50 записей
   - Должен возвращаться `total` для расчета общего количества страниц

3. **Производительность:**
   - Рекомендуется использовать индексы на поле `name` для быстрого поиска
   - Для больших таблиц рекомендуется использовать LIMIT/OFFSET или курсорную пагинацию

### Получение клиента по ID

1. **Валидация:**
   - Проверять существование клиента в указанной таблице
   - Возвращать 404 если клиент не найден

2. **Данные:**
   - Возвращать все поля клиента из соответствующей таблицы
   - Структура может отличаться для разных типов таблиц

---

## Примеры использования на фронтенде

### Поиск клиентов
```typescript
// Поиск с пагинацией
const response = await api.get('/api/v1/clients/pharma', {
  params: {
    search: 'pharmacy',
    page: 1,
    limit: 20
  }
})
```

### Получение клиента по ID
```typescript
// Получение полной информации о клиенте
const response = await api.get('/api/v1/clients/pharma/123')
```

---

## Примечания

1. **Безопасность:**
   - Все эндпоинты должны требовать аутентификации
   - Проверять права доступа пользователя

2. **Кэширование:**
   - Можно использовать кэширование для часто запрашиваемых данных
   - Учитывать актуальность данных

3. **Логирование:**
   - Рекомендуется логировать запросы для отладки
   - Не логировать чувствительные данные
