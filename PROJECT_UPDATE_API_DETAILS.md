# Детали API запроса обновления проекта

## Эндпоинт

**Метод:** `PUT`  
**URL:** `/api/v1/projects/{id}`  
**Где `{id}`** - ID проекта (число)

**Пример:** `PUT /api/v1/projects/123`

## Структура запроса

### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

### Тело запроса (Request Body)

Все поля отправляются в JSON формате в теле запроса:

```json
{
  "prj_name": "Project Name",
  "address": "123 Main St",
  "description": "Project description",
  "priority": "Medium",
  "status": "Active",
  "purchase_or_lease": "Purchase",
  "notes": "Project notes text",
  "area": 5000,
  "level": "Full Service",
  "client_id": 27566,
  "client_type": "Pharmacies",
  "client_table": "pharma",
  "client_data": {
    "address": "123 Pharmacy St",
    "phone": "+1-555-1234",
    "email": "pharmacy@example.com"
  },
  "date_start": "2024-01-01",
  "date_end": "2024-12-31",
  "prj_manager": 47,
  "created_by": 1
}
```

## Поля клиента (обязательные для обновления)

### client_id
- **Тип:** `number | null`
- **Описание:** ID клиента из соответствующей таблицы
- **Пример:** `27566`
- **Может быть:** `null` (если клиент не выбран)

### client_type
- **Тип:** `string | null`
- **Описание:** Текстовое описание типа клиента
- **Пример:** `"Pharmacies"`, `"Physicians & Providers"`, `"Pharmacists"`, `"Medical Clinic"`
- **Может быть:** `null` (если клиент не выбран)

### client_table
- **Тип:** `string | null`
- **Описание:** Тип таблицы клиента (enum значение)
- **Возможные значения:** `"pharma"` | `"physician"` | `"pharmacist"` | `"medical_clinic"` | `null`
- **Пример:** `"pharma"`
- **Может быть:** `null` (если клиент не выбран)

### client_data
- **Тип:** `object | null`
- **Описание:** JSON объект с дополнительными данными клиента
- **Структура:** Может содержать любые поля в зависимости от таблицы клиента
- **Пример:**
  ```json
  {
    "address": "123 Pharmacy St",
    "phone": "+1-555-1234",
    "email": "pharmacy@example.com",
    "name": "10 Minute Pharmacy"
  }
  ```
- **Может быть:** `null` (если клиент не выбран) или пустой объект `{}`

## Важные моменты

1. **Все поля клиента отправляются всегда**, даже если они `null`
2. **client_data отправляется как JSON объект**, не как строка
3. **Если клиент не выбран**, все поля клиента должны быть `null`:
   ```json
   {
     "client_id": null,
     "client_type": null,
     "client_table": null,
     "client_data": null
   }
   ```

## Примеры запросов

### Пример 1: Обновление проекта с клиентом
```http
PUT /api/v1/projects/123
Content-Type: application/json

{
  "prj_name": "Pharmacy Renovation",
  "address": "456 Main St",
  "priority": "High",
  "status": "Active",
  "purchase_or_lease": "Purchase",
  "notes": "Renovation project",
  "area": 3000,
  "level": "Medical Nice",
  "client_id": 27566,
  "client_type": "Pharmacies",
  "client_table": "pharma",
  "client_data": {
    "name": "10 Minute Pharmacy",
    "address": "123 Pharmacy St",
    "phone": "+1-555-1234"
  },
  "date_start": "2024-01-01",
  "date_end": "2024-12-31"
}
```

### Пример 2: Обновление проекта без клиента (очистка клиента)
```http
PUT /api/v1/projects/123
Content-Type: application/json

{
  "prj_name": "Pharmacy Renovation",
  "address": "456 Main St",
  "priority": "High",
  "status": "Active",
  "purchase_or_lease": "Purchase",
  "notes": "Renovation project",
  "area": null,
  "level": null,
  "client_id": null,
  "client_type": null,
  "client_table": null,
  "client_data": null,
  "date_start": "2024-01-01",
  "date_end": "2024-12-31"
}
```

## Что проверять на бекенде

1. **Принимаются ли все поля клиента в теле запроса?**
   - `client_id` (может быть `null`)
   - `client_type` (может быть `null`)
   - `client_table` (может быть `null`)
   - `client_data` (может быть `null` или JSON объект)

2. **Сохраняются ли поля в таблицу `fw_projects`?**
   - Проверьте SQL UPDATE запрос
   - Убедитесь, что все поля включены в UPDATE (в т.ч. `area`, `level`)

3. **Принимаются ли и возвращаются ли поля `area` и `level`?**
   - `area` (integer, optional, nullable) — например площадь в кв. футах
   - `level` (string, optional, nullable) — одно из: `Bacics`, `Full Service`, `Medical Nice`, `High End`, `Extravagant`

4. **Правильно ли обрабатывается JSON поле `client_data`?**
   - Если используется MySQL/MariaDB, используйте тип JSON или TEXT
   - При сохранении JSON объекта используйте правильную функцию (JSON_OBJECT, JSON_EXTRACT)

5. **Возвращаются ли обновленные поля в ответе?**
   - После обновления проект должен вернуться с обновленными полями клиента, а также `area` и `level`

## Логирование на фронтенде

При сохранении проекта в консоли браузера будут логи:

```
🔧 Update data: { ... все поля ... }
🔍 Client fields in update data: { client_id, client_type, client_table, client_data }
📤 ProjectApi.update called: { id, data }
📤 Final request data with client fields: { ... }
✅ ProjectApi.update response: { ... }
🔍 Updated project from response: { client_id, client_type, client_table, client_data }
```

## Проверка в Network tab браузера

1. Откройте DevTools → Network
2. Найдите запрос `PUT /api/v1/projects/{id}`
3. Проверьте:
   - **Request Payload** - должны быть все поля клиента
   - **Response** - должны вернуться обновленные поля клиента
