# Video Downloader

A secure direct-media download utility built with Nuxt 3 and a lightweight API layer for validation, metadata extraction, temporary storage, and queue-backed processing.

## Included phases

- Nuxt UI shell
- URL validation and direct media download flow
- Media metadata, thumbnail, file type, file size, and progress handling
- MCP-style media inspection functions (`analyze_media`, `get_media_info`, `download_authorized_media`)
- Temporary file storage with automatic cleanup
- Redis-compatible background queue abstraction with in-memory fallback
- Security controls for SSRF protection, rate limiting, domain validation, and timeout handling

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`

## API routes

- `POST /api/validate-url`
- `POST /api/analyze`
- `POST /api/media-info`
- `POST /api/media/download`

## Notes

This project intentionally keeps the download logic deterministic and safe for local testing by validating hosts and limiting payload size.
