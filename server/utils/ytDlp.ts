import { spawn } from 'node:child_process'
import { access, mkdir, stat, unlink } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { validateUrl } from './security'

export type AppErrorCode =
  | 'INVALID_URL'
  | 'YTDLP_NOT_FOUND'
  | 'FFMPEG_NOT_FOUND'
  | 'YOUTUBE_BOT_DETECTION'
  | 'VIDEO_UNAVAILABLE'
  | 'AUTHENTICATION_REQUIRED'
  | 'AGE_RESTRICTED'
  | 'RATE_LIMITED'
  | 'DOWNLOAD_FAILED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR'

export class MediaAppError extends Error {
  constructor(public code: AppErrorCode, message: string, public statusCode = 400, public details?: string) {
    super(message)
  }
}

type ProcessResult = { stdout: string; stderr: string; code: number | null }

type MediaFormat = {
  format_id?: string
  ext?: string
  resolution?: string
  format_note?: string
  filesize?: number
  filesize_approx?: number
  vcodec?: string
  acodec?: string
}

export type MediaInfo = {
  id: string
  title: string
  thumbnail: string | null
  duration: number | null
  uploader: string | null
  formats: Array<{
    id: string
    ext: string
    label: string
    filesize: number | null
    hasVideo: boolean
    hasAudio: boolean
  }>
}

export type DownloadResult = {
  filePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

const YTDLP_BIN = process.env.YTDLP_PATH || 'yt-dlp'
const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'
const DEFAULT_TIMEOUT_MS = Number(process.env.YTDLP_TIMEOUT_MS || 120_000)
const DOWNLOAD_TIMEOUT_MS = Number(process.env.YTDLP_DOWNLOAD_TIMEOUT_MS || 300_000)
const WORK_DIR = path.join(tmpdir(), 'videodownloader')

function runProcess(command: string, args: string[], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, windowsHide: true })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new MediaAppError('TIMEOUT', 'The media operation timed out.', 504, stderr || stdout))
    }, timeoutMs)

    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      const code = command === YTDLP_BIN ? 'YTDLP_NOT_FOUND' : 'FFMPEG_NOT_FOUND'
      reject(new MediaAppError(code, `${command} is not installed or not executable.`, 500, error.message))
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, code })
    })
  })
}

export async function checkYtDlpAvailability() {
  const result = await runProcess(YTDLP_BIN, ['--version'], 15_000)
  if (result.code !== 0) throw classifyYtDlpError(result.stderr || result.stdout)
  return { path: YTDLP_BIN, version: result.stdout.trim() }
}

export async function checkFfmpegAvailability() {
  const result = await runProcess(FFMPEG_BIN, ['-version'], 15_000)
  if (result.code !== 0) throw new MediaAppError('FFMPEG_NOT_FOUND', 'ffmpeg is not installed or not executable.', 500, result.stderr)
  return { path: FFMPEG_BIN, version: result.stdout.split('\n')[0] || 'unknown' }
}

export function assertSupportedMediaUrl(rawUrl: string) {
  const validation = validateUrl(rawUrl)
  if (!validation.valid || !validation.normalizedUrl) {
    throw new MediaAppError('INVALID_URL', validation.message || 'The URL is invalid.', 400)
  }
  return validation.normalizedUrl
}

function classifyYtDlpError(output: string): MediaAppError {
  const lower = output.toLowerCase()
  if (lower.includes('sign in to confirm') || lower.includes('not a bot')) {
    return new MediaAppError('YOUTUBE_BOT_DETECTION', 'YouTube is requiring additional verification for this request.', 403, output)
  }
  if (lower.includes('please sign in') || lower.includes('login required') || lower.includes('cookies')) {
    return new MediaAppError('AUTHENTICATION_REQUIRED', 'This video requires authentication or cookies.', 403, output)
  }
  if (lower.includes('age-restricted') || lower.includes('confirm your age')) {
    return new MediaAppError('AGE_RESTRICTED', 'This video is age restricted.', 403, output)
  }
  if (lower.includes('http error 403') || lower.includes('rate-limit') || lower.includes('too many requests')) {
    return new MediaAppError('RATE_LIMITED', 'The media provider is rate limiting this server.', 429, output)
  }
  if (lower.includes('video unavailable') || lower.includes('private video')) {
    return new MediaAppError('VIDEO_UNAVAILABLE', 'This video is unavailable.', 404, output)
  }
  return new MediaAppError('DOWNLOAD_FAILED', 'The media download failed.', 400, output)
}

