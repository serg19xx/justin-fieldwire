# Database Migrations

## Task Templates Migrations

### 1. Create Table

**File**: `create_task_templates_table.sql`

Создает таблицу `fw_task_templates` для хранения шаблонов задач.

**Использование:**
```bash
mysql -u username -p database_name < migrations/create_task_templates_table.sql
```

Или через MySQL клиент:
```sql
SOURCE migrations/create_task_templates_table.sql;
```

### 2. Import Data

**File**: `import_task_templates_data.sql`

Импортирует 206 шаблонов задач из мок данных в базу данных.

**Использование:**
```bash
mysql -u username -p database_name < migrations/import_task_templates_data.sql
```

Или через MySQL клиент:
```sql
SOURCE migrations/import_task_templates_data.sql;
```

**Проверка:**
После импорта выполните:
```sql
SELECT COUNT(*) as imported_count FROM `fw_task_templates`;
-- Должно быть: 206
```

### Структура таблицы

Таблица `fw_task_templates` содержит следующие поля:

- `id` - Уникальный идентификатор (AUTO_INCREMENT)
- `name` - Название шаблона (обязательное)
- `description` - Описание (опционально)
- `category` - Категория для группировки
- `duration_days` - Длительность в днях (если известна)
- `start_offset_days` - Смещение от начала проекта в днях (NULL = нужно указать вручную)
- `end_offset_days` - Смещение для конечной даты (альтернатива duration)
- `milestone` - Тип вехи (inspection, visit, meeting, review, delivery, approval, other, или NULL)
- `status` - Статус задачи по умолчанию
- `notes` - Дополнительные заметки
- `wbs_path` - Путь в структуре работ (WBS)
- `task_order` - Порядок в последовательности шаблонов
- `created_at` - Время создания
- `updated_at` - Время последнего обновления

### Индексы

Таблица содержит индексы для оптимизации запросов:
- `idx_category` - по категории
- `idx_task_order` - по порядку
- `idx_milestone` - по типу вехи
- `idx_status` - по статусу
- `idx_created_at` - по дате создания

### Ограничения (Constraints)

- `chk_milestone_type` - проверяет допустимые значения milestone
- `chk_status_type` - проверяет допустимые значения status

### Регенерация SQL из JSON

Если нужно обновить данные импорта:

```bash
node scripts/generate-import-sql.js > migrations/import_task_templates_data.sql
```

### Порядок выполнения миграций

1. Сначала создайте таблицу:
   ```sql
   SOURCE migrations/create_task_templates_table.sql;
   ```

2. Затем импортируйте данные:
   ```sql
   SOURCE migrations/import_task_templates_data.sql;
   ```

3. Проверьте результат:
   ```sql
   SELECT COUNT(*) FROM fw_task_templates;
   SELECT * FROM fw_task_templates LIMIT 10;
   ```

### Примечания

- Таблица использует InnoDB engine для поддержки транзакций
- Кодировка: utf8mb4 для поддержки всех Unicode символов
- Все поля, кроме `name`, являются опциональными
- `start_offset_days` может быть NULL - в этом случае пользователь должен указать дату вручную при создании задачи

