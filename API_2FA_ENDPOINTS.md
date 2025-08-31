# 🔐 2FA API Endpoints (Frontend)

## Эндпоинты для фронтенда

### **1. POST /auth/enable-2fa**
**Включение 2FA для пользователя**

**Запрос:**
```http
POST http://localhost:8000/auth/enable-2fa
Content-Type: application/json
Authorization: Bearer <token>

{
  "phone": "+1234567890"
}
```

**Ответ (успех):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "2FA enabled successfully",
  "data": {
    "success": true,
    "message": "Verification code sent to your phone"
  }
}
```

---

### **2. POST /auth/verify-2fa**
**Проверка кода 2FA**

**Запрос:**
```http
POST http://localhost:8000/auth/verify-2fa
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "123456"
}
```

**Ответ (успех):**
```json
{
  "error_code": 0,
  "status": "success",
  "message": "2FA verification successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

## Frontend Integration

### **1. Включение 2FA**
```javascript
// В TwoFactorSetup.vue
const response = await api.post('/auth/enable-2fa', {
  phone: '+1234567890'
});
```

### **2. Проверка 2FA**
```javascript
// В TwoFactorDialog.vue
const response = await api.post('/auth/verify-2fa', {
  code: '123456'
});
```

### **3. Логин с 2FA**
```javascript
// В LoginView.vue
const result = await authStore.login(email, password);
if (result.requires2FA) {
  showTwoFactor.value = true; // Показать 2FA диалог
}
```

---

## Тестирование

### **Тестовые данные:**
- **Phone**: `+1234567890`
- **Code**: `123456`
- **Expiration**: 5 минут

### **Flow тестирования:**
1. Включить 2FA → получить SMS
2. Логин → показать 2FA диалог
3. Ввести код → получить токен
4. Перенаправить на dashboard

---

## Примечания

- **Twilio настраивается на бэкенде**
- **Фронтенд только отправляет запросы**
- **SMS отправляется автоматически**
- **Коды истекают через 5 минут**
