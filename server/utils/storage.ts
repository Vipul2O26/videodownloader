import { promises as fs } from 'node:fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'

export const TEMP_DIRECTORY = path.resolve(process.cwd(), '.tmp')

export async function ensureTemporaryDirectory() {
  await fs.mkdir(TEMP_DIRECTORY, { recursive: true })
  return TEMP_DIRECTORY
}

export async function writeTemporaryFile(content: Buffer | Uint8Array, extension = 'bin', prefix = 'media') {
  await ensureTemporaryDirectory()
  const fileName = `${prefix}-${uuidv4()}.${extension.replace(/^\./, '')}`
  const targetPath = path.join(TEMP_DIRECTORY, fileName)
  await fs.writeFile(targetPath, Buffer.from(content))
  return targetPath
}

export async function cleanupTemporaryFiles(maxAgeMs = 60 * 60 * 1000) {
  await ensureTemporaryDirectory()

  const files = await fs.readdir(TEMP_DIRECTORY)
  const now = Date.now()

  await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(TEMP_DIRECTORY, fileName)
      const stats = await fs.stat(filePath).catch(() => null)

      if (!stats || !stats.isFile()) {
        return
      }

      if (now - stats.mtimeMs > maxAgeMs) {
        await fs.unlink(filePath).catch(() => undefined)
      }
    })
  )
}
