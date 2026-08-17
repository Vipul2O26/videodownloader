import { readBody, createError } from 'h3'
import { validateUrl } from '../utils/security'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''
  const validation = validateUrl(rawUrl)

  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.message ?? 'The URL is invalid.'
    })
  }

  return {
    valid: true,
    normalizedUrl: validation.normalizedUrl,
    host: validation.host,
    message: 'The media URL passed validation.'
  }
})
