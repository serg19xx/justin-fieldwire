<template>
  <div class="bg-white shadow-sm rounded-lg overflow-hidden">
    <!-- Search and filters row -->
    <div class="p-3 sm:p-4 border-b border-gray-200">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
        <!-- Search input -->
        <div class="w-full sm:w-64">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <!-- Filters and actions -->
        <div class="flex flex-col sm:flex-row gap-2 sm:ml-auto">
          <!-- Default filters -->
          <select
            v-model="countryFilter"
            @change="handleCountryChange"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            <option v-for="country in countries" :key="country.code2" :value="country.code2">
              {{ country.name }}
            </option>
          </select>

          <select
            v-model="regionFilter"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            <option value="">All Regions</option>
            <option v-for="region in availableRegions" :key="region.code2" :value="region.code2">
              {{ region.name }}
            </option>
          </select>

          <slot name="filters">
            <!-- Additional custom filters will go here -->
          </slot>
          <slot name="table-actions">
            <!-- Custom table actions will go here -->
          </slot>
        </div>

        <!-- Bulk actions for selected items -->
        <div
          v-if="selectedItems.size > 0"
          class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-blue-700"> {{ selectedItems.size }} item(s) selected </span>
            <slot name="bulk-actions" :selected-items="Array.from(selectedItems)">
              <!-- Default bulk actions will go here -->
            </slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop table view -->
    <div class="hidden lg:block overflow-x-auto" @keydown="handleKeyDown" tabindex="0">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="selectedItems.size === paginatedData.length && paginatedData.length > 0"
                  :indeterminate="
                    selectedItems.size > 0 && selectedItems.size < paginatedData.length
                  "
                  @change="
                    selectedItems.size === paginatedData.length ? clearSelection() : selectAll()
                  "
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="text-xs text-gray-500">Select</span>
              </div>
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              @click="sortBy(column.key)"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              :class="{ 'cursor-pointer': column.sortable !== false }"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <svg
                  v-if="column.sortable !== false"
                  class="h-4 w-4 text-gray-400"
                  :class="{
                    'text-blue-500': sortKey === column.key,
                    'rotate-180': sortKey === column.key && sortOrder === 'desc',
                  }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(item, index) in paginatedData"
            :key="item.id || index"
            class="hover:bg-gray-50"
            :class="{ 'bg-blue-50': isSelected(item) }"
          >
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
              <input
                type="checkbox"
                :checked="isSelected(item)"
                @click="toggleSelection(item, $event)"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </td>
            <td v-for="column in columns" :key="column.key" class="px-4 py-3 text-sm text-gray-900">
              <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
                {{ item[column.key] }}
              </slot>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
              <slot name="row-actions" :item="item">
                <!-- Default row actions - empty by default -->
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile card view -->
    <div class="lg:hidden">
      <div class="p-3 space-y-3">
        <div
          v-for="(item, index) in paginatedData"
          :key="item.id || index"
          class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          :class="{ 'bg-blue-50 border-blue-200': isSelected(item) }"
        >
          <!-- Selection checkbox -->
          <div class="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              :checked="isSelected(item)"
              @click="toggleSelection(item, $event)"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <slot name="row-actions" :item="item">
              <!-- Default row actions - empty by default -->
            </slot>
          </div>

          <!-- Card content -->
          <div class="space-y-2">
            <div
              v-for="column in columns"
              :key="column.key"
              class="flex flex-col sm:flex-row sm:justify-between gap-1"
            >
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{
                column.label
              }}</span>
              <div class="text-sm text-gray-900 break-words">
                <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
                  {{ item[column.key] }}
                </slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination" class="bg-white px-3 py-3 border-t border-gray-200 sm:px-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Results info -->
        <div class="text-sm text-gray-700 text-center sm:text-left">
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalItems }} results
        </div>

        <!-- Pagination controls -->
        <div class="flex flex-col sm:flex-row items-center gap-3">
          <!-- Mobile: Row 1 - Rows per page -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">Rows:</span>
            <select
              v-model="localItemsPerPage"
              @change="handleItemsPerPageChange"
              class="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>

          <!-- Mobile: Row 2 - Navigation and Go to page combined -->
          <div class="flex items-center gap-2">
            <!-- Compact navigation -->
            <div class="flex items-center gap-1">
              <button
                @click="previousPage"
                :disabled="localCurrentPage === 1"
                class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span class="text-sm text-gray-700 px-1">
                {{ localCurrentPage }}/{{ totalPages }}
              </span>
              <button
                @click="nextPage"
                :disabled="localCurrentPage === totalPages"
                class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <!-- Go to page -->
            <div class="flex items-center gap-1">
              <input
                v-model="pageInput"
                @keydown="handlePageInputKeydown"
                @input="handlePageInput"
                type="text"
                placeholder="Page"
                class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                @click="() => goToPage(parseInt(pageInput) || 1)"
                class="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { geographyApi, type Country } from '@/utils/contacts-api'

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface DataItem {
  id?: string | number
  [key: string]: unknown
}

