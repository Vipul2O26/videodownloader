<template>
  <UPage>
    <UContainer class="py-10">
      <div class="max-w-4xl mx-auto space-y-8">
        <div class="space-y-3">
          <UBadge color="primary" variant="soft">Phase 1–6 pipeline</UBadge>
          <h1 class="text-4xl font-bold tracking-tight text-white">Video Downloader</h1>
          <p class="text-base text-slate-300 max-w-2xl">
            Secure, validated media fetching with metadata extraction, temporary storage, background processing, and rate-limited handling.
          </p>
        </div>

        <div class="preview-card p-6 sm:p-8">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div class="flex-1">
              <label for="media-url" class="block text-sm font-medium text-slate-200 mb-2">Media URL</label>
              <UInput
                id="media-url"
                v-model="url"
                size="xl"
                placeholder="https://example.com/video.mp4"
                :disabled="loading"
              />
            </div>

            <UButton
              color="primary"
              size="xl"
              :loading="loading"
              @click="submit"
            >
              Validate + Download
            </UButton>
          </div>

          <div v-if="statusMessage" class="mt-5 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
            {{ statusMessage }}
          </div>
        </div>

        <div v-if="result" class="grid gap-5 md:grid-cols-2">
          <div class="preview-card p-5">
            <h2 class="text-lg font-semibold mb-4">Metadata</h2>
            <dl class="space-y-2 text-sm text-slate-300">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Title</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.title || 'N/A' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Host</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.host || 'N/A' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">File type</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.fileType || 'N/A' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">File size</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.sizeLabel || 'N/A' }}</dd>
              </div>
            </dl>
          </div>

          <div class="preview-card p-5">
            <h2 class="text-lg font-semibold mb-4">Download state</h2>
            <dl class="space-y-2 text-sm text-slate-300">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Status</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.status || 'pending' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Progress</dt>
                <dd class="font-medium text-right text-slate-100">{{ result.progress || 0 }}%</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">URL</dt>
                <dd class="font-medium text-right text-slate-100 break-all">{{ result.url || 'N/A' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </UContainer>
  </UPage>
</template>

<script setup lang="ts">
const url = ref('')
const loading = ref(false)
const statusMessage = ref('')
const result = ref<any>(null)

async function submit() {
  if (!url.value.trim()) {
    statusMessage.value = 'Please provide a valid media URL.'
    return
  }

  loading.value = true
  statusMessage.value = 'Validating URL and preparing download...'

  try {
    const response = await $fetch('/api/media/download', {
      method: 'POST',
      body: { url: url.value }
    })

    result.value = response
    statusMessage.value = response.status === 'downloaded' ? 'Media processed successfully.' : 'A media analysis request was accepted.'
  } catch (error: any) {
    result.value = null
    statusMessage.value = error?.data?.message || 'Unable to process the media URL.'
  } finally {
    loading.value = false
  }
}
</script>
