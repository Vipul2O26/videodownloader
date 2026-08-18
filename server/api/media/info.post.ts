import { readBody, setResponseStatus } from 'h3'
import { extractMediaInfo, toPublicError } from '../../utils/ytDlp'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''

  try {
    const data = await extractMediaInfo(rawUrl)
    return { success: true, data }
  } catch (error) {
    const publicError = toPublicError(error)
    setResponseStatus(event, publicError.statusCode)
    return publicError.body
  }
})
