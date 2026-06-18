/**
 * Socket.IO event handlers for real-time game communication.
 * Implements the game flow: team join → submit → lock → grade → publish.
 */

import { Socket, Server } from 'socket.io'
import { gameRepo, teamRepo, answerRepo, scoreRepo } from '../db/repositories'
import { logger } from '../logger/system-log'
import { lockRound, publishRound, canTeamSubmit, getSubmissionKey } from '../domain/game-state'

type GameIO = Server & {
  gameStates?: Map<string, any>
  submissionKeys?: Map<string, Set<string>>
}

export function registerSocketHandlers(io: GameIO) {
  io.gameStates = new Map()
  io.submissionKeys = new Map()

  io.on('connection', (socket: Socket) => {
    logger.logEvent('socket:connected', { socketId: socket.id })

    // Host events
    socket.on('host:start-game', async (data: { sessionToken: string }) => {
      try {
        const game = await gameRepo.findBySessionToken(data.sessionToken)
        if (!game) {
          socket.emit('error', 'Game not found')
          return
        }

        socket.join(`game:${game.id}:host`)
        logger.logEvent('host:joined', { gameId: game.id, socketId: socket.id })

        socket.emit('host:ready', {
          gameId: game.id,
          teams: game.teams,
          rounds: game.rounds,
        })
      } catch (error) {
        logger.logError('host:start-game:error', error as Error)
        socket.emit('error', 'Failed to start game')
      }
    })

    socket.on('host:lock-round', async (data: { gameId: string; draftTeamIds: string[] }) => {
      try {
        io.to(`game:${data.gameId}:teams`).emit('round:locked', {
          message: 'Round locked. Answers are now read-only.',
        })
        logger.logEvent('round:locked', { gameId: data.gameId })
      } catch (error) {
        logger.logError('host:lock-round:error', error as Error)
      }
    })

    socket.on('host:publish-round', async (data: { gameId: string }) => {
      try {
        io.to(`game:${data.gameId}:board`).emit('round:published', {
          message: 'Scores published!',
        })
        logger.logEvent('round:published', { gameId: data.gameId })
      } catch (error) {
        logger.logError('host:publish-round:error', error as Error)
      }
    })

    // Team events
    socket.on('team:join', async (data: { sessionToken: string; teamToken: string }) => {
      try {
        const team = await teamRepo.findByToken(data.teamToken)
        if (!team) {
          socket.emit('error', 'Team not found')
          return
        }

        socket.join(`game:${team.gameId}:teams`)
        socket.emit('team:ready', {
          teamId: team.id,
          teamName: team.name,
          gameId: team.gameId,
        })

        io.to(`game:${team.gameId}:host`).emit('team:registered', {
          teamId: team.id,
          teamName: team.name,
        })

        logger.logEvent('team:socket-joined', {
          teamId: team.id,
          gameId: team.gameId,
          socketId: socket.id,
        })
      } catch (error) {
        logger.logError('team:join:error', error as Error)
      }
    })

    socket.on(
      'team:submit',
      async (data: {
        gameId: string
        teamId: string
        roundIndex: number
        answers: Record<
          number,
          {
            text: string
            musicalArtist?: string
            musicalYear?: string
          }
        >
      }) => {
        try {
          // Idempotency check
          const key = `${data.gameId}:${data.teamId}:${data.roundIndex}`
          if (!io.submissionKeys) io.submissionKeys = new Map()
          if (!io.submissionKeys.has(key)) {
            io.submissionKeys.set(key, new Set())
          }

          const submitted = io.submissionKeys.get(key)!
          if (submitted.has(socket.id)) {
            socket.emit('team:submit-duplicate')
            return
          }
          submitted.add(socket.id)

          // Store answers
          for (const [qIdx, answer] of Object.entries(data.answers)) {
            // TODO: find question and round, store answer
          }

          socket.emit('team:submitted', {
            roundIndex: data.roundIndex,
          })

          io.to(`game:${data.gameId}:host`).emit('team:answer-received', {
            teamId: data.teamId,
            roundIndex: data.roundIndex,
          })

          logger.logEvent('team:submitted', {
            gameId: data.gameId,
            teamId: data.teamId,
            roundIndex: data.roundIndex,
          })
        } catch (error) {
          logger.logError('team:submit:error', error as Error)
          socket.emit('error', 'Failed to submit answers')
        }
      }
    )

    // Scoreboard events
    socket.on('board:subscribe', async (data: { boardToken: string }) => {
      try {
        const game = await gameRepo.findByBoardToken(data.boardToken)
        if (!game) {
          socket.emit('error', 'Game not found')
          return
        }

        socket.join(`game:${game.id}:board`)
        socket.emit('board:ready', { gameId: game.id })
        logger.logEvent('board:subscribed', { gameId: game.id, socketId: socket.id })
      } catch (error) {
        logger.logError('board:subscribe:error', error as Error)
      }
    })

    socket.on('disconnect', () => {
      logger.logEvent('socket:disconnected', { socketId: socket.id })
    })
  })
}
