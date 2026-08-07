/**
 * Read device GPS for worker check-in (schedule slots and task field work).
 */
export function readDevicePosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        reject(
          new Error(
            err.message || 'Could not read location. Allow location access and try again.',
          ),
        )
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  })
}
