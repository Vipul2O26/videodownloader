<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <nav class="mb-10 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5 text-white">
              <path fill="currentColor" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-11Zm2.5-.5a.5.5 0 0 0-.5.5v11c0 .28.22.5.5.5h9a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-9ZM10 8.5v7l6-3.5-6-3.5Z"/>
            </svg>
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight text-white">StreamDrop</p>
            <p class="text-xs text-slate-400">Downloader Studio</p>
          </div>
        </div>

        <div class="hidden items-center gap-6 md:flex">
          <a href="#" class="text-sm text-slate-300 transition hover:text-white">Home</a>
          <a href="#" class="text-sm text-slate-300 transition hover:text-white">Formats</a>
          <a href="#" class="text-sm text-slate-300 transition hover:text-white">Support</a>
        </div>

        <button type="button" class="hidden rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white md:inline-flex">
          Open app
        </button>
      </nav>

      <header class="mx-auto max-w-3xl text-center">
        <span class="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
          fast • secure • simple
        </span>
        <h1 class="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Download Your Video
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
          Paste a direct media URL and download quickly in the format you want.
        </p>
      </header>

      <main class="mx-auto mt-10 max-w-5xl">
        <section class="rounded-[28px] border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div class="relative flex-1">
              <input
                v-model="url"
                type="url"
                placeholder="https://example.com/video.mp4"
                :disabled="loading"
                class="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 pr-24 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
              <button
                type="button"
                @click="pasteUrl"
                class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Paste
              </button>
            </div>

            <button
              type="button"
              :disabled="loading"
              @click="submit"
              class="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
                  <path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z"/>
                </svg>
                {{ loading ? 'Checking...' : 'Download' }}
              </span>
            </button>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <span class="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Supports</span>
            <div class="flex flex-wrap gap-2">
              <span class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200">YouTube</span>
              <span class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200">Instagram</span>
              <span class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200">Facebook</span>
            </div>
          </div>

          <div v-if="statusMessage" :class="['mt-5 rounded-2xl border px-4 py-3 text-sm', statusTone]">
            {{ statusMessage }}
          </div>
        </section>

        <section v-if="!result" class="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div class="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
            <div class="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-6 text-center">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="h-8 w-8">
                  <path fill="currentColor" d="M17 10.5V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l4 3.5V7l-4 3.5ZM15 17H7V7h8v10Zm-2.5-5.5-4-2.5v5l4-2.5Z"/>
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-white">Ready when you are</h2>
              <p class="mt-2 max-w-md text-sm text-slate-400">
                Paste a direct media URL to preview the file, inspect details, and download it to your device.
              </p>
            </div>
          </div>

          <aside class="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
            <h3 class="text-lg font-semibold text-white">Quick tips</h3>
            <ul class="mt-4 space-y-3 text-sm text-slate-300">
              <li class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Use a direct file URL ending in .mp4 or .mp3 for best results.</li>
              <li class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Choose the best quality based on your device and storage.</li>
              <li class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Downloads go to your browser/device download location.</li>
            </ul>
          </aside>
        </section>

        <section v-else class="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div class="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-950/40">
            <div class="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
              <span class="text-sm font-medium text-slate-200">Preview</span>
              <span class="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                {{ result.fileType || 'media' }}
              </span>
            </div>

            <div class="p-4">
              <video
                v-if="previewable(result)"
                controls
                :src="result.previewUrl || result.url"
                class="h-72 w-full rounded-2xl bg-slate-950 object-cover"
              />

              <img
                v-else-if="result.thumbnail"
                :src="result.thumbnail"
                alt="Media thumbnail"
                class="h-72 w-full rounded-2xl object-cover"
              />

              <div v-else class="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 text-sm text-slate-400">
                Preview not available
              </div>
            </div>
          </div>

          <aside class="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/40">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="result.thumbnail"
                  :src="result.thumbnail"
                  alt="Video thumbnail"
                  class="h-14 w-14 rounded-xl object-cover"
                />
                <div v-else class="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-cyan-300">
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="h-6 w-6">
                    <path fill="currentColor" d="M17 10.5V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5l4 3.5V7l-4 3.5ZM15 17H7V7h8v10Zm-2.5-5.5-4-2.5v5l4-2.5Z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Media</p>
                  <h3 class="mt-1 max-w-[180px] text-base font-semibold text-white line-clamp-2">{{ result.title || 'Remote media asset' }}</h3>
                </div>
              </div>

              <button
                v-if="result?.url"
                type="button"
                @click="downloadFile"
                class="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Download
              </button>
            </div>

            <div class="mt-6 space-y-3">
              <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Platform</div>
                <div class="mt-1 text-sm font-medium text-slate-100">{{ result.host || 'Unknown' }}</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Duration</div>
                <div class="mt-1 text-sm font-medium text-slate-100">{{ result.duration || 'Not provided' }}</div>
              </div>
              <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">File size</div>
                <div class="mt-1 text-sm font-medium text-slate-100">{{ result.sizeLabel || 'N/A' }}</div>
              </div>
            </div>

            <div class="mt-6">
              <div class="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <span>Quality</span>
                <span>{{ selectedQuality }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="quality in qualityOptions"
                  :key="quality"
                  type="button"
                  @click="selectedQuality = quality"
                  :class="[
                    'rounded-full border px-3 py-1.5 text-xs transition',
                    selectedQuality === quality
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500'
                  ]"
                >
                  {{ quality }}
                </button>
              </div>
            </div>

            <div class="mt-6">
              <label for="download-name" class="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">File name</label>
              <input
                id="download-name"
                v-model="downloadName"
                maxlength="80"
                placeholder="my-video.mp4"
                class="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div class="mt-6">
              <div class="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                <span>Progress</span>
                <span>{{ result.progress || 0 }}%</span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-300" :style="{ width: `${result.progress || 0}%` }"></div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const url = ref('')
