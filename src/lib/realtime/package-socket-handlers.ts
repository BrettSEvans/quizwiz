/**
 * Socket.IO handlers for Quizmaster package authoring.
 * Enables real-time package creation, editing, and publishing.
 */

import { Socket, Server } from 'socket.io'
import { logger } from '../logger/system-log'
import * as packageRepo from '../db/package-repositories'
import * as packageAuthoring from '../domain/package-authoring'
import * as packagePublishing from '../domain/package-publishing'

export function registerPackageSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // Quizmaster creates a new package
    socket.on('quizmaster:create-package', async (data: { quizmasterId: string; name: string }) => {
      try {
        const pkg = await packageRepo.create(data.quizmasterId, data.name)
        socket.emit('package:created', {
          packageId: pkg.id,
          name: pkg.name,
          status: pkg.status,
        })
        logger.logEvent('package:created', { packageId: pkg.id, quizmasterId: data.quizmasterId })
      } catch (error) {
        logger.logError('quizmaster:create-package:error', error as Error)
        socket.emit('error', 'Failed to create package')
      }
    })

    // Save a round to package
    socket.on(
      'quizmaster:save-round',
      async (data: { packageId: string; roundIndex: number; roundName: string; roundType: string }) => {
        try {
          const pkg = await packageRepo.findById(data.packageId)
          if (!pkg) {
            socket.emit('error', 'Package not found')
            return
          }

          const current = pkg.data as packageAuthoring.DraftPackage
          const updated = packageAuthoring.addRound(
            current,
            data.roundIndex,
            data.roundName,
            data.roundType as any
          )

          await packageRepo.update(data.packageId, updated)

          socket.emit('round:saved', {
            roundIndex: data.roundIndex,
            roundName: data.roundName,
          })

          logger.logEvent('round:saved', { packageId: data.packageId, roundIndex: data.roundIndex })
        } catch (error) {
          logger.logError('quizmaster:save-round:error', error as Error)
          socket.emit('error', 'Failed to save round')
        }
      }
    )

    // Save a question to a round
    socket.on(
      'quizmaster:save-question',
      async (data: {
        packageId: string
        roundIndex: number
        questionIndex: number
        text: string
        type: string
        labels?: { artistLabel: string; yearLabel: string }
      }) => {
        try {
          const pkg = await packageRepo.findById(data.packageId)
          if (!pkg) {
            socket.emit('error', 'Package not found')
            return
          }

          const current = pkg.data as packageAuthoring.DraftPackage
          const updated = packageAuthoring.addQuestion(
            current,
            data.roundIndex,
            data.questionIndex,
            data.text,
            data.type as any,
            data.labels
          )

          await packageRepo.update(data.packageId, updated)

          socket.emit('question:saved', {
            roundIndex: data.roundIndex,
            questionIndex: data.questionIndex,
            text: data.text,
            type: data.type,
            labels: data.labels,
          })

          logger.logEvent('question:saved', {
            packageId: data.packageId,
            roundIndex: data.roundIndex,
            questionIndex: data.questionIndex,
          })
        } catch (error) {
          logger.logError('quizmaster:save-question:error', error as Error)
          socket.emit('error', 'Failed to save question')
        }
      }
    )

    // Delete a question
    socket.on(
      'quizmaster:delete-question',
      async (data: { packageId: string; roundIndex: number; questionIndex: number }) => {
        try {
          const pkg = await packageRepo.findById(data.packageId)
          if (!pkg) {
            socket.emit('error', 'Package not found')
            return
          }

          const current = pkg.data as packageAuthoring.DraftPackage
          const updated = packageAuthoring.deleteQuestion(current, data.roundIndex, data.questionIndex)

          await packageRepo.update(data.packageId, updated)

          socket.emit('question:deleted', {
            roundIndex: data.roundIndex,
            questionIndex: data.questionIndex,
          })

          logger.logEvent('question:deleted', {
            packageId: data.packageId,
            roundIndex: data.roundIndex,
            questionIndex: data.questionIndex,
          })
        } catch (error) {
          logger.logError('quizmaster:delete-question:error', error as Error)
          socket.emit('error', 'Failed to delete question')
        }
      }
    )

    // Delete a round
    socket.on('quizmaster:delete-round', async (data: { packageId: string; roundIndex: number }) => {
      try {
        const pkg = await packageRepo.findById(data.packageId)
        if (!pkg) {
          socket.emit('error', 'Package not found')
          return
        }

        const current = pkg.data as packageAuthoring.DraftPackage
        const updated = packageAuthoring.deleteRound(current, data.roundIndex)

        await packageRepo.update(data.packageId, updated)

        socket.emit('round:deleted', {
          roundIndex: data.roundIndex,
        })

        logger.logEvent('round:deleted', { packageId: data.packageId, roundIndex: data.roundIndex })
      } catch (error) {
        logger.logError('quizmaster:delete-round:error', error as Error)
        socket.emit('error', 'Failed to delete round')
      }
    })

    // Set tiebreaker
    socket.on(
      'quizmaster:set-tiebreaker',
      async (data: { packageId: string; question: packageAuthoring.Question }) => {
        try {
          const pkg = await packageRepo.findById(data.packageId)
          if (!pkg) {
            socket.emit('error', 'Package not found')
            return
          }

          const current = pkg.data as packageAuthoring.DraftPackage
          const updated = packageAuthoring.setTiebreaker(current, data.question)

          await packageRepo.update(data.packageId, updated)

          socket.emit('tiebreaker:set', {
            questionId: data.question.id,
          })

          logger.logEvent('tiebreaker:set', { packageId: data.packageId, questionId: data.question.id })
        } catch (error) {
          logger.logError('quizmaster:set-tiebreaker:error', error as Error)
          socket.emit('error', 'Failed to set tiebreaker')
        }
      }
    )

    // Validate package
    socket.on('quizmaster:validate-package', async (data: { packageId: string }) => {
      try {
        const pkg = await packageRepo.findById(data.packageId)
        if (!pkg) {
          socket.emit('package:validation', {
            valid: false,
            errors: ['Package not found'],
          })
          return
        }

        const current = pkg.data as packageAuthoring.DraftPackage
        const result = packageAuthoring.validatePackage(current)

        socket.emit('package:validation', {
          valid: result.valid,
          errors: result.errors,
        })

        logger.logEvent('package:validation', {
          packageId: data.packageId,
          valid: result.valid,
        })
      } catch (error) {
        logger.logError('quizmaster:validate-package:error', error as Error)
        socket.emit('error', 'Failed to validate package')
      }
    })

    // Publish package
    socket.on('quizmaster:publish-package', async (data: { packageId: string }) => {
      try {
        const pkg = await packageRepo.findById(data.packageId)
        if (!pkg) {
          socket.emit('package:publish-error', { error: 'Package not found' })
          return
        }

        const current = pkg.data as packageAuthoring.DraftPackage
        const validation = packageAuthoring.validatePackage(current)

        if (!validation.valid) {
          socket.emit('package:publish-error', {
            error: 'Cannot publish invalid package',
            validationErrors: validation.errors,
          })
          return
        }

        // Freeze and publish
        const frozen = packageAuthoring.freezeForGameStart(current, new Date())
        const published = packagePublishing.publishPackage(frozen)

        const publishedPkg = await packageRepo.publish(data.packageId)

        socket.emit('package:published', {
          packageId: publishedPkg.id,
          versionNumber: 1,
          publishedAt: new Date(),
        })

        logger.logEvent('package:published', { packageId: data.packageId })
      } catch (error) {
        logger.logError('quizmaster:publish-package:error', error as Error)
        socket.emit('package:publish-error', { error: 'Failed to publish package' })
      }
    })
  })
}
