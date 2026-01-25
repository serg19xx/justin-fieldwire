# Цепочка вызовов для обновления проекта

## Полная цепочка вызовов

### 1. Пользователь нажимает кнопку "Save" в SettingsSection

**Файл:** `src/pages/projects/SettingsSection.vue`  
**Строка:** 169-175

```vue
<button
  type="submit"
  :disabled="isSaving"
  class="..."
>
  {{ isSaving ? 'Saving...' : 'Save' }}
</button>
```

**Форма:** `<form @submit.prevent="handleSubmit">` (строка 5)

---

### 2. Вызывается handleSubmit в SettingsSection

**Файл:** `src/pages/projects/SettingsSection.vue`  
**Строка:** 452-465

```typescript
const handleSubmit = () => {
  console.log('🔧 SettingsSection handleSubmit called')
  // ... проверки ...
  emit('saveSettings')  // ← Эмитит событие родителю
}
```

**Логи:**
- `🔧 SettingsSection handleSubmit called`
- `📤 Emitting saveSettings event to parent component`

---

### 3. Событие обрабатывается в ProjectDetailPrj

**Файл:** `src/pages/projects/ProjectDetailPrj.vue`  
**Строка:** 2689

```vue
<SettingsSection
  @save-settings="saveSettings"  // ← Обработчик события
  ...
/>
```

---

### 4. Вызывается функция saveSettings в ProjectDetailPrj

**Файл:** `src/pages/projects/ProjectDetailPrj.vue`  
**Строка:** 432

```typescript
async function saveSettings() {
  console.log('🔧 ProjectDetailPrj saveSettings called')
  // ... формирует updateData ...
  const response = await projectApi.update(project.value.id, updateData)
}
```

**Логи:**
- `🔧 ProjectDetailPrj saveSettings called`
- `📤 About to call projectApi.update with:`
- `✅ API call completed: PUT /api/v1/projects/{id}`

---

### 5. Вызывается projectApi.update

**Файл:** `src/core/utils/project-api.ts`  
**Строка:** 72-100

```typescript
async update(id: number, data: Record<string, unknown>) {
  console.log('📤 ProjectApi.update called:', { id, data })
  // ... формирует requestData ...
  const response = await api.put(`/api/v1/projects/${id}`, requestData)
  return response.data
}
```

**Логи:**
- `📤 ProjectApi.update called: { id, data }`
- `📤 Final request data with client fields: { ... }`
- `✅ ProjectApi.update response: { ... }`

---

### 6. HTTP запрос отправляется

**Метод:** `PUT`  
**URL:** `/api/v1/projects/{id}`  
**Где `{id}`** - ID проекта

**Тело запроса (JSON):**
```json
{
  "prj_name": "...",
  "address": "...",
  "client_id": 27566,
  "client_type": "Pharmacies",
  "client_table": "pharma",
  "client_data": { ... },
  ...
}
```

---

## Как проверить, что вызов происходит

### Шаг 1: Откройте консоль браузера (F12)

При нажатии кнопки "Save" должны появиться логи в таком порядке:

1. `🔧 SettingsSection handleSubmit called`
2. `📤 Emitting saveSettings event to parent component`
3. `🔧 ProjectDetailPrj saveSettings called`
4. `📤 About to call projectApi.update with:`
5. `📤 ProjectApi.update called:`
6. `📤 Final request data with client fields:`
7. `✅ ProjectApi.update response:`

### Шаг 2: Откройте Network tab в DevTools

Должен появиться запрос:
- **Method:** `PUT`
- **URL:** `/api/v1/projects/{id}`
- **Status:** `200` (успех) или другой код

### Шаг 3: Проверьте Request Payload

В Network tab → выберите запрос → вкладка "Payload" или "Request":

Должны быть поля:
```json
{
  "client_id": 27566,
  "client_type": "Pharmacies",
  "client_table": "pharma",
  "client_data": { ... }
}
```

---

## Возможные проблемы

### Проблема 1: Кнопка Save не работает

**Проверьте:**
- Есть ли `canEdit={true}` в SettingsSection?
- Не заблокирована ли кнопка (`disabled`)?

### Проблема 2: Событие не эмитится

**Проверьте логи:**
- Появляется ли `🔧 SettingsSection handleSubmit called`?
- Если нет - форма не отправляется

### Проблема 3: saveSettings не вызывается

**Проверьте:**
- Правильно ли привязан обработчик `@save-settings="saveSettings"`
- Появляется ли лог `🔧 ProjectDetailPrj saveSettings called`?

### Проблема 4: API не вызывается

**Проверьте:**
- Появляется ли лог `📤 ProjectApi.update called`?
- Есть ли запрос в Network tab?

---

## Если ничего не работает

1. **Проверьте консоль** - должны быть логи на каждом этапе
2. **Проверьте Network tab** - должен быть запрос `PUT /api/v1/projects/{id}`
3. **Проверьте, что вы в разделе Settings** - кнопка Save видна только там
4. **Проверьте права доступа** - `canEdit` должен быть `true`
