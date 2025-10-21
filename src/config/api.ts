// Конфигурация API для разных окружений
interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  withCredentials: boolean
}

const environments = {
  development: {
    baseURL: import.meta.env.VITE_API_URL || '', // Use relative path for Vite proxy
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // Temporarily disabled for development due to CORS
  },
  staging: {
    baseURL: import.meta.env.VITE_API_URL || 'https://fwapi.medicalcontractor.ca',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // Temporarily disabled due to CORS issues
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://fwapi.medicalcontractor.ca',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // Temporarily disabled due to CORS issues
  },
}

// Определяем текущее окружение
const getCurrentEnvironment = (): keyof typeof environments => {
  if (typeof window === 'undefined') {
    return 'development'
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging'
  } else {
    return 'production'
  }
}

export const apiConfig: ApiConfig = environments[getCurrentEnvironment()]

if (typeof window !== 'undefined') {
  console.log(`🌍 API Environment: ${getCurrentEnvironment()}`)
  console.log(`🔗 API Base URL: ${apiConfig.baseURL}`)
}