interface Props {
  data: DataItem[]
  columns: Column[]
  itemsPerPage?: number
  searchable?: boolean
  showPagination?: boolean
  totalItems?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  searchable: true,
  showPagination: true,
  totalItems: undefined,
  currentPage: undefined,
})

// State
const localCurrentPage = ref(1)
const localItemsPerPage = ref(props.itemsPerPage)
const searchQuery = ref('')
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const selectedItems = ref<Set<DataItem>>(new Set())
const lastSelectedIndex = ref<number>(-1)
const pageInput = ref('')
const countryFilter = ref('')
const regionFilter = ref('')
const countries = ref<Country[]>([])
const loadingGeography = ref(false)

// Computed
const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.data
  }

  const query = searchQuery.value.toLowerCase()
  return props.data.filter((item) =>
    Object.values(item).some((value) => String(value).toLowerCase().includes(query)),
  )
})

const sortedData = computed(() => {
  if (!sortKey.value) {
    return filteredData.value
  }

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortKey.value] as string | number
    const bVal = b[sortKey.value] as string | number

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const totalItems = computed(() =>
  props.totalItems !== undefined ? props.totalItems : sortedData.value.length,
)
const totalPages = computed(() => Math.ceil(totalItems.value / localItemsPerPage.value))

const startIndex = computed(() => (localCurrentPage.value - 1) * localItemsPerPage.value)
const endIndex = computed(() =>
  Math.min(startIndex.value + localItemsPerPage.value, totalItems.value),
)

const paginatedData = computed(() => {
  if (props.totalItems !== undefined) {
    // API mode: return data as is
    return sortedData.value
  } else {
    // Local mode: slice data
    return sortedData.value.slice(startIndex.value, endIndex.value)
  }
})

// Computed regions for selected country
const availableRegions = computed(() => {
  if (!countryFilter.value || countries.value.length === 0) return []
  const selectedCountry = countries.value.find((country) => country.code2 === countryFilter.value)
  return selectedCountry ? selectedCountry.regions : []
})

// Emits
const emit = defineEmits<{
  'page-change': [page: number]
  'items-per-page-change': [items: number]
  'filter-change': [filters: { country: string; region: string }]
  'geography-loaded': [firstCountry: { code: string; name: string }]
}>()

// Methods
function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  localCurrentPage.value = 1
  pageInput.value = ''
}

function nextPage() {
  if (localCurrentPage.value < totalPages.value) {
    localCurrentPage.value++
    if (props.totalItems !== undefined) {
      emit('page-change', localCurrentPage.value)
    }
  }
}

function previousPage() {
  if (localCurrentPage.value > 1) {
    localCurrentPage.value--
    if (props.totalItems !== undefined) {
      emit('page-change', localCurrentPage.value)
    }
  }
}

function goToPage(page: number) {
  const targetPage = Math.max(1, Math.min(page, totalPages.value))
  if (targetPage !== localCurrentPage.value) {
    localCurrentPage.value = targetPage
    if (props.totalItems !== undefined) {
      emit('page-change', localCurrentPage.value)
    }
  }
  pageInput.value = ''
}

function handlePageInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    const page = parseInt(pageInput.value)
    if (!isNaN(page)) {
      goToPage(page)
    }
  }
}

function handlePageInput(event: Event) {
  const target = event.target as HTMLInputElement
  // Remove any non-digit characters
  target.value = target.value.replace(/\D/g, '')
  pageInput.value = target.value
}

function handleItemsPerPageChange() {
  const newItemsPerPage = localItemsPerPage.value
  if (newItemsPerPage !== props.itemsPerPage) {
    emit('items-per-page-change', newItemsPerPage)
    // Reset to first page when changing items per page
    localCurrentPage.value = 1
    pageInput.value = ''
  }
}

