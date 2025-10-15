# Руководство по тестированию 2FA

## Обзор
Это руководство описывает, как протестировать функцию двухфакторной аутентификации (2FA) при входе в систему.

## Что было реализовано

### Основные компоненты
1. **LoginView.vue** - Главный компонент страницы входа
2. **LoginForm.vue** - Форма входа с обработкой логина
3. **TwoFactorDialog.vue** - Диалог 2FA с выбором метода доставки и вводом кода
4. **auth.ts store** - Store с методами login(), sendTwoFactorCode(), verifyTwoFactor()

### Новые функции
- ✅ Выбор метода доставки кода (SMS или Email)
- ✅ Отправка кода верификации через выбранный метод
- ✅ Ввод и проверка 6-значного кода
- ✅ **Таймер повторной отправки (60 секунд)** - новое!
- ✅ **Кнопка "Resend code" для повторной отправки** - новое!
- ✅ Обработка всех ошибок
- ✅ Инициализация сессии после успешной верификации

---

## Быстрый тест

### Тест 1: Вход без 2FA
```
1. Откройте страницу входа
2. Введите email и пароль пользователя с two_factor_enabled = false
3. Нажмите "Sign In"
✅ Ожидается: Мгновенный вход без диалога 2FA
```

### Тест 2: Вход с 2FA через SMS
```
1. Войдите с пользователем, у которого two_factor_enabled = true и есть номер телефона
2. Выберите "SMS" в диалоге 2FA
3. Нажмите "Send Code"
4. Введите полученный код
5. Нажмите "Verify Code"
✅ Ожидается: Успешный вход после верификации
```

### Тест 3: Вход с 2FA через Email
```
1. Войдите с пользователем, у которого two_factor_enabled = true
2. Выберите "Email" в диалоге 2FA
3. Нажмите "Send Code"
4. Проверьте email, введите код
5. Нажмите "Verify Code"
✅ Ожидается: Успешный вход после верификации
```

### Тест 4: Функция повторной отправки (НОВОЕ!)
```
1. Отправьте код (SMS или Email)
2. Посмотрите на таймер: "Resend code in 60s", "Resend code in 59s"...
3. Дождитесь окончания таймера
4. Нажмите "Resend code"
5. Введите новый код
✅ Ожидается: 
   - Таймер отсчитывает 60 секунд
   - Кнопка неактивна во время отсчета
   - После 0 появляется активная кнопка "Resend code"
   - Новый код отправляется успешно
   - Таймер запускается заново
```

---

## API Endpoints

### 1. Логин с проверкой 2FA
```
POST /api/v1/auth/login

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (2FA enabled):
{
  "status": "success",
  "data": {
    "user": { ... },
    "requires_2fa": true,
    "token": null
  }
}

Response (2FA disabled):
{
  "status": "success",
  "data": {
    "user": { ... },
    "requires_2fa": false,
    "token": "eyJ0eXAi..."
  }
}
```

### 2. Отправка кода верификации
```
POST /api/v1/2fa/send-code

Request:
{
  "email": "user@example.com",
  "delivery_method": "sms"  // или "email"
}

Response:
{
  "status": "success",
  "data": {
    "user_id": 1,
    "delivery_method": "sms",
    "contact_info": "+123456****",  // замаскированный номер
    "expires_at": "2025-08-31 14:19:46"
  }
}
```

### 3. Верификация кода
```
POST /api/v1/2fa/verify-code

Request:
{
  "user_id": 1,
  "code": "123456"
}

Response:
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "eyJ0eXAi...",
    "expires_at": "2025-08-31T15:10:10+02:00"
  }
}
```

---

## Логика работы

### Шаг 1: Логин
```typescript
const result = await authStore.login(email, password)

if (result.requires2FA) {
  // Показываем диалог 2FA
  // currentUser установлен, но isAuthenticated = false
  // Токен НЕ сохранен
} else {
  // Обычный логин
  // Токен сохранен, isAuthenticated = true
  // Перенаправление на dashboard
}
```

### Шаг 2: Отправка кода
```typescript
const result = await authStore.sendTwoFactorCode(email, 'sms')

if (result.success) {
  // Код отправлен
  // Показываем форму ввода кода
  // Запускаем таймер на 60 секунд
}
```

### Шаг 3: Верификация кода
```typescript
const result = await authStore.verifyTwoFactor(code)

if (result.success) {
  // Код верный
  // Сохраняем токен в localStorage
  // Устанавливаем isAuthenticated = true
  // Инициализируем session manager
  // Перенаправляем на dashboard
}
```

---

## Важные детали реализации

