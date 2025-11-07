# API Requirements for Invited People (Milestone Guests)

## Overview

**ВАЖНО: Разница между задачами и milestone**

### Для обычных задач (regular tasks):
- В таблицу `fw_prj_team_members` добавляются **члены бригады** (workers/team members)
- **Каждый член бригады = отдельная строка** в `fw_prj_team_members`
- Например: 3 члена бригады = 3 строки в таблице

### Для milestone:
- В таблицу `fw_prj_team_members` добавляется **один ответственный** (task_lead) = **одна строка**
- Плюс **JSON с приглашенными** - это НЕ отдельные строки, а **JSON поле** (массив объектов)
- Например: 1 ответственный + JSON с 5 приглашенными = **1 строка** в таблице (не 6!)

## Database Structure

### Table: `fw_prj_team_members`

#### Для обычных задач (regular tasks):
Каждый член бригады = отдельная строка:
- `id` - auto increment
- `project_id` - ID проекта
- `task_id` - ID задачи
- `user_id` - ID пользователя из `fw_users`
- `role_in_project` - роль (например, 'worker', 'supervisor', etc.)
- `assigned_at` - timestamp

#### Для milestone:
**ОДНА строка** с ответственным и JSON с приглашенными:
- `id` - auto increment
- `project_id` - ID проекта
- `task_id` - ID milestone
- `user_id` - ID ответственного (task_lead) из `fw_users`
- `role_in_project` - **'task_lead'** (ответственный за milestone)
- `assigned_at` - timestamp
- `invited_people` - **JSON поле** (массив объектов) с приглашенными:
  ```json
  [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "ABC Construction",
      "phone": "+1 (555) 123-4567",
      "notes": "External inspector",
      "avatar": "https://..."
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "company": "XYZ Corp"
    }
  ]
  ```

**Пример структуры для milestone:**
```
id | project_id | task_id | user_id | role_in_project | assigned_at | invited_people
88 | 38         | 63      | 47      | task_lead       | 2025-11-06  | [{"name":"John Doe",...},{"name":"Jane Smith",...}]
```

**Одна строка содержит:**
- Ответственного (task_lead) в поле `user_id`
- Всех приглашенных в JSON поле `invited_people` (массив)

## API Endpoints

### 1. Create/Update Task/Milestone

**Endpoints:**
```
POST /api/v1/projects/{projectId}/tasks
PUT /api/v1/projects/{projectId}/tasks/{taskId}
```

**Request Body для milestone:**
```json
{
  "name": "MS 2",
  "milestone": "approval",
  "task_lead_id": 47,
  "start_planned": "2025-11-06",
  "end_planned": "2025-11-06",
  "invited_people": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "ABC Construction",
      "phone": "+1 (555) 123-4567",
      "notes": "External inspector",
      "avatar": "https://..."
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "company": "XYZ Corp"
    }
  ]
}
```

**Request Body для обычной задачи:**
```json
{
  "name": "Task 1",
  "milestone": null,
  "start_planned": "2025-11-06",
  "end_planned": "2025-11-10",
  "invited_people": null,
  "team_members": [45, 46, 47]
}
```

**Backend Processing:**

#### Для milestone (когда `milestone` не null):
1. Создать/обновить задачу в `fw_tasks`
2. В таблице `fw_prj_team_members`:
   - **Найти или создать ОДНУ запись** для этого milestone:
     - `project_id` = из URL
     - `task_id` = ID milestone
     - `user_id` = `task_lead_id` из запроса
     - `role_in_project` = 'task_lead'
     - `assigned_at` = текущий timestamp
     - `invited_people` = **JSON массив** из `invited_people` запроса
   - Если запись существует (при обновлении) - **обновить** `user_id` и `invited_people`
   - Если `invited_people` = `[]` (пустой массив) - установить `invited_people` = `[]` (JSON)
   - Если `invited_people` = `null` - установить `invited_people` = `null`

