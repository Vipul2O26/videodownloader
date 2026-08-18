import { readBody, setResponseStatus } from 'h3'
import { readFile } from 'node:fs/promises'
import { cleanupDownloadedFile, downloadMedia, toPublicError } from '../../utils/ytDlp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''
  const formatId = typeof body?.formatId === 'string' ? body.formatId : undefined

  try {
    const result = await downloadMedia(rawUrl, formatId)
    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(result.filePath)
    } finally {
      await cleanupDownloadedFile(result.filePath)
    }
    const encodedFileName = encodeURIComponent(result.fileName)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Length': String(result.sizeBytes),
        'Content-Disposition': `attachment; filename="${result.fileName.replace(/["']/g, '')}"; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  } catch (error) {
    const publicError = toPublicError(error)
    setResponseStatus(event, publicError.statusCode, publicError.statusMessage)
    return publicError.body
  }
})
