# Video Downloader

Nuxt 3 + Vue 3 + TypeScript video downloader that keeps all media processing on the Nuxt/Nitro server.

```text
Nuxt 3 Frontend
      ↓
Nuxt Server API (/api/media/...)
      ↓
yt-dlp executable
      ↓
ffmpeg executable
      ↓
Temporary server file
      ↓
User download
```

## Requirements

Install real executables on the same server that runs Nuxt:

```bash
python3 -m pip install --user -U yt-dlp
sudo apt-get update && sudo apt-get install -y ffmpeg
```

Then verify:

```bash
which yt-dlp
yt-dlp --version
which ffmpeg
ffmpeg -version
```

If the executables live outside `PATH`, configure them explicitly:

```bash
YTDLP_PATH=/absolute/path/to/yt-dlp
FFMPEG_PATH=/absolute/path/to/ffmpeg
```

Optional timeout configuration:

```bash
YTDLP_TIMEOUT_MS=120000
YTDLP_DOWNLOAD_TIMEOUT_MS=300000
```

## YouTube bot/authentication limitation

If direct terminal commands such as:

```bash
yt-dlp --verbose "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
yt-dlp --dump-single-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

return `Sign in to confirm you're not a bot`, `Please sign in`, `HTTP 403`, or `Video unavailable`, the failure is happening between `yt-dlp` and YouTube. In that case, replacing the Nuxt API or swapping to a random npm downloader package will not reliably fix the issue. Codespaces and other cloud/datacenter IPs are commonly treated differently from residential browsers.

Do not commit YouTube cookies or personal account credentials. If cookies are needed for local testing, keep them outside Git and configure them only on your local machine.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## API routes

- `POST /api/media/info` — validates a URL and returns normalized `yt-dlp` metadata.
- `POST /api/media/download` — downloads via server-side `yt-dlp`, returns an attachment, and removes the temporary file.
- `POST /api/media-info` — legacy alias for metadata.
- `GET /api/media/file` — legacy download route using the same server-side `yt-dlp` utility.
- `POST /api/validate-url`
- `POST /api/analyze`

## Error response shape

Routes return sanitized application errors instead of raw shell output:

```json
{
  "success": false,
  "error": {
    "code": "YOUTUBE_BOT_DETECTION",
    "message": "YouTube is requiring additional verification for this request."
  }
}
```

Server logs keep the detailed `yt-dlp` stdout/stderr for debugging.
