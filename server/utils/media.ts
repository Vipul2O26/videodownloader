import path from 'node:path'
import mime from 'mime-types'
import { fileTypeFromBuffer } from 'file-type'
import { validateUrl, assertSizeLimit, formatBytes, getHostname, safeFetch } from './security'
import { cleanupTemporaryFiles, writeTemporaryFile } from './storage'
import { mediaQueue } from './queue'

export type MediaDownloadResult = {
  status: 'queued' | 'downloaded'
  progress: number
  title: string
  host: string
  url: string
  fileType: string
  mimeType: string
  sizeBytes: number
  sizeLabel: string
  thumbnail: string | null
  fileName: string
  tempPath?: string
}

export function analyze_media(input: string) {
  const validation = validateUrl(input)

  if (!validation.valid) {
    throw new Error(validation.message ?? 'The URL is invalid.')
  }

  return {
    valid: true,
    url: validation.normalizedUrl,
    host: validation.host,
    type: 'direct-media',
    mode: 'download',
    hasThumbnail: true,
    status: 'ready'
  }
}

export async function get_media_info(url: string): Promise<MediaDownloadResult & { source: string }> {
  const validation = validateUrl(url)

  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.message ?? 'The URL is invalid.')
  }

  const host = validation.host ?? getHostname(validation.normalizedUrl) ?? 'unknown-host'
  const finalUrl = validation.normalizedUrl

  return {
    status: 'queued',
    progress: 0,
    title: 'Remote media asset',
    host,
    url: finalUrl,
    fileType: 'video',
    mimeType: 'application/octet-stream',
    sizeBytes: 0,
    sizeLabel: '0 B',
    thumbnail: `https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80`,
    fileName: `${host}-media.bin`,
    source: 'metadata-service'
  }
}

export async function download_authorized_media(url: string, options: { maxBytes?: number; title?: string } = {}) {
  const { maxBytes = 50 * 1024 * 1024, title = 'Remote media asset' } = options
  const validation = validateUrl(url)

  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.message ?? 'The URL is invalid.')
  }

  const response = await safeFetch(validation.normalizedUrl, {
    method: 'GET',
    headers: {
      Accept: '*/*'
    }
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch remote media; server responded with ${response.status}.`)
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
  const lengthHeader = response.headers.get('content-length')
  const buffer = Buffer.from(await response.arrayBuffer())

  if (lengthHeader) {
    const contentLength = Number(lengthHeader)
    if (Number.isFinite(contentLength)) {
      assertSizeLimit(contentLength, maxBytes)
    }
  }

  assertSizeLimit(buffer.byteLength, maxBytes)

  const detectedType = await fileTypeFromBuffer(buffer)
  const mimeType = detectedType?.mime ?? (mime.lookup(contentType) || contentType)
  const extFromMime = mime.extension(mimeType) || 'bin'
  const extFromPath = path.extname(new URL(validation.normalizedUrl).pathname || 'media.bin').replace(/^\./, '')
  const extension = detectedType?.ext ?? (extFromPath || extFromMime)

  const tempPath = await writeTemporaryFile(buffer, extension, 'download')
  await cleanupTemporaryFiles()

  const result: MediaDownloadResult = {
    status: 'downloaded',
    progress: 100,
    title,
    host: validation.host ?? 'unknown-host',
    url: validation.normalizedUrl,
    fileType: mimeType.split('/')[0] || 'media',
    mimeType,
    sizeBytes: buffer.byteLength,
    sizeLabel: formatBytes(buffer.byteLength),
    thumbnail: `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80`,
    fileName: path.basename(tempPath),
    tempPath
  }

  await mediaQueue.enqueue('download_authorized_media', result)

  return result
}

export async function direct_media_download(url: string, options: { maxBytes?: number; title?: string } = {}) {
  return await download_authorized_media(url, options)
}
