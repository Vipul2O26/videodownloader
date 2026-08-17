import { readBody, createError } from 'h3'
import { get_media_info } from '../utils/media'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''

  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: 'A media URL is required.' })
  }

  try {
    return await get_media_info(rawUrl)
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unable to retrieve media metadata.'
    })
  }
})
