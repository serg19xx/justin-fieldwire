import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Функция для тестирования эндпоинта
async function testEndpoint(method, endpoint, data = null) {
  try {
    console.log(`🧪 Testing ${method.toUpperCase()} ${endpoint}`)

    const response = await api.request({
      method,
      url: endpoint,
      data,
    })

    console.log(`✅ Success: ${method.toUpperCase()} ${endpoint}`)
    console.log(`�� Status: ${response.status}`)
    console.log(`📄 Response:`, response.data)
    console.log('─'.repeat(50))

    return { success: true, data: response.data, status: response.status }
  } catch (error) {
    console.log(`❌ Error: ${method.toUpperCase()} ${endpoint}`)
    console.log(`📊 Status: ${error.response?.status || 'No response'}`)
    console.log(`💬 Message: ${error.response?.data?.message || error.message}`)
    console.log('─'.repeat(50))

    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    }
  }
}

// Тестируем все эндпоинты
async function testAllEndpoints() {
  console.log('🚀 Starting API Endpoint Tests')
  console.log('='.repeat(50))

  const results = []

  // Health endpoints
  results.push(await testEndpoint('GET', '/api/v1/health'))
  results.push(await testEndpoint('GET', '/api/health'))

  // Version endpoint
  results.push(await testEndpoint('GET', '/api/v1/version'))

  // Database endpoints
  results.push(await testEndpoint('GET', '/api/v1/database/tables'))

  // Summary
  console.log('📋 Test Summary:')
  console.log('='.repeat(50))

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${results.length}`)

  // Show failed tests
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(
          `${index + 1}. Status: ${result.status}, Error: ${JSON.stringify(result.error)}`,
        )
      }
    })
  }

  return results
}

// Экспортируем функции для использования в других файлах
export { testEndpoint, testAllEndpoints, api }

// Если файл запускается напрямую, запускаем тесты
if (import.meta.url === `file://${process.argv[1]}`) {
  testAllEndpoints()
}
