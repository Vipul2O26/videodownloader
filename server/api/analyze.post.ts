import { readBody, createError } from 'h3'
import { analyze_media } from '../utils/media'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''

  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: 'A media URL is required.' })
  }

  try {
    return analyze_media(rawUrl)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unable to analyze the media URL.'
    })
  }
})
