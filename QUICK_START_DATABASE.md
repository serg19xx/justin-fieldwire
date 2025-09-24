# Quick Start Database Schema

## Минимальная структура для начала работы

### 1. Folders Table (Папки)
```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_name ON folders(name);
```

### 2. Files Table (Файлы)
```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL UNIQUE,
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
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
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_category ON files(category);
```

## API Endpoints для быстрого старта

### 1. Folders
```
GET    /folders/tree                    - Получить дерево папок
GET    /folders/{id}/subfolders        - Получить подпапки
POST   /folders                        - Создать папку
PUT    /folders/{id}                   - Переименовать папку
DELETE /folders/{id}                   - Удалить папку
```

### 2. Files
```
GET    /folders/{id}/files             - Получить файлы в папке
POST   /files/upload                   - Загрузить файл
GET    /files/{id}/download            - Скачать файл
PUT    /files/{id}                     - Обновить файл
DELETE /files/{id}                     - Удалить файл
POST   /files/{id}/copy                - Копировать файл
PUT    /files/{id}/move                - Переместить файл
```

## Структура ответов API

### Folder Tree
```json
[
  {
    "id": 1,
    "name": "Project Plans",
    "parent_id": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Drawings",
    "parent_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Files in Folder
```json
[
  {
    "id": 1,
    "file_name": "plan.pdf",
    "original_name": "project_plan.pdf",
    "file_path": "/uploads/2024/01/file_1704067200_abc123.pdf",
    "folder_id": 1,
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "category": "plans",
    "description": "Main project plan",
    "version": "1.0",
    "uploaded_by": 1,
    "uploaded_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

## Тестовые данные

### Вставка тестовых папок
```sql
INSERT INTO folders (name, parent_id) VALUES 
('Root', NULL),
('Project Plans', 1),
('Drawings', 2),
('Specifications', 2),
('Photos', 1),
('Documents', 1);
```

### Вставка тестовых файлов
```sql
INSERT INTO files (file_name, original_name, file_path, folder_id, file_size, mime_type, category, description, version, uploaded_by) VALUES 
('plan.pdf', 'project_plan.pdf', '/uploads/plan.pdf', 2, 1024000, 'application/pdf', 'plans', 'Main project plan', '1.0', 1),
('drawing.dwg', 'elevation.dwg', '/uploads/drawing.dwg', 3, 2048000, 'application/dwg', 'drawings', 'Building elevation', '1.0', 1),
('photo.jpg', 'site_photo.jpg', '/uploads/photo.jpg', 5, 512000, 'image/jpeg', 'photos', 'Site photo', '1.0', 1);
```

## Ограничения и валидация

```sql
-- Ограничения на уровне базы данных
ALTER TABLE folders ADD CONSTRAINT chk_folder_name_not_empty CHECK (LENGTH(TRIM(name)) > 0);
ALTER TABLE files ADD CONSTRAINT chk_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0);
ALTER TABLE files ADD CONSTRAINT chk_file_size_positive CHECK (file_size > 0);
ALTER TABLE files ADD CONSTRAINT chk_mime_type_not_empty CHECK (LENGTH(TRIM(mime_type)) > 0);

-- Уникальные ограничения
ALTER TABLE folders ADD CONSTRAINT uk_folder_name_parent UNIQUE (name, parent_id);
ALTER TABLE files ADD CONSTRAINT uk_file_path UNIQUE (file_path);
```

## Физическое хранение файлов

### Плоская структура на сервере:
```
/uploads/
├── file_1704067200_abc123.pdf
├── file_1704067201_def456.jpg
├── file_1704067202_ghi789.xlsx
├── file_1706745600_jkl012.docx
├── file_1706745601_mno345.png
└── file_1735689600_pqr678.pdf
```

### Именование файлов:
- **Формат**: `file_{timestamp}_{random_string}.{extension}`
- **timestamp** - Unix timestamp загрузки
- **random_string** - случайная строка для уникальности
- **extension** - оригинальное расширение файла

### Преимущества плоской структуры:
- ✅ **Простота операций** - все файлы в одной папке
- ✅ **Быстрый доступ** - нет необходимости создавать папки
- ✅ **Простое копирование** - простое копирование файла
- ✅ **Простое удаление** - удаление файла без проверки папок
- ✅ **Масштабируемость** - не зависит от глубины папок
- ✅ **Виртуальная структура** - папки существуют только в БД
- ✅ **Быстрые операции** - все операции только с БД
- ✅ **Простое резервное копирование** - одна папка для всех файлов

## Операции и их SQL

### 1. Copy File
```sql
-- Создает новую запись с тем же file_path (тот же физический файл)
INSERT INTO files (file_name, original_name, file_path, folder_id, file_size, mime_type, category, description, version, uploaded_by)
SELECT file_name, original_name, file_path, new_folder_id, file_size, mime_type, category, description, version, uploaded_by
FROM files WHERE id = source_file_id;
-- Результат: Две записи в БД, один физический файл
```

### 2. Move File
```sql
-- Обновляет только folder_id (физический файл не трогается)
UPDATE files SET folder_id = new_folder_id, updated_at = NOW() WHERE id = file_id;
-- Результат: Файл "перемещается" в другую папку виртуально
```

### 3. Rename File
```sql
-- Обновляет только file_name (физический файл не трогается)
UPDATE files SET file_name = new_name, updated_at = NOW() WHERE id = file_id;
-- Результат: Файл "переименовывается" только в интерфейсе
```

### 4. Delete File
```sql
-- Удаляет запись из БД (физический файл остается для garbage collection)
DELETE FROM files WHERE id = file_id;
-- Результат: Файл "удаляется" из интерфейса, но остается на диске
```

## Проверка конфликтов

### Проверка имени файла в папке
```sql
SELECT COUNT(*) FROM files 
WHERE folder_id = ? AND file_name = ? AND id != ?;
```

### Проверка имени папки в родительской папке
```sql
SELECT COUNT(*) FROM folders 
WHERE parent_id = ? AND name = ? AND id != ?;
```

## Очистка и обслуживание

### Garbage Collection
```sql
-- Найти файлы, на которые нет ссылок
SELECT file_path FROM files 
WHERE file_path NOT IN (SELECT file_path FROM files);
```

### Статистика
```sql
-- Количество файлов по папкам
SELECT f.name, COUNT(files.id) as file_count 
FROM folders f 
LEFT JOIN files ON f.id = files.folder_id 
GROUP BY f.id, f.name;

-- Размер файлов по папкам
SELECT f.name, SUM(files.file_size) as total_size 
FROM folders f 
LEFT JOIN files ON f.id = files.folder_id 
GROUP BY f.id, f.name;
```