function publicFormats(formats: MediaFormat[] = []) {
  return formats
    .filter((format) => format.format_id && format.ext)
    .slice(0, 80)
    .map((format) => ({
      id: String(format.format_id),
      ext: String(format.ext),
      label: format.resolution || format.format_note || String(format.format_id),
      filesize: format.filesize || format.filesize_approx || null,
      hasVideo: format.vcodec !== 'none',
      hasAudio: format.acodec !== 'none'
    }))
}

export async function extractMediaInfo(rawUrl: string): Promise<MediaInfo> {
  const url = assertSupportedMediaUrl(rawUrl)
  await checkYtDlpAvailability()
  const args = ['--dump-single-json', '--no-warnings', '--no-playlist', url]
  const result = await runProcess(YTDLP_BIN, args)
  if (result.code !== 0) throw classifyYtDlpError(result.stderr || result.stdout)

  try {
    const data = JSON.parse(result.stdout)
    return {
      id: String(data.id || ''),
      title: String(data.title || 'Untitled media'),
      thumbnail: data.thumbnail || null,
      duration: typeof data.duration === 'number' ? data.duration : null,
      uploader: data.uploader || data.channel || null,
      formats: publicFormats(data.formats)
    }
  } catch (error: any) {
    throw new MediaAppError('UNKNOWN_ERROR', 'Unable to parse yt-dlp metadata.', 500, error.message)
  }
}

function safeBaseName(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'media-download'
}

export async function downloadMedia(rawUrl: string, formatId?: string): Promise<DownloadResult> {
  const url = assertSupportedMediaUrl(rawUrl)
  await checkYtDlpAvailability()
  await checkFfmpegAvailability()
  await mkdir(WORK_DIR, { recursive: true })
  const prefix = `download-${randomUUID()}`
  const outputTemplate = path.join(WORK_DIR, `${prefix}.%(ext)s`)
  const args = ['--no-playlist', '--ffmpeg-location', FFMPEG_BIN, '-o', outputTemplate]
  if (formatId && /^[\w.+-]+$/.test(formatId)) args.push('-f', formatId)
  else args.push('-f', 'bv*+ba/b')
  args.push(url)

  const result = await runProcess(YTDLP_BIN, args, DOWNLOAD_TIMEOUT_MS)
  if (result.code !== 0) throw classifyYtDlpError(result.stderr || result.stdout)

  const match = [...result.stderr.matchAll(/\[download\] Destination: (.+)|\[Merger\] Merging formats into "(.+)"/g)].pop()
  const candidate = match?.[2] || match?.[1]
  const filePath = candidate && path.resolve(candidate).startsWith(WORK_DIR) ? candidate : ''
  if (!filePath) throw new MediaAppError('DOWNLOAD_FAILED', 'Unable to locate the downloaded file.', 500, result.stderr)
  await access(filePath, constants.R_OK)
  const stats = await stat(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const title = (result.stderr.match(/\[download\] Destination: .*?([^/\\]+)$/m)?.[1] || path.basename(filePath)).replace(/\.[^.]+$/, '')

  return {
    filePath,
    fileName: `${safeBaseName(title)}.${ext || 'mp4'}`,
    mimeType: ext === 'mp3' ? 'audio/mpeg' : ext === 'webm' ? 'video/webm' : 'video/mp4',
    sizeBytes: stats.size
  }
}

export async function cleanupDownloadedFile(filePath: string) {
  if (path.resolve(filePath).startsWith(WORK_DIR)) await unlink(filePath).catch(() => undefined)
}

export function toPublicError(error: unknown) {
  const appError = error instanceof MediaAppError ? error : new MediaAppError('UNKNOWN_ERROR', 'An unexpected media error occurred.', 500)
  console.error('[media]', appError.code, appError.details || appError.message)
  return { statusCode: appError.statusCode, body: { success: false, error: { code: appError.code, message: appError.message } } }
}
