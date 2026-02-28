# Backend: API для редактирования шаблонов задач (Task Templates)

## Назначение

Фронтенд реализует страницу **Task Templates** (`/task-templates`): список шаблонов, добавление, редактирование и удаление. Доступ только у ролей **admin** и **project_manager** (в меню пункт пока виден только менеджеру проектов).

Бекенду нужно реализовать 5 эндпоинтов для таблицы `fw_task_templates`. Формат ответов — единый с остальным API: верхний уровень `status`, `message`, `data`.

---

## Таблица БД

Используется существующая таблица:

```sql
CREATE TABLE `fw_task_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Task template name',
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `duration_days` int(10) unsigned DEFAULT NULL,
  `start_offset_days` int(11) DEFAULT NULL,
  `end_offset_days` int(11) DEFAULT NULL,
  `milestone` varchar(50) DEFAULT NULL COMMENT 'inspection, visit, meeting, review, delivery, approval, other, or NULL',
  `status` varchar(50) DEFAULT 'planned',
  `notes` text DEFAULT NULL,
  `wbs_path` varchar(100) DEFAULT NULL,
  `task_order` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_milestone_type` CHECK (`milestone` IS NULL OR `milestone` IN ('inspection','visit','meeting','review','delivery','approval','other')),
  CONSTRAINT `chk_status_type` CHECK (`status` IN ('planned','scheduled','scheduled_accepted','in_progress','partially_completed','delayed_due_to_issue','ready_for_inspection','completed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Формат ответов

- **Успех:** `{ "status": "success", "message": "...", "data": { ... } }`
- **Ошибка:** `{ "status": "error", "message": "...", "data": null }` или при валидации `"data": { "errors": { "field": ["..."] } }`

Фронтенд читает: `response.data.data.templates` (список) или `response.data.data.template` (один объект).

---

## Эндпоинты

### 1. Список шаблонов

**GET** `/api/v1/task-templates`

**Ответ 200 OK:**
```json
{
  "status": "success",
  "message": "Task templates retrieved successfully",
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Site Survey",
        "description": "Initial site survey and assessment",
        "category": "Site Preparation",
        "duration_days": 1,
        "start_offset_days": 0,
        "end_offset_days": null,
        "milestone": null,
        "status": "planned",
        "notes": null,
        "wbs_path": "1.1",
        "task_order": 1,
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```
Если записей нет — `"templates": []`.

---

### 2. Один шаблон по ID

**GET** `/api/v1/task-templates/:id`

**Ответ 200 OK:**
```json
{
  "status": "success",
  "message": "Task template retrieved successfully",
  "data": {
    "template": {
      "id": 1,
      "name": "Site Survey",
      "description": "Initial site survey and assessment",
      "category": "Site Preparation",
      "duration_days": 1,
      "start_offset_days": 0,
      "end_offset_days": null,
      "milestone": null,
      "status": "planned",
      "notes": null,
      "wbs_path": "1.1",
      "task_order": 1,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  }
}
```

**Ответ 404:**
```json
{
  "status": "error",
  "message": "Template not found",
  "data": null
}
```

---

### 3. Создать шаблон

**POST** `/api/v1/task-templates`  
**Доступ:** admin, project_manager.

**Тело запроса:**
```json
{
  "template": {
    "name": "Foundation Inspection",
    "description": "Inspection of completed foundation",
    "category": "Milestones",
    "duration_days": 1,
    "start_offset_days": 19,
    "end_offset_days": null,
    "milestone": "inspection",
    "status": "planned",
    "notes": null,
    "wbs_path": "1.2.1",
    "task_order": 13
  }
}
```

- Обязательное поле только `name` (string, max 255).
- `milestone`: строка или null; допустимые значения — `inspection`, `visit`, `meeting`, `review`, `delivery`, `approval`, `other`.
- `status`: по умолчанию `planned`; допустимые — `planned`, `scheduled`, `scheduled_accepted`, `in_progress`, `partially_completed`, `delayed_due_to_issue`, `ready_for_inspection`, `completed`.

**Ответ 201 Created:**
```json
{
  "status": "success",
  "message": "Task template created successfully",
  "data": {
    "template": {
      "id": 207,
      "name": "Foundation Inspection",
      "description": "Inspection of completed foundation",
      "category": "Milestones",
      "duration_days": 1,
      "start_offset_days": 19,
      "end_offset_days": null,
      "milestone": "inspection",
      "status": "planned",
      "notes": null,
      "wbs_path": "1.2.1",
      "task_order": 13,
      "created_at": "2025-02-28T12:00:00Z",
      "updated_at": "2025-02-28T12:00:00Z"
    }
  }
}
```

**Ответ 400/422 (валидация):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "data": {
    "errors": {
      "name": ["Name is required"]
    }
  }
}
```

**Ответ 403:**
```json
{
  "status": "error",
  "message": "Access denied",
  "data": null
}
```

---

### 4. Обновить шаблон

**PUT** `/api/v1/task-templates/:id`  
**Доступ:** admin, project_manager.

**Тело запроса:** тот же формат, что и при создании; в `template` передаются только изменяемые поля (partial update). Правила полей — как в п. 3.

**Ответ 200 OK:**
```json
{
  "status": "success",
  "message": "Task template updated successfully",
  "data": {
    "template": {
      "id": 207,
      "name": "Foundation Inspection (updated)",
      "description": "Optional description",
      "category": "Milestones",
      "duration_days": 1,
      "start_offset_days": 20,
      "end_offset_days": null,
      "milestone": "inspection",
      "status": "planned",
      "notes": null,
      "wbs_path": "1.2.1",
      "task_order": 14,
      "created_at": "2025-02-28T12:00:00Z",
      "updated_at": "2025-02-28T12:05:00Z"
    }
  }
}
```

Ошибки 404 / 400 / 422 / 403 — в том же формате, что и для создания.

---

### 5. Удалить шаблон

**DELETE** `/api/v1/task-templates/:id`  
**Доступ:** admin, project_manager.

**Тело запроса:** не используется.

**Ответ 200 OK:**
```json
{
  "status": "success",
  "message": "Task template deleted successfully"
}
```
Допустим также ответ **204 No Content** без тела.

**Ответ 404 / 403:** как выше — `status: "error"`, `message`, `data: null`.

---

## Сводка

| Method | Endpoint                       | Назначение | Роли                |
|--------|--------------------------------|------------|---------------------|
| GET    | /api/v1/task-templates         | Список     | любой авторизованный |
| GET    | /api/v1/task-templates/:id     | Один       | любой авторизованный |
| POST   | /api/v1/task-templates         | Создать    | admin, project_manager |
| PUT    | /api/v1/task-templates/:id     | Обновить   | admin, project_manager |
| DELETE | /api/v1/task-templates/:id     | Удалить    | admin, project_manager |

---

## Полная спецификация

Подробное описание полей, ограничений и примеров: **`docs/api-task-templates-endpoints.md`**.
