// Test API configuration
import { apiConfig } from './src/config/api.js'

console.log('API Configuration:')
console.log('Base URL:', apiConfig.baseURL)
console.log('Environment:', process.env.NODE_ENV)
console.log('VITE_API_URL:', process.env.VITE_API_URL)
