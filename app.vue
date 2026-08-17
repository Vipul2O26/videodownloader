<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-3">
          <span class="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            media toolkit
          </span>
          <div>
            <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">Video Downloader</h1>
            <p class="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Validate remote URLs, inspect media metadata, and fetch a browser-downloadable file in a secure, streamlined workflow.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 text-xs text-slate-300">
          <span class="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5">URL validation</span>
          <span class="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5">Metadata</span>
          <span class="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5">Download</span>
        </div>
      </header>

      <main class="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <section class="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-sm sm:p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Fetch media</h2>
            <span class="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300">
              secure
            </span>
          </div>

          <div class="space-y-4">
            <label for="media-url" class="block text-sm font-medium text-slate-200">Media URL</label>
            <div class="flex flex-col gap-3 sm:flex-row">
              <input
                id="media-url"
                v-model="url"
                type="url"
                placeholder="https://example.com/video.mp4"
                :disabled="loading"
                class="flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />

              <button
                type="button"
                :disabled="loading"
                @click="submit"
                class="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ loading ? 'Processing...' : 'Analyze & download' }}
              </button>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Format</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in formatOptions"
                  :key="option.value"
                  type="button"
                  @click="selectedFormat = option.value"
                  :class="[
                    'rounded-full border px-3 py-1.5 text-xs transition',
                    selectedFormat === option.value
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-slate-500'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button type="button" @click="useSample('https://example.com')" class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500">Example</button>
              <button type="button" @click="useSample('https://www.youtube.com/watch?v=dQw4w9WgXcQ')" class="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500">YouTube</button>
            </div>
          </div>

          <div v-if="statusMessage" class="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            {{ statusMessage }}
          </div>
        </section>

        <aside class="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl shadow-slate-950/50">
          <h3 class="mb-4 text-lg font-semibold text-white">Workflow</h3>
          <ul class="space-y-3 text-sm text-slate-300">
            <li class="flex gap-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-300">1</span>
              <span>Validate URL against allowed providers</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-300">2</span>
              <span>Inspect media metadata and file attributes</span>
            </li>
            <li class="flex gap-3">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-300">3</span>
              <span>Download the file directly through the browser</span>
            </li>
          </ul>
        </aside>
      </main>

      <section v-if="result" class="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl shadow-slate-950/40">
          <div class="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
            <h3 class="font-semibold text-white">Preview</h3>
            <span class="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              {{ result.fileType || 'media' }}
            </span>
          </div>

          <div class="p-4">
            <video
              v-if="previewable(result)"
              controls
              :src="result.previewUrl || result.url"
              class="h-64 w-full rounded-2xl bg-slate-950 object-cover"
            />

            <img
              v-else-if="result.thumbnail"
              :src="result.thumbnail"
              alt="Media thumbnail"
              class="h-64 w-full rounded-2xl object-cover"
            />

            <div v-else class="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 text-sm text-slate-400">
              No preview available
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/40">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-white">Media details</h3>
            <button
              v-if="result?.url"
              type="button"
              @click="downloadFile"
              class="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Download file
            </button>
          </div>

          <dl class="space-y-3 text-sm text-slate-300">
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-2">
              <dt class="text-slate-400">Title</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.title || 'N/A' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-2">
              <dt class="text-slate-400">Host</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.host || 'N/A' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-2">
              <dt class="text-slate-400">Type</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.fileType || 'N/A' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-2">
              <dt class="text-slate-400">Size</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.sizeLabel || 'N/A' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 pb-2">
              <dt class="text-slate-400">Status</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.status || 'pending' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-slate-400">Progress</dt>
              <dd class="max-w-[65%] text-right font-medium text-slate-100">{{ result.progress || 0 }}%</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const url = ref('')
const loading = ref(false)
const statusMessage = ref('')
const result = ref<any>(null)

function useSample(sampleUrl: string) {
  url.value = sampleUrl
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
