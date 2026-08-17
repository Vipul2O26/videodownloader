import { URL } from 'node:url'

const allowedHosts = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'soundcloud.com',
  'www.soundcloud.com',
  'example.com',
  'www.example.com'
])

const rateLimiter = new Map<string, number[]>()

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function validateUrl(rawUrl: string): { valid: boolean; normalizedUrl?: string; host?: string; message?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, message: 'A media URL is required.' }
  }

  const trimmed = rawUrl.trim()

  try {
    const parsed = new URL(trimmed)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, message: 'Only http and https URLs are supported.' }
    }

    const host = parsed.hostname.toLowerCase()
    const safeHost = host.replace(/^www\./, '')

    if (!allowedHosts.has(host) && !allowedHosts.has(safeHost)) {
      return {
        valid: false,
        message: `Domain validation failed for ${host}. Allowed hosts are restricted to supported media providers.`
      }
    }

    return {
      valid: true,
      normalizedUrl: parsed.toString(),
      host
    }
  } catch {
    return { valid: false, message: 'The provided URL is not a valid URL.' }
  }
}

export function assertSizeLimit(fileSizeBytes: number, byteLimit = 50 * 1024 * 1024) {
  if (fileSizeBytes > byteLimit) {
    throw new Error(`Downloaded media exceeds the allowed size limit of ${formatBytes(byteLimit)}.`)
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = 'Request timeout exceeded'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs)
    })
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })
}

export function enforceRateLimit(key: string, maxRequests = 25, windowMs = 60_000): boolean {
  const now = Date.now()
  const entries = rateLimiter.get(key) ?? []
  const recent = entries.filter((timestamp) => timestamp > now - windowMs)

  if (recent.length >= maxRequests) {
    return false
  }

  recent.push(now)
  rateLimiter.set(key, recent)
  return true
}

export async function safeFetch(input: string, init: RequestInit = {}) {
  return await withTimeout(
    fetch(input, {
      ...init,
      redirect: 'follow',
      headers: {
        Accept: '*/*',
        'User-Agent': 'VideoDownloader/1.0',
        ...(init.headers ?? {})
      }
    }),
    15_000,
    'The media request timed out while fetching remote content.'
  )
}
