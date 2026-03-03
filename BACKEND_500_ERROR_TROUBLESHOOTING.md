# Troubleshooting 500 Error при загрузке проектов

## Проблема

При запросе `GET /api/v1/projects?page=1&limit=100&prj_manager=47` возвращается ошибка 500 Internal Server Error.

## Возможные причины

### 1. Отсутствие новых полей в таблице `fw_projects`

Убедитесь, что в таблице `fw_projects` присутствуют все новые поля:

```sql
-- Проверьте наличие полей
DESCRIBE fw_projects;

-- Должны быть следующие поля:
- purchase_or_lease (ENUM('Purchase', 'Lease') или VARCHAR)
- notes (TEXT, nullable)
- client_id (BIGINT UNSIGNED, nullable)
- client_type (VARCHAR(100), nullable)
- client_table (ENUM('pharma','physician','pharmacist','medical_clinic'), nullable)
- client_data (JSON, nullable)
```

### 2. Проблема с SQL запросом

Проверьте SQL запрос в бекенде при получении списка проектов. Возможные проблемы:

- Попытка выбрать несуществующие поля
- Проблемы с JOIN если используются связанные таблицы
- Проблемы с обработкой NULL значений в новых полях

### 3. Проблема с фильтром prj_manager

Проверьте обработку фильтра `prj_manager=47`:
- Существует ли пользователь с ID 47?
- Правильно ли работает WHERE условие?

### 4. Проблема с JSON полем client_data

Если используется MySQL/MariaDB, убедитесь что:
- Версия БД поддерживает JSON тип (MySQL 5.7+, MariaDB 10.2+)
- Поле `client_data` имеет тип JSON или TEXT
- При чтении JSON поля используется правильная функция (JSON_EXTRACT, ->, ->>)

## Что проверить на бекенде

### 1. Проверьте логи бекенда

Найдите полный стек ошибки в логах сервера. Обычно там указана точная причина.

### 2. Проверьте SQL запрос

```sql
-- Попробуйте выполнить запрос напрямую в БД
SELECT 
  id,
  prj_name,
  address,
  description,
  priority,
  date_start,
  date_end,
  status,
  purchase_or_lease,
  notes,
  client_id,
  client_type,
  client_table,
  client_data,
  prj_manager,
  created_by,
  created_at,
  updated_at
FROM fw_projects
WHERE prj_manager = 47
LIMIT 100;
```

### 3. Проверьте миграции

Убедитесь, что выполнены все миграции для добавления новых полей:

```sql
-- Пример миграции для добавления полей
ALTER TABLE fw_projects
ADD COLUMN purchase_or_lease ENUM('Purchase', 'Lease') DEFAULT 'Purchase',
ADD COLUMN notes TEXT NULL,
ADD COLUMN client_id BIGINT UNSIGNED NULL,
ADD COLUMN client_type VARCHAR(100) NULL,
ADD COLUMN client_table ENUM('pharma','physician','pharmacist','medical_clinic') NULL,
ADD COLUMN client_data JSON NULL;
```

### 4. Проверьте обработку в коде бекенда

Убедитесь, что в коде бекенда:
- Новые поля включены в SELECT запрос
- Новые поля правильно обрабатываются при маппинге результатов
- JSON поле `client_data` правильно сериализуется/десериализуется

## Временное решение

Если нужно быстро исправить, можно временно исключить новые поля из SELECT запроса на бекенде и добавить их постепенно:

```php
// Пример для PHP/Laravel
$projects = DB::table('fw_projects')
    ->select([
        'id',
        'prj_name',
        'address',
        // ... существующие поля
        // Временно закомментировать новые поля:
        // 'purchase_or_lease',
        // 'notes',
        // 'client_id',
        // 'client_type',
        // 'client_table',
        // 'client_data',
    ])
    ->where('prj_manager', $managerId)
    ->paginate($limit);
```

## Ожидаемый формат ответа API

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "prj_name": "Project Name",
        "address": "123 Main St",
        "description": "...",
        "priority": "Medium",
        "date_start": "2024-01-01",
        "date_end": "2024-12-31",
        "status": "Active",
        "purchase_or_lease": "Purchase",
        "notes": null,
        "area": 5000,
        "level": "Full Service",
        "client_id": null,
        "client_type": null,
        "client_table": null,
        "client_data": null,
        "prj_manager": 47,
        "created_by": 1,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 10,
      "per_page": 100,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

## Дополнительная информация

После исправления ошибки на бекенде, фронтенд автоматически начнет работать корректно, так как он уже готов к работе с новыми полями.
