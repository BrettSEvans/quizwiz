import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient } from 'socket.io-client'
import { createServer } from 'http'

// Mock dependencies
vi.mock('../../db/package-repositories', () => ({
  create: vi.fn(async (quizmasterId, name) => ({
    id: `pkg_${Date.now()}`,
    name,
    status: 'draft',
    quizmasterId,
    data: { id: `pkg_${Date.now()}`, name, status: 'draft', rounds: [] },
  })),
  findById: vi.fn(async (id) => ({
    id,
    name: 'Test Package',
    status: 'draft',
    data: { id, name: 'Test Package', status: 'draft', rounds: [] },
  })),
  update: vi.fn(async (id, data) => ({
    id,
    ...data,
    status: 'draft',
  })),
  publish: vi.fn(async (id) => ({
    id,
    status: 'published',
  })),
  deletePackage: vi.fn(async (id) => ({ id })),
}))

vi.mock('../../domain/package-authoring', () => ({
  addRound: vi.fn((pkg) => pkg),
  addQuestion: vi.fn((pkg) => pkg),
  deleteQuestion: vi.fn((pkg) => pkg),
  deleteRound: vi.fn((pkg) => pkg),
  setTiebreaker: vi.fn((pkg) => pkg),
  validatePackage: vi.fn(() => ({ valid: true, errors: [] })),
  freezeForGameStart: vi.fn(() => ({ rounds: [] })),
}))

vi.mock('../../domain/package-publishing', () => ({
  publishPackage: vi.fn((pkg) => pkg),
}))

vi.mock('../../logger/system-log', () => ({
  logger: {
    logEvent: vi.fn(),
    logError: vi.fn(),
  },
}))

import { registerPackageSocketHandlers } from '../package-socket-handlers'

describe('Package Socket Handlers', () => {
  let httpServer: any
  let ioServer: SocketIOServer
  let clientSocket: SocketIOClient

  beforeEach((done) => {
    httpServer = createServer()
    ioServer = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
    })

    registerPackageSocketHandlers(ioServer)

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port
      clientSocket = ioClient(`http://localhost:${port}`, {
        reconnectionDelay: 0,
        forceNew: true,
        transports: ['websocket'],
      })
      clientSocket.on('connect', done)
    })
  })

  afterEach((done) => {
    ioServer.close()
    clientSocket.close()
    httpServer.close(done)
  })

  describe('quizmaster:create-package', () => {
    it('should create a package and emit package:created', (done) => {
      clientSocket.emit('quizmaster:create-package', { quizmasterId: 'qm1', name: 'Test Package' })

      clientSocket.on('package:created', (data) => {
        expect(data.packageId).toBeDefined()
        expect(data.name).toBe('Test Package')
        done()
      })
    })
  })

  describe('quizmaster:save-question', () => {
    it('should save a question to a round', (done) => {
      const question = {
        roundIndex: 0,
        questionIndex: 0,
        text: 'What is 2+2?',
        type: 'standard' as const,
      }

      clientSocket.emit('quizmaster:save-question', {
        packageId: 'pkg1',
        ...question,
      })

      clientSocket.on('question:saved', (data) => {
        expect(data.roundIndex).toBe(0)
        expect(data.questionIndex).toBe(0)
        expect(data.text).toBe('What is 2+2?')
        done()
      })
    })

    it('should support musical questions with labels', (done) => {
      const question = {
        roundIndex: 0,
        questionIndex: 0,
        text: 'Who performed this?',
        type: 'musical' as const,
        labels: { artistLabel: 'Artist', yearLabel: 'Year' },
      }

      clientSocket.emit('quizmaster:save-question', {
        packageId: 'pkg1',
        ...question,
      })

      clientSocket.on('question:saved', (data) => {
        expect(data.type).toBe('musical')
        expect(data.labels).toEqual({ artistLabel: 'Artist', yearLabel: 'Year' })
        done()
      })
    })
  })

  describe('quizmaster:validate-package', () => {
    it('should return validation result', (done) => {
      clientSocket.emit('quizmaster:validate-package', { packageId: 'pkg1' })

      clientSocket.on('package:validation', (data) => {
        expect(data.valid).toBeDefined()
        expect(data.errors).toBeInstanceOf(Array)
        done()
      })
    })

    it('should report validation errors for incomplete package', (done) => {
      clientSocket.emit('quizmaster:validate-package', { packageId: 'incomplete-pkg' })

      clientSocket.on('package:validation', (data) => {
        expect(data.valid).toBe(false)
        expect(data.errors.length).toBeGreaterThan(0)
        done()
      })
    })
  })

  describe('quizmaster:publish-package', () => {
    it('should publish a valid package', (done) => {
      clientSocket.emit('quizmaster:publish-package', { packageId: 'valid-pkg' })

      clientSocket.on('package:published', (data) => {
        expect(data.packageId).toBeDefined()
        expect(data.versionNumber).toBeGreaterThan(0)
        done()
      })
    })

    it('should emit error for invalid package', (done) => {
      clientSocket.emit('quizmaster:publish-package', { packageId: 'invalid-pkg' })

      clientSocket.on('package:publish-error', (data) => {
        expect(data.error).toBeDefined()
        done()
      })
    })
  })

  describe('quizmaster:delete-question', () => {
    it('should delete question from round', (done) => {
      clientSocket.emit('quizmaster:delete-question', {
        packageId: 'pkg1',
        roundIndex: 0,
        questionIndex: 1,
      })

      clientSocket.on('question:deleted', (data) => {
        expect(data.roundIndex).toBe(0)
        expect(data.questionIndex).toBe(1)
        done()
      })
    })
  })

  describe('quizmaster:set-tiebreaker', () => {
    it('should set tiebreaker question', (done) => {
      const question = {
        id: 'q123',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      clientSocket.emit('quizmaster:set-tiebreaker', {
        packageId: 'pkg1',
        question,
      })

      clientSocket.on('tiebreaker:set', (data) => {
        expect(data.questionId).toBe('q123')
        done()
      })
    })
  })
})
