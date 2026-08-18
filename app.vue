<template>
  <main class="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
    <section class="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Nuxt + yt-dlp downloader</p>
      <h1 class="mt-3 text-4xl font-black text-white">Download YouTube/video media securely</h1>
      <p class="mt-3 text-slate-300">The browser sends only the URL to Nuxt server routes. yt-dlp and ffmpeg run server-side.</p>

      <div class="mt-8 flex flex-col gap-3 md:flex-row">
        <input
          v-model="url"
          type="url"
          :disabled="loading"
          placeholder="https://www.youtube.com/watch?v=..."
          class="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        />
        <button :disabled="loading" class="rounded-2xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-60" @click="fetchInfo">
          {{ loading ? 'Checking...' : 'Fetch info' }}
        </button>
      </div>

      <div v-if="statusMessage" :class="['mt-5 rounded-2xl border px-4 py-3 text-sm', statusTone]">
        {{ statusMessage }}
      </div>

      <section v-if="videoInfo" class="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
        <img v-if="videoInfo.thumbnail" :src="videoInfo.thumbnail" alt="Video thumbnail" class="aspect-video w-full rounded-2xl object-cover md:aspect-auto md:h-full" />
        <div v-else class="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-slate-400">No thumbnail</div>

        <div>
          <h2 class="text-2xl font-bold text-white">{{ videoInfo.title }}</h2>
          <dl class="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-950/70 p-3"><dt class="text-slate-500">Uploader</dt><dd>{{ videoInfo.uploader || 'Unknown' }}</dd></div>
            <div class="rounded-2xl bg-slate-950/70 p-3"><dt class="text-slate-500">Duration</dt><dd>{{ formattedDuration }}</dd></div>
          </dl>

          <label class="mt-5 block text-sm font-semibold text-slate-200" for="format">Format / quality</label>
          <select id="format" v-model="selectedFormatId" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white">
            <option value="">Best video + audio</option>
            <option v-for="format in visibleFormats" :key="format.id" :value="format.id">
              {{ format.label }} · {{ format.ext }} · {{ format.hasVideo ? 'video' : 'audio' }}{{ format.hasAudio ? '+audio' : '' }}
            </option>
          </select>

          <button :disabled="downloading" class="mt-5 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-60" @click="download">
            {{ downloading ? 'Downloading...' : 'Download file' }}
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
type MediaInfo = {
  id: string
  title: string
  thumbnail: string | null
  duration: number | null
  uploader: string | null
  formats: Array<{ id: string; ext: string; label: string; filesize: number | null; hasVideo: boolean; hasAudio: boolean }>
}

const url = ref('')
const loading = ref(false)
const downloading = ref(false)
const statusMessage = ref('')
const statusCode = ref<string | null>(null)
const videoInfo = ref<MediaInfo | null>(null)
const selectedFormatId = ref('')

const visibleFormats = computed(() => videoInfo.value?.formats.filter((format) => format.hasAudio || format.hasVideo).slice(0, 30) ?? [])

const formattedDuration = computed(() => {
  const seconds = videoInfo.value?.duration
  if (!seconds) return 'Unknown'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
})

const statusTone = computed(() => {
  if (statusCode.value) return 'border-rose-500/40 bg-rose-500/10 text-rose-200'
  if (/ready|started|success/i.test(statusMessage.value)) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
})

function friendlyError(error: any) {
  const payload = error?.data?.error || error?.error
  statusCode.value = payload?.code || 'UNKNOWN_ERROR'
  statusMessage.value = payload?.message || 'Unable to process this media URL.'
}

async function fetchInfo() {
  if (!url.value.trim()) {
    statusCode.value = 'INVALID_URL'
    statusMessage.value = 'Please enter a valid YouTube or supported video URL.'
    return
  }

  loading.value = true
  videoInfo.value = null
  selectedFormatId.value = ''
  statusCode.value = null
  statusMessage.value = 'Validating URL and asking the Nuxt server to inspect the video...'

  try {
    const response = await $fetch<{ success: boolean; data?: MediaInfo; error?: { code: string; message: string } }>('/api/media/info', {
      method: 'POST',
      body: { url: url.value.trim() }
    })

    if (!response.success || !response.data) throw { error: response.error }
    videoInfo.value = response.data
    statusMessage.value = 'Video information is ready. Choose a format and download.'
  } catch (error) {
    friendlyError(error)
  } finally {
    loading.value = false
  }
}

async function download() {
  downloading.value = true
  statusCode.value = null
  statusMessage.value = 'Download started on the Nuxt server...'

  try {
    const response = await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value.trim(), formatId: selectedFormatId.value || undefined })
    })

    if (!response.ok) throw await response.json()
    const blob = await response.blob()
    const disposition = response.headers.get('content-disposition') || ''
    const fileName = decodeURIComponent(disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1] || `${videoInfo.value?.title || 'media-download'}.mp4`)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
    statusMessage.value = 'Download completed successfully.'
  } catch (error) {
    friendlyError(error)
  } finally {
    downloading.value = false
  }
}
</script>