#### Для обычной задачи (когда `milestone` = null):
1. Создать/обновить задачу в `fw_tasks`
2. В таблице `fw_prj_team_members`:
   - **Удалить все существующие записи** для этой задачи (если обновление)
   - **Создать отдельные строки** для каждого члена бригады из `team_members`:
     - `project_id` = из URL
     - `task_id` = ID задачи
     - `user_id` = ID из массива `team_members`
     - `role_in_project` = роль члена бригады
     - `assigned_at` = текущий timestamp
   - `invited_people` = `null` (не используется для обычных задач)

**Важно:**
- Для milestone: **ОДНА строка** в `fw_prj_team_members` с ответственным + JSON массив приглашенных
- Для обычной задачи: **отдельные строки** для каждого члена бригады
- `invited_people` используется **только для milestone**, для обычных задач = `null`

---

### 2. Get Team Members for Task/Milestone

**Endpoint:**
```
GET /api/v1/projects/{projectId}/tasks/{taskId}/team
```

**Response для milestone:**
```json
{
  "status": "success",
  "data": {
    "team_members": [
      {
        "id": 88,
        "project_id": 38,
        "task_id": 63,
        "user_id": 47,
        "role_in_project": "task_lead",
        "assigned_at": "2025-11-06 13:49:34.000",
        "name": "Mike Davis",
        "email": "mike@example.com",
        "user_type": "project_manager",
        "job_title": "Project Manager",
        "invited_people": [
          {
            "name": "John Doe",
            "email": "john@example.com",
            "company": "ABC Construction",
            "phone": "+1 (555) 123-4567",
            "notes": "External inspector",
            "avatar": "https://..."
          },
          {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "company": "XYZ Corp"
          }
        ]
      }
    ]
  }
}
```

**Response для обычной задачи:**
```json
{
  "status": "success",
  "data": {
    "team_members": [
      {
        "id": 89,
        "project_id": 38,
        "task_id": 64,
        "user_id": 45,
        "role_in_project": "worker",
        "assigned_at": "2025-11-06 14:00:00.000",
        "name": "Worker 1",
        "email": "worker1@example.com"
      },
      {
        "id": 90,
        "project_id": 38,
        "task_id": 64,
        "user_id": 46,
        "role_in_project": "worker",
        "assigned_at": "2025-11-06 14:00:00.000",
        "name": "Worker 2",
        "email": "worker2@example.com"
      }
    ]
  }
}
```

**Notes:**
- Для milestone: возвращает **одну запись** с `role_in_project = 'task_lead'` и JSON массивом `invited_people`
- Для обычной задачи: возвращает **отдельные записи** для каждого члена бригады
- Если `user_id` не NULL, использовать данные из `fw_users` таблицы
- Если `invited_people` не NULL, это JSON массив с приглашенными

---

## Summary

### Структура данных:

**Обычные задачи:**
- `fw_prj_tasks` - основная информация о задаче
- `fw_prj_team_members` - **отдельные строки** для каждого члена бригады
- `invited_people` = `null` (не используется)

**Milestone:**
- `fw_prj_tasks` - основная информация о milestone
- `fw_prj_team_members` - **ОДНА строка** с:
  - `user_id` = ответственный (task_lead)
  - `role_in_project` = 'task_lead'
  - `invited_people` = **JSON массив** с приглашенными (не отдельные строки!)

### API Endpoints:

1. ✅ `POST /api/v1/projects/{projectId}/tasks` - Создать задачу/milestone
2. ✅ `PUT /api/v1/projects/{projectId}/tasks/{taskId}` - Обновить задачу/milestone
3. ✅ `GET /api/v1/projects/{projectId}/tasks/{taskId}/team` - Получить членов команды/приглашенных

### Ключевые моменты для бэкенда:

1. **Для milestone:** ОДНА строка в `fw_prj_team_members` с ответственным + JSON массив приглашенных
2. **Для обычной задачи:** Отдельные строки в `fw_prj_team_members` для каждого члена бригады
3. **invited_people** - это JSON поле (массив), НЕ отдельные строки в таблице
4. При обновлении milestone с `invited_people` - обновить JSON поле в существующей записи, не создавать новые строки
