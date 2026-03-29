/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  wait: number,
): (...args: TArgs) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: TArgs) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}
