# Task Save Flow - Как работает сохранение задач

## Общая схема

```
TaskEditPanel (форма) 
  ↓ emit('save', taskData)
ProjectCalendar.handleTaskEditPanelSave() 
  ↓ вызывает handleTaskSave()
ProjectCalendar.handleTaskSave() 
  ↓ формирует payload
tasksApi.create() или tasksApi.update() 
  ↓ преобразует в snake_case
API Backend (POST /api/v1/projects/{id}/tasks или PUT /api/v1/projects/{id}/tasks/{id})
```

## 1. TaskEditPanel.vue

**Функция:** `handleBasicInfoSave()`

**Что делает:**
- Берет данные из `form.value` (локальное состояние формы)
- Преобразует зависимости в правильный формат
- Создает объект `taskData` с полями в формате `snake_case`:
  - `name`, `start_planned`, `end_planned`, `duration_days`
  - `milestone`, `milestone_type`, `status`, `progress_pct`
  - `task_lead_id` (из `form.value.project_lead`)
  - `team_members`, `resources`, `dependencies`
  - `project_id`
- Добавляет `id` если режим редактирования
- Вызывает `emit('save', taskData)`

**Логирование:**
- `📤 TaskEditPanel: Emitting save event`
- Показывает полный `taskData` в JSON формате

## 2. ProjectCalendar.vue

**Функция:** `handleTaskEditPanelSave(taskData)`

**Что делает:**
- Получает `taskData` от TaskEditPanel
- Определяет режим (create/update) по наличию `taskData.id`
- Вызывает `handleTaskSave(taskData)`

**Функция:** `handleTaskSave(taskData)`

**Для CREATE (создание):**
- Создает `createPayload` в формате `camelCase` (для TaskCreateUpdate):
  - `name`, `startPlanned`, `endPlanned`, `status`, `progressPct`
  - `wbsPath`, `durationDays`, `notes` (опционально)
  - `milestone_type` (если milestone)
  - `task_lead_id`, `team_members`, `resources`, `dependencies` (если есть)
- Вызывает `tasksApi.create(projectId, createPayload)`

**Для UPDATE (обновление):**
- Создает `updatePayload` в формате `snake_case`:
  - `name`, `start_planned`, `end_planned`, `status`, `progress_pct`
  - `wbs_path`, `duration_days`, `notes` (опционально)
  - `milestone` (не milestone_type! API ожидает milestone)
  - `task_lead_id`, `team_members`, `resources`, `dependencies` (если есть)
- Вызывает `tasksApi.update(projectId, taskId, updatePayload)`

**Логирование:**
- `📥 ProjectCalendar: handleTaskSave called`
- Показывает полный `taskData` и `payload` в JSON формате

## 3. tasks-api.ts

**Функция:** `create(projectId, data: TaskCreateUpdate)`

**Что делает:**
- Принимает данные в формате `camelCase` (TaskCreateUpdate)
- Преобразует в `snake_case` для API:
  - `startPlanned` → `start_planned`
  - `endPlanned` → `end_planned`
  - `wbsPath` → `wbs_path`
  - `progressPct` → `progress_pct`
  - `milestone_type` → `milestone` (API ожидает milestone)
- Отправляет POST запрос на `/api/v1/projects/{projectId}/tasks`

**Функция:** `update(projectId, taskId, data)`

**Что делает:**
- Принимает данные в формате `snake_case`
- Преобразует `milestone_type` → `milestone` если нужно
- Отправляет PUT запрос на `/api/v1/projects/{projectId}/tasks/{taskId}`

## Важные моменты

1. **task_lead_id:**
   - Для обычных задач: НЕ устанавливается автоматически, PM выбирает из списка
   - Для milestone: Автоматически устанавливается на текущего PM (если не выбран)
   - Если `undefined` или `null` - НЕ включается в payload

2. **milestone vs milestone_type:**
   - В форме: используется `milestone` (boolean/string) и `milestone_type` (string)
   - В API create: используется `milestone_type` (в TaskCreateUpdate)
   - В API update: используется `milestone` (API ожидает поле milestone)
   - В tasks-api: преобразуется `milestone_type` → `milestone` для API

3. **team_members:**
   - Массив ID пользователей: `[1, 2, 3]`
   - Автосохранение при добавлении/удалении (только для режима edit)

4. **Логирование:**
   - Все этапы логируются с разделителями `===`
   - В консоли браузера видно весь flow сохранения

## Как проверить

1. Откройте консоль браузера (F12)
2. Создайте или отредактируйте задачу
3. Нажмите "Save"
4. В консоли увидите:
   - `📤 TaskEditPanel: Emitting save event` - данные из формы
   - `📥 ProjectCalendar: handleTaskSave called` - данные полученные
   - `📤 Sending create/update payload` - что отправляется в API
   - `✅ Task created/updated via API` - успешный ответ

