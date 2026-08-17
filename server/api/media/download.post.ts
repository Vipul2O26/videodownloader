import { readBody, createError } from 'h3'
import { direct_media_download } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''

  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: 'A media URL is required.' })
  }

  try {
    const format = body?.format === 'mp3' || body?.format === 'mp4' ? body.format : 'auto'

    const result = await direct_media_download(rawUrl, {
      title: typeof body?.title === 'string' ? body.title : 'Remote media asset',
      format
    })

    return result
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unable to download the remote media.'
    })
  }
})
