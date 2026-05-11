/** Detect PDF for in-app preview when MIME from API or Blob may be missing or generic. */
export function isLikelyPdfDocument(mimeType: string, displayFileName: string): boolean {
  const m = mimeType.trim().toLowerCase()
  if (m === 'application/pdf' || m.includes('pdf')) return true
  const n = displayFileName.trim().toLowerCase()
  return n.endsWith('.pdf')
}
