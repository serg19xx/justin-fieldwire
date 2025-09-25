# Все API Endpoints для File Manager

## 📁 **FOLDER OPERATIONS**

### 1. Get Folder Tree
**Endpoint:** `GET /api/v1/plan/folders/tree?project_id={projectId}`
**Purpose:** Получить иерархическое дерево папок проекта
**Used in:** `loadCurrentPath()` - загрузка левой панели

### 2. Get Folder Content  
**Endpoint:** `GET /api/v1/plan/folders/{folderId}/content`
**Purpose:** Получить содержимое папки (файлы и подпапки)
**Used in:** `loadCurrentPath()` - загрузка правой панели

### 3. Create Folder
**Endpoint:** `POST /api/v1/plan/folders`
**Body:** `{ name, project_id, parent_id }`
**Purpose:** Создать новую папку
**Used in:** `createFolder()` - создание папки

### 4. Delete Folder
**Endpoint:** `DELETE /api/v1/plan/folders/{folderId}`
**Purpose:** Удалить папку
**Used in:** `deleteFolder()` - удаление папки

### 5. Rename Folder
**Endpoint:** `PUT /api/v1/plan/folders/{folderId}/rename`
**Body:** `{ new_name }`
**Purpose:** Переименовать папку
**Used in:** `executeRename()` - переименование папки

### 6. Move Folder
**Endpoint:** `PUT /api/v1/plan/folders/{folderId}/move`
**Body:** `{ parent_id }`
**Purpose:** Переместить папку в другую папку
**Used in:** `executeMove()`, `executePasteToFolder()` - перемещение папок

### 7. Copy Folder
**Endpoint:** `POST /api/v1/plan/folders/{folderId}/copy`
**Body:** `{ parent_id, name }`
**Purpose:** Скопировать папку со всем содержимым
**Used in:** `executePasteToFolder()` - копирование папок

### 8. Get Folder Info
**Endpoint:** `GET /api/v1/plan/folders/{folderId}`
**Purpose:** Получить информацию о папке по ID
**Used in:** `executePasteToFolder()` - получение данных папки для копирования

---

## 📄 **FILE OPERATIONS**

### 9. Upload File
**Endpoint:** `POST /api/v1/plan/files/upload`
**Body:** `FormData` with file + metadata
**Purpose:** Загрузить файл в папку
**Used in:** `uploadFiles()` - загрузка файлов

### 10. Download File
**Endpoint:** `GET /api/v1/plan/files/{fileId}/download`
**Purpose:** Скачать файл
**Used in:** `downloadFile()`, `downloadSelected()` - скачивание файлов

### 11. Preview File
**Endpoint:** `GET /api/v1/plan/files/{fileId}/download?action=preview`
**Purpose:** Предварительный просмотр файла
**Used in:** `previewFile()` - просмотр файлов

### 12. Delete File
**Endpoint:** `DELETE /api/v1/plan/files/{fileId}`
**Purpose:** Удалить файл
**Used in:** `deleteFile()` - удаление файлов

### 13. Rename File
**Endpoint:** `PUT /api/v1/plan/files/{fileId}/rename`
**Body:** `{ new_name }`
**Purpose:** Переименовать файл
**Used in:** `executeRename()` - переименование файлов

### 14. Move File
**Endpoint:** `PUT /api/v1/plan/files/{fileId}/move`
**Body:** `{ folder_id }`
**Purpose:** Переместить файл в другую папку
**Used in:** `executeMove()`, `executePasteToFolder()` - перемещение файлов

### 15. Copy File
**Endpoint:** `POST /api/v1/plan/files/{fileId}/copy`
**Body:** `{ folder_id, file_name }`
**Purpose:** Скопировать файл в другую папку
**Used in:** `executePasteToFolder()` - копирование файлов

### 16. Update File Description
**Endpoint:** `PUT /api/v1/plan/files/{fileId}/description`
**Body:** `{ description }`
**Purpose:** Обновить описание файла
**Used in:** `executeDescriptionUpdate()` - редактирование описания

### 17. Get File Info
**Endpoint:** `GET /api/v1/plan/files/{fileId}`
**Purpose:** Получить информацию о файле по ID
**Used in:** `executePasteToFolder()` - получение данных файла для копирования

---

## 🔧 **ДОПОЛНИТЕЛЬНЫЕ ENDPOINTS**

### 18. Get Subfolders
**Endpoint:** `GET /api/v1/plan/folders/{folderId}/subfolders`
**Purpose:** Получить подпапки конкретной папки
**Used in:** (возможно не используется в текущем коде)

### 19. Update File Metadata
**Endpoint:** `PUT /api/v1/plan/files/{fileId}`
**Body:** `Partial<FileUpload>`
**Purpose:** Обновить метаданные файла
**Used in:** (возможно не используется в текущем коде)

---

## 📊 **СТАТИСТИКА ENDPOINTS**

**Всего endpoints:** 19
- **GET:** 6 endpoints
- **POST:** 4 endpoints  
- **PUT:** 7 endpoints
- **DELETE:** 2 endpoints

**По функциональности:**
- **Папки:** 8 endpoints
- **Файлы:** 9 endpoints
- **Дополнительные:** 2 endpoints

---

## 🚨 **ПРИОРИТЕТ РЕАЛИЗАЦИИ**

### **ВЫСОКИЙ ПРИОРИТЕТ (критично для работы):**
1. `GET /api/v1/plan/folders/tree` - дерево папок
2. `GET /api/v1/plan/folders/{folderId}/content` - содержимое папки
3. `POST /api/v1/plan/folders` - создание папки
4. `DELETE /api/v1/plan/folders/{folderId}` - удаление папки
5. `POST /api/v1/plan/files/upload` - загрузка файлов
6. `GET /api/v1/plan/files/{fileId}/download` - скачивание файлов
7. `DELETE /api/v1/plan/files/{fileId}` - удаление файлов

### **СРЕДНИЙ ПРИОРИТЕТ (для основных операций):**
8. `PUT /api/v1/plan/files/{fileId}/rename` - переименование файлов
9. `PUT /api/v1/plan/folders/{folderId}/rename` - переименование папок
10. `PUT /api/v1/plan/files/{fileId}/description` - описание файлов
11. `PUT /api/v1/plan/files/{fileId}/move` - перемещение файлов
12. `PUT /api/v1/plan/folders/{folderId}/move` - перемещение папок

### **НИЗКИЙ ПРИОРИТЕТ (для расширенной функциональности):**
13. `POST /api/v1/plan/files/{fileId}/copy` - копирование файлов
14. `POST /api/v1/plan/folders/{folderId}/copy` - копирование папок
15. `GET /api/v1/plan/files/{fileId}` - информация о файле
16. `GET /api/v1/plan/folders/{folderId}` - информация о папке
17. `GET /api/v1/plan/files/{fileId}/download?action=preview` - предпросмотр

**Рекомендую начать с ВЫСОКОГО приоритета, затем СРЕДНИЙ, затем НИЗКИЙ.**
