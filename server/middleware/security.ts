import { createError, defineEventHandler, getRequestURL } from 'h3'
import { enforceRateLimit } from '../utils/security'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  if (!requestUrl.pathname.includes('/api')) {
    return
  }

  const forwarded = event.node.req.headers['x-forwarded-for']
  const remoteAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? event.node.req.socket.remoteAddress ?? 'unknown-client'

  if (!enforceRateLimit(remoteAddress, 20, 60_000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please slow down before trying again.'
    })
  }
})
