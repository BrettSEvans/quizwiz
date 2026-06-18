import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { logger } from '../system-log'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('System Logger', () => {
  let testLogDir: string
  let testLogFile: string

  beforeEach(() => {
    // Create unique temp directory for each test
    testLogDir = path.join(os.tmpdir(), `quizwiz-logs-test-${Date.now()}-${Math.random()}`)
    testLogFile = path.join(testLogDir, 'system.log')

    // Create the directory
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true })
    }

    // Set env var for the test
    process.env.LOG_DIR = testLogDir
  })

  afterEach(async () => {
    // Flush any pending writes
    await logger.flush()

    // Cleanup
    if (fs.existsSync(testLogDir)) {
      try {
        fs.rmSync(testLogDir, { recursive: true, force: true })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  })

  it('should log errors', async () => {
    const err = new Error('Test error')
    logger.logError('test:error', err, { userId: '123' })
    await logger.flush()

    // Ensure file exists and has content
    expect(fs.existsSync(testLogFile)).toBe(true)
    const content = fs.readFileSync(testLogFile, 'utf8')
    expect(content).toContain('ERROR')
    expect(content).toContain('test:error')
    expect(content).toContain('Test error')
  })

  it('should log events', async () => {
    logger.logEvent('test:event', { action: 'start', duration: 100 })
    await logger.flush()

    expect(fs.existsSync(testLogFile)).toBe(true)
    const content = fs.readFileSync(testLogFile, 'utf8')
    expect(content).toContain('EVENT')
    expect(content).toContain('test:event')
  })

  it('should log string errors', async () => {
    logger.logError('test:string-error', 'Something went wrong')
    await logger.flush()

    expect(fs.existsSync(testLogFile)).toBe(true)
    const content = fs.readFileSync(testLogFile, 'utf8')
    expect(content).toContain('Something went wrong')
  })

  it('should include timestamp in every entry', async () => {
    logger.logEvent('test:timestamp')
    await logger.flush()

    expect(fs.existsSync(testLogFile)).toBe(true)
    const content = fs.readFileSync(testLogFile, 'utf8')
    const entry = JSON.parse(content.trim())
    expect(entry.timestamp).toBeDefined()
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp)
  })
})
