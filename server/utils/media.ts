import path from 'node:path'
import mime from 'mime-types'
import ytdl from '@distube/ytdl-core'
import { fileTypeFromBuffer } from 'file-type'
import { validateUrl, assertSizeLimit, formatBytes, getHostname, safeFetch } from './security'
import { cleanupTemporaryFiles, writeTemporaryFile } from './storage'
import { mediaQueue } from './queue'

export type PreferredFormat = 'auto' | 'mp4' | 'mp3'

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
  previewUrl?: string | null
}

type ResolvedMediaSource = {
  resolvedUrl: string
  title: string
  host: string
  previewUrl?: string | null
  fileType?: 'audio' | 'video'
  mimeType?: string
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function normalizeMediaUrl(candidate: string, baseUrl: string) {
  const cleaned = candidate.replace(/\\/g, '').replace(/&amp;/g, '&')

  try {
    const url = new URL(cleaned, baseUrl)
    if (['http:', 'https:'].includes(url.protocol)) {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

function findMediaCandidates(html: string, baseUrl: string) {
  const candidates = new Set<string>()
  const patterns = [
    /(?:property|name)=["']og:video(?:\s*:url)?["'][^>]*content=["']([^"']+)["']/gi,
    /(?:property|name)=["']twitter:player:stream["'][^>]*content=["']([^"']+)["']/gi,
    /(?:property|name)=["']twitter:player["'][^>]*content=["']([^"']+)["']/gi,
    /<video[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<source[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /(?:src|data-src|data-url)=["']([^"']+\.(?:mp4|webm|m4v|m3u8|mpd)(?:\?[^"']*)?)["']/gi,
    /"(?:url|src|stream)"\s*:\s*"([^"']+)"/gi
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(html)) !== null) {
      const normalized = normalizeMediaUrl(match[1], baseUrl)
      if (normalized) {
        candidates.add(normalized)
      }
    }
  }

  return [...candidates]
}

function findMetaTitle(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeURIComponent(escapeHtml(match[1]).replace(/&amp;/g, '&').replace(/&quot;/g, '"'))
    }
  }

  return 'Remote media asset'
}

function looksLikeMediaUrl(url: string) {
  return /\.(mp4|m4a|m4v|mp3|webm|ogg|aac|wav|m3u8|mpd)(\?.*)?$/i.test(url)
}

async function resolveYouTubeSource(url: string, preferredFormat: PreferredFormat): Promise<ResolvedMediaSource> {
  const info = await ytdl.getInfo(url)
  const title = info.videoDetails?.title || 'YouTube media'

  const chosenFormat = preferredFormat === 'mp3'
    ? ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
    : ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' }) || ytdl.chooseFormat(info.formats, { quality: 'highest' })

  if (!chosenFormat?.url) {
    throw new Error('No playable stream could be resolved from this YouTube URL.')
  }

  return {
    resolvedUrl: chosenFormat.url,
    title,
    host: 'youtube.com',
    previewUrl: chosenFormat.url,
    fileType: preferredFormat === 'mp3' ? 'audio' : 'video',
    mimeType: preferredFormat === 'mp3' ? 'audio/mpeg' : (chosenFormat.mimeType || 'video/mp4')
  }
}

async function resolveVimeoSource(url: string, preferredFormat: PreferredFormat): Promise<ResolvedMediaSource> {
  const videoIdMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)
  if (!videoIdMatch?.[1]) {
    throw new Error('Unable to resolve a Vimeo video ID from the provided URL.')
  }

  const response = await safeFetch(`https://player.vimeo.com/video/${videoIdMatch[1]}/config`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*'
    }
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch Vimeo metadata; server responded with ${response.status}.`)
  }

  const payload = await response.json() as any
  const files = payload?.request?.files ?? {}
  const progressive = Array.isArray(files.progressive) ? files.progressive : []
  const audioFiles = Array.isArray(files.audio) ? files.audio : []
  const bestVideo = [...progressive].sort((a, b) => Number(b.quality?.replace(/\D/g, '')) - Number(a.quality?.replace(/\D/g, '')))[0]
  const bestAudio = [...audioFiles].sort((a, b) => Number(b.quality?.replace(/\D/g, '')) - Number(a.quality?.replace(/\D/g, '')))[0]

  const selected = preferredFormat === 'mp3' ? bestAudio ?? bestVideo : bestVideo ?? bestAudio
  if (!selected?.url) {
    throw new Error('No Vimeo stream URL is available for the requested format.')
  }

  return {
    resolvedUrl: selected.url,
    title: payload?.video?.title || 'Vimeo media',
    host: 'vimeo.com',
    previewUrl: selected.url,
    fileType: preferredFormat === 'mp3' || selected?.type === 'audio' ? 'audio' : 'video',
    mimeType: selected.type || (preferredFormat === 'mp3' ? 'audio/mpeg' : 'video/mp4')
  }
}

async function resolveMediaSource(url: string, preferredFormat: PreferredFormat = 'auto'): Promise<ResolvedMediaSource> {
  const validation = validateUrl(url)

  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.message ?? 'The URL is invalid.')
  }

  const normalizedUrl = validation.normalizedUrl
  const host = validation.host ?? getHostname(normalizedUrl) ?? 'unknown-host'
  const lowerHost = host.toLowerCase()

  if (lowerHost === 'youtube.com' || lowerHost.endsWith('.youtube.com') || lowerHost === 'youtu.be') {
    return await resolveYouTubeSource(normalizedUrl, preferredFormat)
  }

  if (lowerHost === 'vimeo.com' || lowerHost.endsWith('.vimeo.com')) {
    return await resolveVimeoSource(normalizedUrl, preferredFormat)
  }

  const pageResponse = await safeFetch(normalizedUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })

  if (!pageResponse.ok) {
    return {
      resolvedUrl: normalizedUrl,
      title: 'Remote media asset',
      host,
      previewUrl: normalizedUrl,
      fileType: 'video',
      mimeType: 'application/octet-stream'
    }
  }

  const html = await pageResponse.text()
  const title = findMetaTitle(html) || 'Remote media asset'
  const candidates = findMediaCandidates(html, normalizedUrl)
  const previewUrl = candidates.find((candidate) => looksLikeMediaUrl(candidate)) ?? normalizedUrl

  return {
    resolvedUrl: previewUrl,
    title,
    host,
    previewUrl,
    fileType: looksLikeMediaUrl(previewUrl) && /\.(mp3|m4a|aac|wav|ogg)$/i.test(previewUrl) ? 'audio' : 'video',
    mimeType: mime.lookup(previewUrl) || 'application/octet-stream'
  }
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
  const source = await resolveMediaSource(validation.normalizedUrl, 'auto')

  return {
    status: 'queued',
    progress: 0,
    title: source.title,
    host,
    url: source.resolvedUrl,
    fileType: source.fileType ?? 'video',
    mimeType: source.mimeType ?? 'application/octet-stream',
    sizeBytes: 0,
    sizeLabel: '0 B',
    thumbnail: `https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80`,
    fileName: `${host}-media.${source.fileType === 'audio' ? 'mp3' : 'mp4'}`,
    previewUrl: source.previewUrl,
    source: 'metadata-service'
  }
}

export async function download_authorized_media(url: string, options: { maxBytes?: number; title?: string; format?: PreferredFormat } = {}) {
  const { maxBytes = 50 * 1024 * 1024, title = 'Remote media asset', format = 'auto' } = options
  const validation = validateUrl(url)

  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.message ?? 'The URL is invalid.')
  }

  const source = await resolveMediaSource(validation.normalizedUrl, format)
  const mediaUrl = source.resolvedUrl
  const response = await safeFetch(mediaUrl, {
    method: 'GET',
    headers: {
      Accept: '*/*'
    }
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch remote media; server responded with ${response.status}.`)
  }

  const contentType = response.headers.get('content-type') ?? source.mimeType ?? 'application/octet-stream'
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
  const extFromPath = path.extname(new URL(mediaUrl).pathname || 'media.bin').replace(/^\./, '')

  let extension = detectedType?.ext ?? (extFromPath || extFromMime)

  if (format === 'mp3' && mimeType.startsWith('video/')) {
    extension = 'mp3'
  }

  if (format === 'mp4' && mimeType.startsWith('audio/')) {
    extension = 'mp4'
  }

  const tempPath = await writeTemporaryFile(buffer, extension, 'download')
  await cleanupTemporaryFiles()

  const result: MediaDownloadResult = {
    status: 'downloaded',
    progress: 100,
    title: title || source.title,
    host: validation.host ?? 'unknown-host',
    url: mediaUrl,
    fileType: source.fileType ?? (mimeType.split('/')[0] || 'media'),
    mimeType,
    sizeBytes: buffer.byteLength,
    sizeLabel: formatBytes(buffer.byteLength),
    thumbnail: `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80`,
    fileName: path.basename(tempPath),
    tempPath,
    previewUrl: source.previewUrl
  }

  await mediaQueue.enqueue('download_authorized_media', result)

  return result
}

export async function direct_media_download(url: string, options: { maxBytes?: number; title?: string; format?: PreferredFormat } = {}) {
  return await download_authorized_media(url, options)
}
