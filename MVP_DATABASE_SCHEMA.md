# MVP Database Schema - Simplified

## Минимальная схема для быстрого старта

### 1. Folders Table (Папки)
```sql
CREATE TABLE fw_plan_folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES fw_plan_folders(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_fw_plan_folders_parent_id ON fw_plan_folders(parent_id);
CREATE INDEX idx_fw_plan_folders_name ON fw_plan_folders(name);
CREATE INDEX idx_fw_plan_folders_project_id ON fw_plan_folders(project_id);
```

### 2. Files Table (Файлы)
```sql
CREATE TABLE fw_plan_files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL UNIQUE,
  folder_id INTEGER NOT NULL REFERENCES fw_plan_folders(id) ON DELETE CASCADE,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  version VARCHAR(50),
  uploaded_by INTEGER NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_fw_plan_files_folder_id ON fw_plan_files(folder_id);
CREATE INDEX idx_fw_plan_files_uploaded_by ON fw_plan_files(uploaded_by);
CREATE INDEX idx_fw_plan_files_category ON fw_plan_files(category);
```

## API Endpoints (MVP)

### Folders
```
GET    /api/v1/plan/folders/tree?project_id={id}     - Получить дерево папок проекта
GET    /api/v1/plan/folders/{id}/content             - Получить содержимое папки
POST   /api/v1/plan/folders                          - Создать папку
PUT    /folders/{id}                   - Переименовать папку
DELETE /folders/{id}                   - Удалить папку
```

### Files
```
GET    /folders/{id}/files             - Получить файлы в папке
POST   /files/upload                   - Загрузить файл
GET    /files/{id}/download            - Скачать файл
PUT    /files/{id}                     - Обновить файл
DELETE /files/{id}                     - Удалить файл
POST   /files/{id}/copy                - Копировать файл
PUT    /files/{id}/move                - Переместить файл
```

## Операции (упрощенные)

### 1. Copy File
```sql
-- Создает новую запись с тем же file_path
INSERT INTO fw_plan_files (file_name, original_name, file_path, folder_id, file_size, mime_type, category, description, version, uploaded_by)
SELECT file_name, original_name, file_path, new_folder_id, file_size, mime_type, category, description, version, uploaded_by
FROM fw_plan_files WHERE id = source_file_id;
```

### 2. Move File
```sql
-- Обновляет folder_id
UPDATE fw_plan_files SET folder_id = new_folder_id, updated_at = NOW() WHERE id = file_id;
```

### 3. Rename File
```sql
-- Обновляет file_name
UPDATE fw_plan_files SET file_name = new_name, updated_at = NOW() WHERE id = file_id;
```

### 4. Delete File
```sql
-- Удаляет запись
DELETE FROM fw_plan_files WHERE id = file_id;
```

## Проверка конфликтов

### Проверка имени файла в папке
```sql
SELECT COUNT(*) FROM fw_plan_files 
WHERE folder_id = ? AND file_name = ? AND id != ?;
```

### Проверка имени папки в родительской папке
```sql
SELECT COUNT(*) FROM fw_plan_folders 
WHERE parent_id = ? AND name = ? AND id != ?;
```

## Тестовые данные

```sql
-- Вставка тестовых папок
INSERT INTO fw_plan_folders (name, parent_id) VALUES 
('Root', NULL),
('Project Plans', 1),
('Drawings', 2),
('Specifications', 2),
('Photos', 1),
('Documents', 1);

-- Вставка тестовых файлов
INSERT INTO fw_plan_files (file_name, original_name, file_path, folder_id, file_size, mime_type, category, description, version, uploaded_by) VALUES 
('plan.pdf', 'project_plan.pdf', '/uploads/plan.pdf', 2, 1024000, 'application/pdf', 'plans', 'Main project plan', '1.0', 1),
('drawing.dwg', 'elevation.dwg', '/uploads/drawing.dwg', 3, 2048000, 'application/dwg', 'drawings', 'Building elevation', '1.0', 1),
('photo.jpg', 'site_photo.jpg', '/uploads/photo.jpg', 5, 512000, 'image/jpeg', 'photos', 'Site photo', '1.0', 1);
```

## Ограничения

```sql
-- Ограничения на уровне базы данных
ALTER TABLE fw_plan_folders ADD CONSTRAINT chk_folder_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);
ALTER TABLE fw_plan_files ADD CONSTRAINT chk_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0);
ALTER TABLE fw_plan_files ADD CONSTRAINT chk_file_size_positive CHECK (file_size > 0);
ALTER TABLE fw_plan_files ADD CONSTRAINT chk_mime_type_not_empty CHECK (LENGTH(TRIM(mime_type)) > 0);

-- Уникальные ограничения
ALTER TABLE fw_plan_folders ADD CONSTRAINT uk_folder_name_parent UNIQUE (name, parent_id);
ALTER TABLE fw_plan_files ADD CONSTRAINT uk_file_path UNIQUE (file_path);
```

## Планы на будущее

### Этап 2 - Добавить логирование
```sql
-- Когда понадобится для SaaS
CREATE TABLE fw_plan_file_operations (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES fw_plan_files(id),
  operation_type VARCHAR(50),
  performed_by INTEGER,
  performed_at TIMESTAMP DEFAULT NOW()
);
```

### Этап 3 - Enterprise функции
```sql
-- Для корпоративных клиентов
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100),
  details JSON,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Преимущества MVP подхода

- ✅ **Быстрый старт** - минимум кода
- ✅ **Простота** - легко понять и поддерживать
- ✅ **Масштабируемость** - легко добавить функции позже
- ✅ **Фокус на клиенте** - основная функциональность работает
- ✅ **Итеративность** - улучшения на основе обратной связи
