import axios from 'axios'
import { apiConfig } from '@/config/api'

// Создаем основной экземпляр axios для всего приложения
export const api = axios.create(apiConfig)

// Добавляем интерцепторы для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)

// Функция для получения токена авторизации
function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

// Добавляем интерцептор для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default api
