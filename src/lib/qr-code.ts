export interface QrPngAsset {
  dataUrl: string
  file: File
}

export type QrShareResult = 'shared' | 'cancelled' | 'unsupported'

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, encoded = ''] = dataUrl.split(',', 2)
  const mimeType = /data:([^;]+)/.exec(header)?.[1] ?? 'image/png'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], fileName, { type: mimeType })
}

export function qrPngFileName(slug: string): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `cardly-${safeSlug || 'card'}-qr.png`
}

export async function createQrPngAsset(
  source: SVGSVGElement,
  fileName: string,
  size = 1024,
): Promise<QrPngAsset> {
  const svg = source.cloneNode(true) as SVGSVGElement
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  const markup = new XMLSerializer().serializeToString(svg)
  const image = new Image()
  image.decoding = 'async'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Could not render the QR image'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  context.drawImage(image, 0, 0, size, size)
  const dataUrl = canvas.toDataURL('image/png')
  if (!dataUrl.startsWith('data:image/png')) throw new Error('Could not encode the QR image')
  return { dataUrl, file: dataUrlToFile(dataUrl, fileName) }
}

export function downloadQrPng(asset: QrPngAsset): void {
  const link = document.createElement('a')
  link.href = asset.dataUrl
  link.download = asset.file.name
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
}

export async function shareQrPng(
  asset: QrPngAsset,
  details: Pick<ShareData, 'title' | 'text'>,
): Promise<QrShareResult> {
  if (typeof navigator.share !== 'function') return 'unsupported'
  const data: ShareData = { ...details, files: [asset.file] }
  if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) return 'unsupported'
  try {
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    return (error as { name?: string }).name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}
