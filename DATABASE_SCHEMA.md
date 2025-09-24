# Database Schema for File Management System

## 1. Folders Table (Папки)

```sql
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Индексы для производительности
  INDEX idx_folders_parent_id (parent_id),
  INDEX idx_folders_name (name)
);
```

### Поля:
- **id** - уникальный идентификатор папки
- **name** - имя папки (отображается в интерфейсе)
- **parent_id** - ID родительской папки (NULL для корневых папок)
- **created_at** - дата создания
- **updated_at** - дата последнего изменения

## 2. Files Table (Файлы)

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,           -- Имя файла в интерфейсе
  original_name VARCHAR(255) NOT NULL,       -- Оригинальное имя при загрузке
  file_path VARCHAR(500) NOT NULL,           -- Физический путь на сервере
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  file_size BIGINT NOT NULL,                 -- Размер файла в байтах
  mime_type VARCHAR(100) NOT NULL,           -- MIME тип файла
  category VARCHAR(100),                     -- Категория файла
  description TEXT,                          -- Описание файла
  version VARCHAR(50),                       -- Версия файла
  uploaded_by INTEGER NOT NULL,              -- ID пользователя, загрузившего файл
  uploaded_at TIMESTAMP DEFAULT NOW(),       -- Дата загрузки
  updated_at TIMESTAMP DEFAULT NOW(),        -- Дата последнего изменения
  
  -- Индексы для производительности
  INDEX idx_files_folder_id (folder_id),
  INDEX idx_files_uploaded_by (uploaded_by),
  INDEX idx_files_category (category),
  INDEX idx_files_mime_type (mime_type)
);
```

### Поля:
- **id** - уникальный идентификатор файла
- **file_name** - имя файла для отображения (может отличаться от original_name)
- **original_name** - оригинальное имя файла при загрузке
- **file_path** - физический путь к файлу на сервере (уникальный)
- **folder_id** - ID папки, в которой находится файл
- **file_size** - размер файла в байтах
- **mime_type** - MIME тип файла (image/jpeg, application/pdf, etc.)
- **category** - категория файла (plans, photos, documents, etc.)
- **description** - описание файла
- **version** - версия файла
- **uploaded_by** - ID пользователя, загрузившего файл
- **uploaded_at** - дата загрузки
- **updated_at** - дата последнего изменения

## 3. File Operations Log (Лог операций с файлами)

```sql
CREATE TABLE file_operations (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,      -- copy, move, rename, delete
  old_folder_id INTEGER REFERENCES folders(id),
  new_folder_id INTEGER REFERENCES folders(id),
  old_name VARCHAR(255),
  new_name VARCHAR(255),
  performed_by INTEGER NOT NULL,             -- ID пользователя
  performed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_file_operations_file_id (file_id),
  INDEX idx_file_operations_performed_by (performed_by)
);
```

### Поля:
- **id** - уникальный идентификатор операции
- **file_id** - ID файла, с которым выполнялась операция
- **operation_type** - тип операции (copy, move, rename, delete)
- **old_folder_id** - ID старой папки (для move операций)
- **new_folder_id** - ID новой папки (для move/copy операций)
- **old_name** - старое имя файла (для rename операций)
- **new_name** - новое имя файла (для rename операций)
- **performed_by** - ID пользователя, выполнившего операцию
- **performed_at** - дата и время операции

## 4. Folder Operations Log (Лог операций с папками)

```sql
CREATE TABLE folder_operations (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,      -- create, rename, delete, move
  old_parent_id INTEGER REFERENCES folders(id),
  new_parent_id INTEGER REFERENCES folders(id),
  old_name VARCHAR(255),
  new_name VARCHAR(255),
  performed_by INTEGER NOT NULL,
  performed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_folder_operations_folder_id (folder_id),
  INDEX idx_folder_operations_performed_by (performed_by)
);
```

## 5. File Conflicts (Конфликты файлов)

```sql
CREATE TABLE file_conflicts (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL,      -- name_conflict, size_conflict
  conflicting_file_id INTEGER REFERENCES files(id),
  resolution VARCHAR(50),                  -- replace, rename, cancel
  resolved_by INTEGER,
  resolved_at TIMESTAMP,
  
  INDEX idx_file_conflicts_file_id (file_id)
);
```

## API Response Structures

### 1. Folder Tree Response
```typescript
interface FolderTreeResponse {
  folders: Array<{
    id: number
    name: string
    parent_id: number | null
    created_at: string
    updated_at: string
    children?: FolderTreeResponse['folders'] // Для вложенных папок
  }>
}
```

### 2. Files in Folder Response
```typescript
interface FilesInFolderResponse {
  files: Array<{
    id: number
    file_name: string
    original_name: string
    file_path: string
    folder_id: number
    file_size: number
    mime_type: string
    category: string
    description: string | null
    version: string | null
    uploaded_by: number
    uploaded_at: string
    updated_at: string
  }>
  total: number
  page: number
  limit: number
}
```

### 3. File Upload Response
```typescript
interface FileUploadResponse {
  file: {
    id: number
    file_name: string
    original_name: string
    file_path: string
    folder_id: number
    file_size: number
    mime_type: string
    category: string
    description: string
    version: string
    uploaded_by: number
    uploaded_at: string
    updated_at: string
  }
  success: boolean
  message: string
}
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

