/**
 * Client-only helper: downscale large camera screenshots before Server Actions POST.
 * Returns the original string if not an image data URL or if canvas is unavailable.
 */
export async function msc_compressDataUrlImage(dataUrl: string, maxEdge = 1280, jpegQuality = 0.85): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl.startsWith('data:image/')) {
    return dataUrl
  }
  if (dataUrl.length < 500_000) {
    return dataUrl
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const scale = Math.min(1, maxEdge / Math.max(w, h))
        const tw = Math.max(1, Math.round(w * scale))
        const th = Math.max(1, Math.round(h * scale))
        const canvas = document.createElement('canvas')
        canvas.width = tw
        canvas.height = th
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        ctx.drawImage(img, 0, 0, tw, th)
        const out = canvas.toDataURL('image/jpeg', jpegQuality)
        resolve(out.length < dataUrl.length ? out : dataUrl)
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
