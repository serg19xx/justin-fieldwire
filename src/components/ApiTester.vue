<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { apiConfig } from '@/config/api'

// Типы для результатов тестирования
interface TestResult {
  success: boolean
  method: string
  endpoint: string
  status: number | string
  data?: unknown
  error?: unknown
  timestamp: string
}

const testResults = ref<TestResult[]>([])
const isLoading = ref(false)
const error = ref('')

// Безопасное получение hostname
const currentHostname = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.hostname
  }
  return 'localhost'
})

const isDevelopment = computed(() => {
  return currentHostname.value === 'localhost' || currentHostname.value === '127.0.0.1'
})

// Создаем экземпляр axios с конфигурацией
const api = axios.create(apiConfig)

// Тестируем отдельный эндпоинт
async function testEndpoint(method: string, endpoint: string, data: unknown = null): Promise<TestResult> {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data
    })

    return {
      success: true,
      method,
      endpoint,
      status: response.status,
      data: response.data,
      timestamp: new Date().toLocaleTimeString()
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
    return {
      success: false,
      method,
      endpoint,
      status: axiosError.response?.status || 'No response',
      error: axiosError.response?.data?.message || axiosError.message,
      timestamp: new Date().toLocaleTimeString()
    }
  }
}

// Тестируем все эндпоинты
async function runAllTests() {
  isLoading.value = true
  error.value = ''
  testResults.value = []

  try {
    const endpoints = [
      { method: 'GET', path: '/api/v1/health' },
      { method: 'GET', path: '/api/v1/version' },
      { method: 'GET', path: '/api/v1/database/tables' }
    ]

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.method, endpoint.path)
      testResults.value.push(result)
    }
  } catch (err: unknown) {
    const errorObj = err as { message?: string }
    error.value = errorObj.message || 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

// Тестируем отдельный эндпоинт
async function testSingleEndpoint() {
  const method = selectedMethod.value
  const endpoint = selectedEndpoint.value

  if (!endpoint) {
    error.value = 'Please enter an endpoint'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await testEndpoint(method, endpoint)
    testResults.value.unshift(result)
  } catch (err: unknown) {
    const errorObj = err as { message?: string }
    error.value = errorObj.message || 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

const selectedMethod = ref('GET')
const selectedEndpoint = ref('')

onMounted(() => {
  runAllTests()
})
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">API Endpoint Tester</h1>
      <div class="flex items-center space-x-4">
        <p class="text-gray-600">Testing endpoints on {{ apiConfig.baseURL }}</p>
        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
          {{ isDevelopment ? 'Development' : 'Production' }}
        </span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Manual Test Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Manual Test</h2>
      <div class="flex space-x-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">Method</label>
          <select v-model="selectedMethod" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
          <input
            v-model="selectedEndpoint"
            type="text"
            placeholder="/api/v1/health"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          @click="testSingleEndpoint"
          :disabled="isLoading"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Testing...' : 'Test' }}
        </button>
      </div>
    </div>

    <!-- Test Results -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">Test Results</h2>
          <button
            @click="runAllTests"
            :disabled="isLoading"
            class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Running Tests...' : 'Run All Tests' }}
          </button>
        </div>
      </div>

      <div class="divide-y divide-gray-200">
        <div
          v-for="(result, index) in testResults"
          :key="index"
          class="p-6"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div
                :class="[
                  'w-3 h-3 rounded-full',
                  result.success ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
              <div>
                <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {{ result.method }} {{ result.endpoint }}
                </span>
                <span class="ml-2 text-sm text-gray-500">{{ result.timestamp }}</span>
              </div>
            </div>
            <div class="text-right">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  result.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                ]"
              >
                {{ result.status }}
              </span>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-sm text-gray-800 overflow-x-auto">{{ JSON.stringify(result.success ? result.data : result.error, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div v-if="testResults.length === 0 && !isLoading" class="p-6 text-center text-gray-500">
        No test results yet. Click "Run All Tests" to start testing.
      </div>
    </div>
  </div>
</template>
