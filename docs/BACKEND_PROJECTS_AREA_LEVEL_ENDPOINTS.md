# Backend: изменения по проектам — поля `area` и `level`

В таблицу проектов добавлены два поля. Ниже перечислены **все эндпоинты**, которые должны их учитывать на бекенде.

---

## 1. База данных

Таблица проектов (например `fw_projects`) уже содержит колонки:

- **`area`** — `mediumint(8) unsigned DEFAULT NULL` (площадь, например кв. футы)
- **`level`** — `enum('Basics','Full Service','Medical Nice','High End','Extravagant') DEFAULT NULL`

---

## 2. Эндпоинты, которые возвращают проекты (наборы данных)

Во **всех** ответах, где возвращается объект проекта или массив проектов, объект должен содержать `area` и `level` (если бекенд их отдаёт).

### GET /api/v1/projects

**Назначение:** список проектов с пагинацией и фильтрами.

**Что изменить:**

- В каждом элементе массива `data.projects` добавить в ответ поля:
  - **`area`** — number | null (integer, nullable)
  - **`level`** — string | null, одно из: `Basics`, `Full Service`, `Medical Nice`, `High End`, `Extravagant`

**Пример элемента в `data.projects`:**
```json
{
  "id": 1,
  "prj_name": "Office Building Construction",
  "address": "123 Main St, City, State",
  "date_start": "2025-01-01",
  "date_end": "2025-12-31",
  "priority": "High",
  "status": "Active",
  "area": 5000,
  "level": "Full Service",
  "prj_manager": 1,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### GET /api/v1/projects/{id}

**Назначение:** один проект по ID.

**Что изменить:**

- В объекте `data.project` включить в ответ:
  - **`area`** — number | null
  - **`level`** — string | null (те же значения enum, что выше)

---

## 3. Эндпоинты, которые принимают данные проекта (создание / обновление)

### POST /api/v1/projects

**Назначение:** создание проекта.

**Что изменить:**

- **Request body:** принимать опциональные поля:
  - **`area`** — integer, optional, nullable
  - **`level`** — string, optional, nullable; одно из: `Basics`, `Full Service`, `Medical Nice`, `High End`, `Extravagant`
- **Response:** в `data.project` возвращать созданный проект **с полями `area` и `level`** (как в п. 2).
- **SQL INSERT:** добавлять колонки `area`, `level` в INSERT и подставлять значения из тела запроса (или NULL).

**Пример тела запроса (фрагмент):**
```json
{
  "prj_name": "Office Building Construction",
  "address": "123 Main St, City, State",
  "area": 5000,
  "level": "Full Service",
  "status": "Active",
  "prj_manager": 1
}
```

---

### PUT /api/v1/projects/{id}

**Назначение:** обновление проекта.

**Что изменить:**

- **Request body:** принимать опциональные поля:
  - **`area`** — integer, optional, nullable (можно передать `null` для очистки)
  - **`level`** — string, optional, nullable (те же enum значения; `null` для очистки)
- **Response:** в ответе возвращать обновлённый проект **с полями `area` и `level`** (как в п. 2).
- **SQL UPDATE:** включить в SET колонки `area`, `level` и записывать значения из тела запроса (в т.ч. NULL при очистке).

**Пример тела запроса (фрагмент):**
```json
{
  "prj_name": "Updated Project Name",
  "status": "Completed",
  "area": 6000,
  "level": "High End"
}
```

Или очистка полей:
```json
{
  "area": null,
  "level": null
}
```

---

## 4. Сводная таблица

| Метод | URL | Изменение на бекенде |
|-------|-----|----------------------|
| **GET**  | `/api/v1/projects`       | В каждом объекте в `data.projects` возвращать `area`, `level`. |
| **GET**  | `/api/v1/projects/{id}`  | В объекте `data.project` возвращать `area`, `level`. |
| **POST** | `/api/v1/projects`       | Принимать в теле `area`, `level`; сохранять в БД; в ответе возвращать проект с `area`, `level`. |
| **PUT**  | `/api/v1/projects/{id}`  | Принимать в теле `area`, `level`; обновлять в БД; в ответе возвращать проект с `area`, `level`. |

**DELETE** `/api/v1/projects/{id}` — менять не нужно (тела проекта не возвращаются).

---

## 5. Валидация

- **`area`**: если передано — неотрицательное целое число (0 допустим); иначе хранить/возвращать `null`.
- **`level`**: если передано — строка из enum: `Basics`, `Full Service`, `Medical Nice`, `High End`, `Extravagant`; иначе хранить/возвращать `null`. При неверном значении — 400 с сообщением об ошибке (опционально).
 
---

## 6. Где ещё смотреть в репозитории

- Полное описание API проектов: **`API_ENDPOINTS.md`** (секция Projects Endpoints).
- Детали запроса PUT и проверки на бекенде: **`PROJECT_UPDATE_API_DETAILS.md`**.
- Ожидаемый формат ответа со списком проектов при 500: **`BACKEND_500_ERROR_TROUBLESHOOTING.md`**.
1`````1 98nhu,,,,,,,,,,,,l,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,k9k7