### При логине с 2FA:
- ✅ `currentUser` устанавливается (нужен для отправки кода)
- ✅ `isAuthenticated` остается `false` (пользователь еще не авторизован)
- ✅ Токен НЕ сохраняется (будет сохранен после верификации)
- ✅ Показывается диалог 2FA

### После успешной верификации:
- ✅ Токен сохраняется в `localStorage`
- ✅ Устанавливается заголовок `Authorization: Bearer ${token}`
- ✅ `isAuthenticated` становится `true`
- ✅ Данные пользователя обновляются
- ✅ Инициализируется session manager
- ✅ Пользователь перенаправляется на соответствующий dashboard

### Таймер повторной отправки:
- ✅ Запускается после отправки кода (60 секунд)
- ✅ Отображает обратный отсчет: "Resend code in Xs"
- ✅ Блокирует кнопку повторной отправки во время отсчета
- ✅ После окончания показывает активную кнопку "Resend code"
- ✅ При повторной отправке таймер запускается заново

---

## Тестовые данные

### Создать пользователя без 2FA:
```sql
UPDATE fw_users 
SET two_factor_enabled = false 
WHERE email = 'user1@example.com';
```

### Создать пользователя с 2FA и телефоном:
```sql
UPDATE fw_users 
SET two_factor_enabled = true, 
    phone = '+1234567890' 
WHERE email = 'user2@example.com';
```

### Создать пользователя с 2FA без телефона:
```sql
UPDATE fw_users 
SET two_factor_enabled = true, 
    phone = NULL 
WHERE email = 'user3@example.com';
```

---

## Проверка в консоли браузера

### Успешный логин без 2FA:
```
✅ Login successful for user: user@example.com
🔐 Token saved to localStorage
✅ Session is valid
```

### Логин с 2FA:
```
🔒 2FA required for user: user@example.com
⚠️ Token NOT saved - waiting for 2FA verification
```

### Отправка кода:
```
📤 Sending 2FA code via: sms
✅ Code sent successfully
```

### Верификация кода:
```
🔐 Verifying 2FA code
✅ 2FA verification successful - user authenticated
✅ Session is valid
```

---

## Известные сценарии ошибок

### 1. Неверный код
```
❌ 2FA verification failed: Invalid or expired verification code
```
**Решение:** Запросить новый код через "Resend code"

### 2. Истекший код (10 минут)
```
❌ 2FA verification failed: Invalid or expired verification code
```
**Решение:** Запросить новый код

### 3. Отсутствует номер телефона
```
❌ Failed to send code: Phone number not found for this user
```
**Решение:** Использовать метод Email или добавить номер телефона в профиле

### 4. Код уже использован
```
❌ 2FA verification failed: Code has already been used
```
**Решение:** Запросить новый код

---

## Чек-лист финального тестирования

- [ ] Вход без 2FA работает
- [ ] Вход с 2FA показывает диалог
- [ ] Отправка кода через SMS работает
- [ ] Отправка кода через Email работает
- [ ] Верификация правильного кода работает
- [ ] Неверный код показывает ошибку
- [ ] Таймер повторной отправки работает (60 секунд)
- [ ] Кнопка "Resend code" блокируется во время таймера
- [ ] Кнопка "Resend code" становится активной после таймера
- [ ] Повторная отправка кода работает
- [ ] После повторной отправки таймер запускается заново
- [ ] Истекший код не принимается
- [ ] Отмена диалога возвращает на страницу входа
- [ ] Кнопка "Back" возвращает к выбору метода доставки
- [ ] После успешной 2FA сохраняется токен
- [ ] После успешной 2FA инициализируется сессия
- [ ] Перенаправление на правильный dashboard по роли
- [ ] Мобильная версия работает корректно
- [ ] Работает во всех браузерах

---

## Команды для запуска

### Запустить dev сервер:
```bash
npm run dev
```

### Открыть приложение:
```
http://localhost:5173/login
```

### Проверить API:
```
Backend API: https://fwapi.medicalcontractor.ca
или
Backend API: http://localhost:8000 (если локальный)
```

---

## Дополнительные улучшения (выполнено)

✅ **Таймер повторной отправки** - Добавлен 60-секундный таймер
✅ **Функция Resend Code** - Добавлена возможность повторной отправки
✅ **Улучшенная обработка ошибок** - Все ошибки обрабатываются и показываются пользователю
✅ **Валидация кода** - Проверка на 6 цифр перед отправкой
✅ **Очистка состояния** - При открытии диалога все состояния сбрасываются
✅ **Keyboard support** - Enter для отправки формы
✅ **Loading states** - Индикаторы загрузки для всех действий

---

## Статус: Готово к тестированию! ✅

Все компоненты реализованы и готовы к тестированию. 
Сервер разработки запущен. Можно начинать тестирование.

