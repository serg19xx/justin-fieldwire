import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FieldScheduleByDate, VisitSlotPart } from '@/core/types/field-schedule'
import { fetchMyFieldSchedule, persistFieldScheduleSlot } from '@/core/utils/field-schedule-api'

export const useFieldScheduleStore = defineStore('fieldSchedule', () => {
  const rangeFrom = ref('')
  const rangeTo = ref('')
  const assignments = ref<FieldScheduleByDate>({})
  const isLoading = ref(false)

  async function loadWeek(userId: number, fromYmd: string, toYmd: string) {
    isLoading.value = true
    try {
      rangeFrom.value = fromYmd
      rangeTo.value = toYmd
      assignments.value = await fetchMyFieldSchedule(userId, fromYmd, toYmd)
    } finally {
      isLoading.value = false
    }
  }

  async function setSlot(
    userId: number,
    dateYmd: string,
    part: VisitSlotPart,
    projectId: number | null,
  ) {
    await persistFieldScheduleSlot(userId, dateYmd, part, projectId)
    const from = rangeFrom.value || dateYmd
    const to = rangeTo.value || dateYmd
    assignments.value = await fetchMyFieldSchedule(userId, from, to)
  }

  return { rangeFrom, rangeTo, assignments, isLoading, loadWeek, setSlot }
})