## Операции и их влияние на базу данных

### 1. Copy File
```sql
-- Создает новую запись в files с тем же file_path
INSERT INTO files (file_name, original_name, file_path, folder_id, ...)
VALUES (new_name, original_name, same_file_path, new_folder_id, ...);

-- Логирует операцию
INSERT INTO file_operations (file_id, operation_type, new_folder_id, ...)
VALUES (original_file_id, 'copy', new_folder_id, ...);
```

### 2. Move File
```sql
-- Обновляет folder_id в существующей записи
UPDATE files SET folder_id = new_folder_id, updated_at = NOW()
WHERE id = file_id;

-- Логирует операцию
INSERT INTO file_operations (file_id, operation_type, old_folder_id, new_folder_id, ...)
VALUES (file_id, 'move', old_folder_id, new_folder_id, ...);
```

### 3. Rename File
```sql
-- Обновляет file_name в существующей записи
UPDATE files SET file_name = new_name, updated_at = NOW()
WHERE id = file_id;

-- Логирует операцию
INSERT INTO file_operations (file_id, operation_type, old_name, new_name, ...)
VALUES (file_id, 'rename', old_name, new_name, ...);
```

### 4. Delete File
```sql
-- Удаляет запись из files (физический файл остается для garbage collection)
DELETE FROM files WHERE id = file_id;

-- Логирует операцию
INSERT INTO file_operations (file_id, operation_type, ...)
VALUES (file_id, 'delete', ...);
```

## Индексы для производительности

```sql
-- Основные индексы
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_name ON folders(name);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_mime_type ON files(mime_type);

-- Составные индексы для частых запросов
CREATE INDEX idx_files_folder_category ON files(folder_id, category);
CREATE INDEX idx_files_uploaded_at ON files(uploaded_at);
CREATE INDEX idx_folders_created_at ON folders(created_at);
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

## Очистка и обслуживание

### Garbage Collection для файлов
```sql
-- Найти файлы, на которые нет ссылок в таблице files
SELECT file_path FROM files 
WHERE file_path NOT IN (SELECT file_path FROM files);
```

### Архивирование старых операций
```sql
-- Архивировать операции старше 1 года
INSERT INTO file_operations_archive 
SELECT * FROM file_operations 
WHERE performed_at < NOW() - INTERVAL 1 YEAR;

DELETE FROM file_operations 
WHERE performed_at < NOW() - INTERVAL 1 YEAR;
```
