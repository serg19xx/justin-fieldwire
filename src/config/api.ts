// API: local dev → localhost:8000 (backend on your machine, remote DB). Production → fwapi on hosting.
interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  withCredentials: boolean
}

export const LOCAL_API_URL = 'http://localhost:8000'
export const REMOTE_API_URL = 'https://fwapi.medicalcontractor.ca'

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return import.meta.env.PROD ? REMOTE_API_URL : LOCAL_API_URL
}

const environments = {
  development: {
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  },
  staging: {
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  },
  production: {
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  },
}

const getCurrentEnvironment = (): keyof typeof environments => {
  if (typeof window === 'undefined') {
    return 'development'
  }

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  }
  if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging'
  }
  return 'production'
}

export const apiConfig: ApiConfig = environments[getCurrentEnvironment()]

if (typeof window !== 'undefined') {
  console.log(`🌍 API Environment: ${getCurrentEnvironment()}`)
  console.log(`🔗 API Base URL: ${apiConfig.baseURL}`)
}