// Selection methods
function toggleSelection(item: DataItem, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd + click: toggle single item
    if (selectedItems.value.has(item)) {
      selectedItems.value.delete(item)
    } else {
      selectedItems.value.add(item)
    }
  } else if (event.shiftKey && lastSelectedIndex.value !== -1) {
    // Shift + click: select range
    const currentIndex = paginatedData.value.findIndex((i) => i === item)
    const start = Math.min(lastSelectedIndex.value, currentIndex)
    const end = Math.max(lastSelectedIndex.value, currentIndex)

    for (let i = start; i <= end; i++) {
      selectedItems.value.add(paginatedData.value[i])
    }
  } else {
    // Single click: select only this item
    selectedItems.value.clear()
    selectedItems.value.add(item)
  }

  lastSelectedIndex.value = paginatedData.value.findIndex((i) => i === item)
}

// Keyboard shortcuts for selection
function handleKeyDown(event: KeyboardEvent) {
  // Ctrl/Cmd + A: select all
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault()
    selectAll()
  }
}

function selectAll() {
  paginatedData.value.forEach((item) => selectedItems.value.add(item))
}

function clearSelection() {
  selectedItems.value.clear()
  lastSelectedIndex.value = -1
}

function isSelected(item: DataItem): boolean {
  return selectedItems.value.has(item)
}

// Reset to first page when search changes
watch(searchQuery, () => {
  // Reset to first page when search changes
  localCurrentPage.value = 1
  pageInput.value = ''
})

// Watch for itemsPerPage changes
watch(
  () => props.itemsPerPage,
  (newValue) => {
    if (props.totalItems !== undefined) {
      emit('items-per-page-change', newValue)
    }
  },
)

// Watch for currentPage prop changes
watch(
  () => props.currentPage,
  (newValue) => {
    if (newValue !== undefined && newValue !== localCurrentPage.value) {
      localCurrentPage.value = newValue
    }
  },
  { immediate: true },
)

// Watch for itemsPerPage prop changes
watch(
  () => props.itemsPerPage,
  (newValue) => {
    if (newValue !== undefined && newValue !== localItemsPerPage.value) {
      localItemsPerPage.value = newValue
    }
  },
  { immediate: true },
)

// Watch for filter changes
watch([countryFilter, regionFilter], (newValues, oldValues) => {
  console.log('🔍 Filter watch triggered:', { newValues, oldValues })

  // Skip initial trigger when countryFilter is set programmatically
  if (oldValues && oldValues[0] === '' && newValues[0] !== '') {
    console.log('⏭️ Skipping initial trigger')
    return
  }

  // Get country and region names instead of codes
  const selectedCountry = countries.value.find((country) => country.code2 === countryFilter.value)
  const selectedRegion = availableRegions.value.find(
    (region) => region.code2 === regionFilter.value,
  )

  // Only send region if it's selected (not "All Regions")
  const regionToSend = regionFilter.value ? (selectedRegion ? selectedRegion.name : '') : ''

  console.log('📤 Emitting filter change:', {
    country: selectedCountry ? selectedCountry.name : '',
    region: regionToSend,
    countryFilter: countryFilter.value,
    regionFilter: regionFilter.value,
  })

  emit('filter-change', {
    country: selectedCountry ? selectedCountry.name : '',
    region: regionToSend,
  })
})

// Handle country change - reset region filter
function handleCountryChange() {
  console.log('🌍 Country changed to:', countryFilter.value)
  regionFilter.value = ''
  console.log('🔄 Region reset to:', regionFilter.value)

  // Get country name instead of code
  const selectedCountry = countries.value.find((country) => country.code2 === countryFilter.value)

  // When country changes, only send country (region is reset to "All Regions")
  const countryName = selectedCountry ? selectedCountry.name : ''
  console.log('📤 Emitting country change:', { country: countryName, region: '' })

  emit('filter-change', {
    country: countryName,
    region: '',
  })
}

// Load geography data
async function loadGeography() {
  if (countries.value.length > 0) return // Already loaded

  loadingGeography.value = true
  try {
    const response = await geographyApi.getCountriesAndRegions()
    countries.value = response.data.countries

    // Set default country to first one in the list
    if (countries.value.length > 0) {
      countryFilter.value = countries.value[0].code2
      console.log(
        '✅ Default country set to:',
        countries.value[0].name,
        'with code:',
        countries.value[0].code2,
      )
      console.log('🔍 Available regions for default country:', countries.value[0].regions)

      // Emit geography loaded event with first country
      emit('geography-loaded', {
        code: countries.value[0].code2,
        name: countries.value[0].name,
      })
    }

    console.log('✅ Geography loaded:', countries.value.length, 'countries')
  } catch (error) {
    console.error('❌ Failed to load geography:', error)
  } finally {
    loadingGeography.value = false
  }
}

// Load geography on mount
onMounted(() => {
  loadGeography()
})
</script>
