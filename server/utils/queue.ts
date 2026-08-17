import { Redis } from 'ioredis'

export type QueueJob = {
  id: string
  name: string
  payload: Record<string, any>
  createdAt: number
  status: 'queued' | 'processing' | 'done'
}

const memoryQueue: QueueJob[] = []

export class BackgroundQueue {
  private redis?: Redis

  constructor(redis?: Redis) {
    this.redis = redis
  }

  async enqueue(name: string, payload: Record<string, any>) {
    const job: QueueJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      payload,
      createdAt: Date.now(),
      status: 'queued'
    }

    if (this.redis) {
      await this.redis.lpush('media:queue', JSON.stringify(job))
      return job
    }

    memoryQueue.push(job)
    return job
  }

  async list() {
    if (this.redis) {
      const items = await this.redis.lrange('media:queue', 0, -1)
      return items.map((entry) => JSON.parse(entry) as QueueJob)
    }

    return [...memoryQueue]
  }

  async process(handler: (job: QueueJob) => Promise<void> | void) {
    const jobs = await this.list()

    for (const job of jobs) {
      job.status = 'processing'
      await handler(job)
      job.status = 'done'
    }
  }
}

export const mediaQueue = new BackgroundQueue()
