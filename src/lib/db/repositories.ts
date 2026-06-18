/**
 * Database repositories for QuizWiz.
 * Handle all Prisma operations and data persistence.
 */

import { prisma } from './prisma'
import { GameStateSnapshot, RoundState } from '../domain/game-state'

/**
 * Game repository
 */
export const gameRepo = {
  async create(input: {
    hostId: string
    hostName: string
    venueName: string
    sessionToken: string
    boardToken: string
    manualJoinCode: string
    packageSnapshot: object
  }) {
    return prisma.game.create({
      data: input,
      include: { teams: true, rounds: true },
    })
  },

  async findBySessionToken(sessionToken: string) {
    return prisma.game.findUnique({
      where: { sessionToken },
      include: { teams: true, rounds: { include: { questions: true } }, scores: true },
    })
  },

  async findByBoardToken(boardToken: string) {
    return prisma.game.findUnique({
      where: { boardToken },
      include: { teams: true, rounds: true, scores: true },
    })
  },

  async updateStatus(gameId: string, status: string) {
    return prisma.game.update({
      where: { id: gameId },
      data: { status },
    })
  },

  async delete(gameId: string) {
    return prisma.game.delete({
      where: { id: gameId },
    })
  },
}

/**
 * Team repository
 */
export const teamRepo = {
  async create(input: { gameId: string; name: string; teamToken: string }) {
    return prisma.team.create({
      data: input,
    })
  },

  async findByToken(teamToken: string) {
    return prisma.team.findUnique({
      where: { teamToken },
      include: { game: true },
    })
  },

  async findByGameId(gameId: string) {
    return prisma.team.findMany({
      where: { gameId, status: 'active' },
      include: { answers: true, scores: true },
    })
  },

  async updateName(teamId: string, name: string) {
    return prisma.team.update({
      where: { id: teamId },
      data: { name },
    })
  },

  async softRemove(teamId: string) {
    return prisma.team.update({
      where: { id: teamId },
      data: { status: 'soft_removed' },
    })
  },

  async restore(teamId: string) {
    return prisma.team.update({
      where: { id: teamId },
      data: { status: 'active' },
    })
  },
}

/**
 * Answer repository (submission tracking)
 */
export const answerRepo = {
  async upsert(input: {
    teamId: string
    roundId: string
    questionId: string
    text: string
    musicalArtist?: string
    musicalYear?: string
    isDraft?: boolean
  }) {
    return prisma.answer.upsert({
      where: {
        teamId_roundId_questionId: {
          teamId: input.teamId,
          roundId: input.roundId,
          questionId: input.questionId,
        },
      },
      update: {
        text: input.text,
        musicalArtist: input.musicalArtist,
        musicalYear: input.musicalYear,
        isDraft: input.isDraft ?? false,
        submittedAt: input.isDraft ? null : new Date(),
      },
      create: input,
    })
  },

  async findByRound(roundId: string) {
    return prisma.answer.findMany({
      where: { roundId },
      include: { team: true, question: true },
    })
  },

  async findByTeamRound(teamId: string, roundId: string) {
    return prisma.answer.findMany({
      where: { teamId, roundId },
      include: { question: true },
    })
  },
}

/**
 * Score repository (grading)
 */
export const scoreRepo = {
  async upsert(input: { gameId: string; teamId: string; questionId: string; points: number }) {
    return prisma.score.upsert({
      where: {
        gameId_teamId_questionId: {
          gameId: input.gameId,
          teamId: input.teamId,
          questionId: input.questionId,
        },
      },
      update: { points: input.points },
      create: input,
    })
  },

  async findByGame(gameId: string) {
    return prisma.score.findMany({
      where: { gameId },
      include: { team: true, question: true },
    })
  },

  async findByTeam(teamId: string) {
    return prisma.score.findMany({
      where: { teamId },
      include: { question: true },
    })
  },

  async deleteByQuestion(questionId: string) {
    return prisma.score.deleteMany({
      where: { questionId },
    })
  },
}

/**
 * Prisma client export
 */
export { prisma }
