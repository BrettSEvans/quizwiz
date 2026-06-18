import fs from 'fs'
import path from 'path'

const MAX_LINES = 10000
const TRIM_HIGH_WATER = 11000
const TRIM_AMOUNT = 1000

// Get log directory dynamically (for test isolation)
function getLogDir(): string {
  return process.env.LOG_DIR || path.join(process.cwd(/*turbopackIgnore: true*/), 'logs')
}

function getLogFile(): string {
  const dir = getLogDir()
  return path.join(dir, 'system.log')
}

// Ensure log directory exists
function ensureLogDir(): void {
  const logDir = getLogDir()
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
}

// Single async write queue (mutex) to prevent interleaved writes
let writeQueue: Promise<void> = Promise.resolve()

function enqueueWrite(fn: () => Promise<void>): Promise<void> {
  const task = writeQueue.then(fn).catch((err) => {
    console.error('Write queue error:', err)
  })
  writeQueue = task
  return task
}

export const logger = {
  /**
   * Log an error with optional context.
   */
  logError(label: string, error: Error | string, context?: Record<string, unknown>): void {
    const message =
      typeof error === 'string'
        ? error
        : error.message + (error.stack ? '\n' + error.stack : '')

    const entry = {
      level: 'ERROR',
      label,
      message,
      context: context || {},
      timestamp: new Date().toISOString(),
    }

    enqueueWrite(() => appendLog(entry))
  },

  /**
   * Log a key event with optional context.
   */
  logEvent(label: string, context?: Record<string, unknown>): void {
    const entry = {
      level: 'EVENT',
      label,
      context: context || {},
      timestamp: new Date().toISOString(),
    }

    enqueueWrite(() => appendLog(entry))
  },

  /**
   * Flush the write queue (for graceful shutdown).
   */
  async flush(): Promise<void> {
    await writeQueue
  },
}

/**
 * Append a log entry to the file, respecting the cap.
 * Batched trimming: only trim when line count exceeds high water mark.
 */
async function appendLog(entry: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    ensureLogDir()
    const logFile = getLogFile()
    const line = JSON.stringify(entry) + '\n'

    fs.appendFile(logFile, line, 'utf8', (err) => {
      if (err) {
        console.error('Failed to write log:', err)
        return reject(err)
      }

      // Check if we need to trim
      fs.readFile(logFile, 'utf8', (err, data) => {
        if (err) {
          console.error('Failed to read log for trim check:', err)
          return resolve()
        }

        const lines = data.split('\n').filter((l) => l.length > 0)
        if (lines.length > TRIM_HIGH_WATER) {
          const keptLines = lines.slice(-(TRIM_HIGH_WATER - TRIM_AMOUNT))
          fs.writeFile(logFile, keptLines.join('\n') + '\n', 'utf8', (err) => {
            if (err) console.error('Failed to trim log:', err)
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  })
}
