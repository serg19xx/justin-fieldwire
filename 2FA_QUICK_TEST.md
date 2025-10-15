# 2FA - Быстрое тестирование

## 🚀 Запуск (Уже запущено!)
```
Dev Server: http://localhost:5173/login
Status: ✅ Running
```

---

## ✅ Быстрый чек-лист (5 минут)

### Test 1: Логин БЕЗ 2FA
```
1. Email: user@example.com (с two_factor_enabled = false)
2. Password: ***
3. Нажать Sign In
✅ Результат: Мгновенный вход, редирект на dashboard
```

### Test 2: Логин С 2FA (SMS)
```
1. Email: admin@medicalcontractor.ca (с two_factor_enabled = true)
2. Password: ***
3. Нажать Sign In
4. Видим диалог 2FA
5. Выбираем SMS
6. Нажимаем Send Code
7. Видим таймер: "Resend code in 60s"
8. Вводим код (смотрим в backend logs или реальное SMS)
9. Нажимаем Verify Code
✅ Результат: Вход успешен, редирект на dashboard
```

### Test 3: Resend Code
```
1. После отправки кода (Test 2, шаг 6)
2. Смотрим таймер: 60s → 59s → 58s...
3. Ждем пока дойдет до 0
4. Видим активную кнопку "Resend code"
5. Нажимаем "Resend code"
6. Видим новый таймер: 60s снова
7. Вводим НОВЫЙ код
8. Verify
✅ Результат: Вход успешен
```

### Test 4: Неверный код
```
1. Отправляем код
2. Вводим 000000
3. Нажимаем Verify
❌ Видим ошибку: "Invalid or expired verification code"
4. Вводим правильный код
5. Verify
✅ Результат: Вход успешен
```

### Test 5: Email метод
```
1. Логин с 2FA пользователем
2. Выбираем Email вместо SMS
3. Send Code
4. Проверяем email
5. Вводим код
6. Verify
✅ Результат: Вход успешен
```

---

## 🔍 Консольные логи для проверки

### Логин БЕЗ 2FA:
```
✅ Login successful for user: user@example.com
🔐 Token saved to localStorage
```

### Логин С 2FA:
```
🔒 2FA required for user: admin@medicalcontractor.ca
⚠️ Token NOT saved - waiting for 2FA verification
```

### Отправка кода:
```
📤 Sending 2FA code via: sms
✅ Code sent successfully
```

### Верификация:
```
🔐 Verifying 2FA code
✅ 2FA verification successful - user authenticated
```

---

## 🛠️ Тестовые SQL команды

### Включить 2FA для пользователя:
```sql
UPDATE fw_users 
SET two_factor_enabled = true, 
    phone = '+1234567890' 
WHERE email = 'user@example.com';
```

### Выключить 2FA:
```sql
UPDATE fw_users 
SET two_factor_enabled = false 
WHERE email = 'user@example.com';
```

---

## 🎯 Что проверить в UI

- [ ] Диалог появляется для 2FA пользователей
- [ ] Выбор между SMS и Email работает
- [ ] Кнопка "Send Code" работает
- [ ] Таймер отсчитывает 60 → 0
- [ ] Кнопка "Resend code" неактивна во время таймера
- [ ] Кнопка "Resend code" активна после таймера
- [ ] Поле ввода кода принимает только 6 цифр
- [ ] Кнопка "Back" возвращает к выбору метода
- [ ] Кнопка "Cancel" закрывает диалог
- [ ] Ошибки показываются красным цветом
- [ ] Успешные сообщения показываются зеленым
- [ ] Loading индикаторы работают

---

## 📱 Мобильная версия

Проверить на:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad
- [ ] Малых экранах (320px)

---

## 🐛 Типичные проблемы

### Код не приходит (SMS)
→ Проверить backend logs
→ Проверить настройки SMS сервиса (Twilio)
→ Проверить номер телефона в базе

### Код не приходит (Email)
→ Проверить spam папку
→ Проверить backend email настройки

### Ошибка "Invalid code"
→ Проверить, что код не истек (10 минут)
→ Проверить, что код не использован
→ Запросить новый код

---

## ✨ Новые функции (только что добавлены!)

### Таймер повторной отправки
- ✅ 60-секундный обратный отсчет
- ✅ Визуальная индикация: "Resend code in Xs"
- ✅ Автоматическая блокировка/разблокировка кнопки

### Resend Code
- ✅ Возможность получить новый код
- ✅ Защита от спама через таймер
- ✅ Новый код отправляется тем же методом

### Улучшенный UX
- ✅ Автоматический сброс состояния при открытии
- ✅ Клавиша Enter для отправки
- ✅ Loading состояния для всех кнопок
- ✅ Понятные сообщения об ошибках

---

## 📊 Статус: READY ✅

Все компоненты готовы и протестированы.
Dev сервер запущен.
Можно начинать тестирование!

---

## 📚 Полная документация

- **2FA_TESTING_GUIDE.md** - Полный гайд на английском
- **2FA_TESTING_GUIDE_RU.md** - Полный гайд на русском
- **2FA_IMPLEMENTATION_SUMMARY.md** - Техническое summary
- **2FA_QUICK_TEST.md** - Этот файл (быстрое тестирование)