const downloadName = ref('')
const loading = ref(false)
const statusMessage = ref('')
const result = ref<any>(null)
const selectedQuality = ref('720p')
const qualityOptions = ['360p', '720p', '1080p']

const statusTone = computed(() => {
  if (!statusMessage.value) {
    return 'border-slate-800 bg-slate-900/60 text-slate-200'
  }

  if (/success|downloaded|ready/i.test(statusMessage.value)) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  }

  if (/error|unable|invalid|failed|blocked/i.test(statusMessage.value)) {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-200'
  }

  return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
})

function useSample(sampleUrl: string) {
  url.value = sampleUrl
}

function pasteUrl() {
  if (!navigator?.clipboard?.readText) {
    statusMessage.value = 'Clipboard access is not available in this browser.'
    return
  }

  navigator.clipboard.readText().then((text) => {
    url.value = text
    statusMessage.value = 'URL pasted from clipboard.'
  }).catch(() => {
    statusMessage.value = 'Unable to read the clipboard. Please paste the URL manually.'
  })
}

const formatOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'MP4', value: 'mp4' },
  { label: 'MP3', value: 'mp3' }
]
const selectedFormat = ref<'auto' | 'mp4' | 'mp3'>('auto')

function previewable(media: any) {
  const source = media?.previewUrl || media?.url || ''
  return typeof source === 'string' && /\.(mp4|webm|m4v|m3u8|mpd)(\?.*)?$/i.test(source)
}

async function downloadFile() {
  if (!result.value?.url) {
    return
  }

  const response = await fetch(`/api/media/file?url=${encodeURIComponent(result.value.url)}&title=${encodeURIComponent(result.value.title || 'media-download')}&format=${encodeURIComponent(selectedFormat.value)}`)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = result.value.fileName || 'media-download.bin'

  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

async function submit() {
  if (!url.value.trim()) {
    statusMessage.value = 'Please provide a valid media URL.'
    return
  }

  loading.value = true
  statusMessage.value = 'Validating URL and preparing your media download...'

  try {
    const response = await $fetch('/api/media/download', {
      method: 'POST',
      body: {
        url: url.value,
        format: selectedFormat.value
      }
    })

    result.value = response
    statusMessage.value = response.status === 'downloaded'
      ? 'Media was downloaded successfully and is ready to save.'
      : 'Media analysis succeeded.'
  } catch (error: any) {
    result.value = null
    statusMessage.value = error?.data?.message || 'Unable to process the media URL.'
  } finally {
    loading.value = false
  }
}
</script>
