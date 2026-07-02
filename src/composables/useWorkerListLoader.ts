import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { debounce } from '@/core/utils/debounce'
import { hrResourcesApi, type WorkerUser } from '@/core/utils/hr-api'

export interface WorkerListPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  has_next_page: boolean
  has_prev_page: boolean
}

function emptyPagination(perPage: number): WorkerListPagination {
  return {
    current_page: 1,
    per_page: perPage,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
    has_next_page: false,
    has_prev_page: false,
  }
}

function dedupeWorkersById(workers: WorkerUser[]): WorkerUser[] {
  const byId = new Map<number, WorkerUser>()
  for (const worker of workers) {
    if (!byId.has(worker.id)) {
      byId.set(worker.id, worker)
    }
  }
  return Array.from(byId.values())
}

export function useWorkerListLoader(
  initialViewMode: 'registered' | 'pending' = 'registered',
  initialItemsPerPage = 10,
  projectId?: MaybeRefOrGetter<number | null | undefined>,
) {
  const builders = ref<WorkerUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const userTypeFilter = ref('')
  const statusFilter = ref('')
  const invitationStatusFilter = ref('')
  const viewMode = ref<'registered' | 'pending'>(initialViewMode)
  const currentPage = ref(1)
  const itemsPerPage = ref(initialItemsPerPage)
  const pageSizeOptions = [10, 25, 50, 100] as const
  const pagination = ref<WorkerListPagination>(emptyPagination(initialItemsPerPage))

  let loadSeq = 0

  function buildApiFilters(): Parameters<typeof hrResourcesApi.getAllWorkerUsers>[2] {
    const filters: Parameters<typeof hrResourcesApi.getAllWorkerUsers>[2] = {
      sort_by: 'created_at',
      sort_order: 'DESC',
      fields: 'list',
    }
    if (statusFilter.value) filters.status = statusFilter.value
    if (invitationStatusFilter.value) {
      filters.invitation_status = invitationStatusFilter.value
    } else {
      filters.view_mode = viewMode.value
    }
    if (userTypeFilter.value) filters.role_code = userTypeFilter.value
    const q = searchQuery.value.trim()
    if (q) filters.search = q
    const scopedProjectId = projectId != null ? toValue(projectId) : undefined
    if (scopedProjectId != null && scopedProjectId > 0) {
      filters.project_id = scopedProjectId
    }
    return filters
  }

  async function loadBuilders(): Promise<void> {
    const seq = ++loadSeq
    loading.value = true
    error.value = null
    try {
      const { workers, pagination: p } = await hrResourcesApi.getAllWorkerUsers(
        currentPage.value,
        itemsPerPage.value,
        buildApiFilters(),
      )
      if (seq !== loadSeq) return
      builders.value = dedupeWorkersById(workers)
      pagination.value = {
        current_page: p.current_page,
        per_page: p.per_page,
        total: p.total,
        last_page: Math.max(1, p.last_page),
        from: p.from,
        to: p.to,
        has_next_page: p.has_next_page,
        has_prev_page: p.has_prev_page,
      }
    } catch {
      if (seq !== loadSeq) return
      error.value = 'Failed to load data from database'
      builders.value = []
      pagination.value = emptyPagination(itemsPerPage.value)
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  }

  const reloadFiltersDebounced = debounce(() => {
    currentPage.value = 1
    void loadBuilders()
  }, 350)

  watch([searchQuery, userTypeFilter, statusFilter, invitationStatusFilter, viewMode], () => {
    reloadFiltersDebounced()
  })

  watch([currentPage, itemsPerPage], () => {
    void loadBuilders()
  })

  if (projectId != null) {
    watch(
      () => toValue(projectId),
      () => {
        currentPage.value = 1
        void loadBuilders()
      },
    )
  }

  const totalItems = computed(() => pagination.value.total)
  const totalPages = computed(() => pagination.value.last_page)
  const startIndex = computed(() =>
    pagination.value.total > 0 ? Math.max(0, pagination.value.from - 1) : 0,
  )
  const endIndex = computed(() => pagination.value.to)

  const paginatedBuilders = computed(() => builders.value)

  function goToPage(page: number): void {
    if (page >= 1 && page <= pagination.value.last_page) {
      currentPage.value = page
    }
  }

  function changePageSize(newSize: number): void {
    itemsPerPage.value = newSize
    currentPage.value = 1
  }

  return {
    builders,
    loading,
    error,
    searchQuery,
    userTypeFilter,
    statusFilter,
    invitationStatusFilter,
    viewMode,
    currentPage,
    itemsPerPage,
    pageSizeOptions,
    pagination,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedBuilders,
    loadBuilders,
    goToPage,
    changePageSize,
  }
}
