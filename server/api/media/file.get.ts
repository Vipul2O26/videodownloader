import { getQuery, setResponseStatus } from 'h3'
import { readFile } from 'node:fs/promises'
import { cleanupDownloadedFile, downloadMedia, toPublicError } from '../../utils/ytDlp'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = typeof query.url === 'string' ? query.url : ''
  const formatId = typeof query.formatId === 'string' ? query.formatId : undefined

  try {
    const result = await downloadMedia(rawUrl, formatId)
    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(result.filePath)
    } finally {
      await cleanupDownloadedFile(result.filePath)
    }

    const safeFileName = result.fileName.replace(/["']/g, '')
    const encodedFileName = encodeURIComponent(safeFileName)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': result.mimeType,
        'Content-Length': String(result.sizeBytes),
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
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
