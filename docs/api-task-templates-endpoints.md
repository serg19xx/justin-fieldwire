# Task Templates API — Backend Specification

## Overview

Спецификация эндпоинтов API для управления шаблонами задач (таблица `fw_task_templates`). Используется на странице «Task Templates» и при создании задач «From templates».

**Base path:** `/api/v1/task-templates`

**Формат ответов:** успешные ответы имеют верхний уровень `status`, `message` и `data`. В `data` — полезная нагрузка (`templates` или `template`). Коды: 200, 201, 400, 403, 404, 422.

---

## 1. List all task templates

**Endpoint:** `GET /api/v1/task-templates`

**Description:** Возвращает все шаблоны задач в контексте текущего тенанта. Для страницы управления и для выбора шаблонов при создании задач.

**Request:** без тела. Заголовок авторизации — как в остальных запросах.

**Response (200 OK):**

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

- `templates` — массив объектов шаблона (см. раздел «Task template object»).
- Если записей нет — вернуть `"templates": []`.

---

## 2. Get one task template by ID

**Endpoint:** `GET /api/v1/task-templates/:id`

**Description:** Возвращает один шаблон по `id`. Для формы редактирования и перед созданием задачи из шаблона.

**Path parameters:** `id` — integer, первичный ключ `fw_task_templates`.

**Request:** без тела.

**Response (200 OK):**

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

**Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Template not found",
  "data": null
}
```

---

## 3. Create task template

**Endpoint:** `POST /api/v1/task-templates`

**Description:** Создание нового шаблона. Доступ: роли **admin**, **project_manager**.

**Request body:**

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

**Поля в `template`:**
- `name` — string, **обязательное**, max 255.
- `description` — string, необязательное, text.
- `category` — string, необязательное, max 100.
- `duration_days` — integer, необязательное, unsigned.
- `start_offset_days` — integer, необязательное, nullable (дни от старта проекта).
- `end_offset_days` — integer, необязательное, nullable (дни от старта проекта для даты окончания).
- `milestone` — string, необязательное, nullable. Допустимые значения: `inspection`, `visit`, `meeting`, `review`, `delivery`, `approval`, `other`. Иначе — обычная задача (в БД `NULL`).
- `status` — string, необязательное, по умолчанию `planned`. Допустимые: `planned`, `scheduled`, `scheduled_accepted`, `in_progress`, `partially_completed`, `delayed_due_to_issue`, `ready_for_inspection`, `completed`.
- `notes` — string, необязательное, text.
- `wbs_path` — string, необязательное, max 100 (например `"1.1.1"`).
- `task_order` — integer, необязательное, unsigned (порядок в последовательности шаблонов).

**Response (201 Created):**

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

В `data.template` — полная сохранённая запись с `id`, `created_at`, `updated_at`.

**Response (400/422 Validation Error):**
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

**Response (403 Forbidden):**
```json
{
  "status": "error",
  "message": "Access denied",
  "data": null
}
```

---

## 4. Update task template

**Endpoint:** `PUT /api/v1/task-templates/:id`

**Description:** Обновление существующего шаблона. Доступ: **admin**, **project_manager**.

**Path parameters:** `id` — integer, первичный ключ.

**Request body:**

```json
{
  "template": {
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
    "task_order": 14
  }
}
```

- В `template` передаются только изменяемые поля (partial update). Правила полей — как в разделе «Create».

**Response (200 OK):**

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

**Response (404/400/422/403):** как в разделе Create — `status: "error"`, `message`, при валидации в `data.errors` — объект с полями.

---

## 5. Delete task template

**Endpoint:** `DELETE /api/v1/task-templates/:id`

**Description:** Удаление шаблона. Доступ: **admin**, **project_manager**.

**Path parameters:** `id` — integer, первичный ключ.

**Request:** без тела.

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Task template deleted successfully"
}
```

Либо `204 No Content` без тела.

**Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Template not found",
  "data": null
}
```

**Response (403 Forbidden):**
```json
{
  "status": "error",
  "message": "Access denied",
  "data": null
}
```

---

## Task template object (reference)

| Field             | Type    | Required | DB column         | Notes |
|-------------------|---------|----------|-------------------|--------|
| id                | integer | —        | id                | Задаётся бекендом, auto-increment. |
| name              | string  | да       | name              | Max 255. |
| description       | string  | нет      | description        | Text. |
| category          | string  | нет      | category          | Max 100. |
| duration_days     | integer | нет      | duration_days     | Unsigned. |
| start_offset_days | integer | нет      | start_offset_days | Nullable. |
| end_offset_days   | integer | нет      | end_offset_days   | Nullable. |
| milestone         | string  | нет      | milestone         | Nullable. Enum: inspection, visit, meeting, review, delivery, approval, other. |
| status            | string  | нет      | status            | Default `planned`. Enum: planned, scheduled, scheduled_accepted, in_progress, partially_completed, delayed_due_to_issue, ready_for_inspection, completed. |
| notes             | string  | нет      | notes             | Text. |
| wbs_path          | string  | нет      | wbs_path          | Max 100. |
| task_order        | integer | нет      | task_order        | Unsigned. |
| created_at        | string  | —        | created_at        | ISO 8601. Задаётся бекендом. |
| updated_at        | string  | —        | updated_at        | ISO 8601. Обновляется бекендом. |

---

## Summary

| Method | Endpoint                     | Purpose   | Auth (role)        |
|--------|-----------------------------|-----------|---------------------|
| GET    | /api/v1/task-templates       | List all  | любой авторизованный |
| GET    | /api/v1/task-templates/:id   | Get one   | любой авторизованный |
| POST   | /api/v1/task-templates       | Create    | admin, project_manager |
| PUT    | /api/v1/task-templates/:id   | Update    | admin, project_manager |
| DELETE | /api/v1/task-templates/:id   | Delete    | admin, project_manager |

Фронтенд ожидает: верхний уровень `status`, `message`, `data`; в `data` — `templates` (массив) или `template` (объект). Чтение: `response.data.data.templates` / `response.data.data.template`.
