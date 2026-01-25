# Отладка проблемы сохранения данных клиента

## Проблема
При выборе клиента поля не заполняются в таблице проектов.

## Что проверить

### 1. Проверьте логи в консоли браузера

При выборе клиента должны появиться следующие логи:

```
🔵 Client selected: { client: {...}, clientTable: "...", clientType: "..." }
📝 Form updated with client data: { client_id: ..., client_table: ..., ... }
📤 API payload: { ... client_id: ..., client_table: ..., client_data: {...} }
```

### 2. Проверьте, что данные клиента правильно приходят из API

В консоли должно быть:
```
✅ Full client data loaded: { id: ..., name: "...", data: {...} }
```

### 3. Проверьте структуру ответа API клиента

Убедитесь, что бекенд возвращает данные в правильном формате:

**Правильный формат:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 123,
      "name": "Client Name",
      "data": {
        "address": "...",
        "phone": "...",
        "email": "..."
      }
    }
  }
}
```

### 4. Проверьте, что данные отправляются на сервер

В Network tab браузера проверьте запрос `POST /api/v1/projects` или `PUT /api/v1/projects/{id}`:

**Должны быть поля:**
```json
{
  "client_id": 123,
  "client_type": "Pharmacies",
  "client_table": "pharma",
  "client_data": { ... }
}
```

### 5. Проверьте бекенд

Убедитесь, что бекенд:
- Принимает поля `client_id`, `client_type`, `client_table`, `client_data`
- Сохраняет их в таблицу `fw_projects`
- Правильно обрабатывает JSON поле `client_data`

### 6. Проверьте базу данных

После сохранения проекта проверьте в БД:

```sql
SELECT 
  id,
  prj_name,
  client_id,
  client_type,
  client_table,
  client_data
FROM fw_projects
WHERE id = <project_id>;
```

## Возможные проблемы

### Проблема 1: client.data undefined

Если `client.data` undefined, проверьте:
- Правильно ли бекенд возвращает структуру `{ id, name, data: {...} }`
- Загружается ли полная информация о клиенте через `getById`

### Проблема 2: Данные не сохраняются на бекенде

Проверьте:
- Есть ли поля в таблице `fw_projects`
- Правильно ли бекенд обрабатывает JSON поле `client_data`
- Нет ли ошибок в логах бекенда

### Проблема 3: Данные не отображаются после сохранения

Проверьте:
- Правильно ли бекенд возвращает данные при `GET /api/v1/projects/{id}`
- Правильно ли парсится JSON поле `client_data` (может приходить как строка)

### Проблема 4: Ошибка 400 при загрузке клиента (client_table = 'patient')

**Симптомы:**
- В консоли: `GET /api/v1/clients/patient/1 [HTTP/1.1 400 Bad Request]`
- Ошибка: "Invalid client table type: patient"

**Причина:**
В базе данных есть значение `client_table = 'patient'`, но фронтенд поддерживает только:
- `pharma`
- `physician`
- `pharmacist`
- `medical_clinic`

**Решение:**
1. **Временное:** Фронтенд теперь не будет пытаться загрузить данные клиента, если `client_table` имеет неожиданное значение
2. **Постоянное:** Обновите данные в БД, заменив `'patient'` на один из поддерживаемых типов, или добавьте поддержку `'patient'` на бекенде

**SQL для исправления:**
```sql
-- Проверьте, какие проекты имеют client_table = 'patient'
SELECT id, prj_name, client_table, client_id 
FROM fw_projects 
WHERE client_table = 'patient';

-- Обновите на один из поддерживаемых типов (например, 'pharma')
-- UPDATE fw_projects SET client_table = 'pharma' WHERE client_table = 'patient';
```

**Примечание:** Даже если `client_table` имеет неожиданное значение, информация о клиенте из `client_data` все равно будет отображаться, если она была сохранена ранее.

## Решение

Если проблема в том, что `client.data` undefined, временно можно использовать:

```javascript
form.value.client_data = client.data || {}
```

Но лучше исправить бекенд, чтобы он возвращал правильную структуру.
