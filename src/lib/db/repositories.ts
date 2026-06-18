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
 * Quizmaster repository
 */
export const quizmasterRepo = {
  async create(input: { email: string; passwordHash: string; name: string; invitedBy?: string }) {
    return prisma.quizmaster.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        invitedBy: input.invitedBy || null,
      },
    })
  },

  async findByEmail(email: string) {
    return prisma.quizmaster.findUnique({
      where: { email },
      include: { hosts: true, archives: true },
    })
  },

  async findById(id: string) {
    return prisma.quizmaster.findUnique({
      where: { id },
      include: { hosts: true, archives: true },
    })
  },

  async softDelete(id: string) {
    return prisma.quizmaster.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },

  async restore(id: string) {
    return prisma.quizmaster.update({
      where: { id },
      data: { deletedAt: null },
    })
  },
}

/**
 * QuizmasterInvite repository
 */
export const inviteRepo = {
  async create(input: {
    quizmasterId: string
    inviteCode: string
    inviteEmail?: string
    inviteType: 'email' | 'manual_code'
    expiresAt: Date
  }) {
    return prisma.quizmasterInvite.create({
      data: {
        quizmasterId: input.quizmasterId,
        inviteCode: input.inviteCode,
        inviteEmail: input.inviteEmail || null,
        inviteType: input.inviteType,
        expiresAt: input.expiresAt,
      },
    })
  },

  async findByCode(code: string) {
    return prisma.quizmasterInvite.findUnique({
      where: { inviteCode: code },
    })
  },

  async findPendingByEmail(email: string) {
    return prisma.quizmasterInvite.findMany({
      where: {
        inviteEmail: email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
  },

  async markAccepted(code: string, acceptedBy: string) {
    return prisma.quizmasterInvite.update({
      where: { inviteCode: code },
      data: {
        acceptedAt: new Date(),
        acceptedBy,
      },
    })
  },
}

/**
 * Host repository
 */
export const hostRepo = {
  async create(input: {
    quizmasterId: string
    email: string
    name: string
    passwordHash: string
    inviteCode?: string
  }) {
    return prisma.host.create({
      data: {
        quizmasterId: input.quizmasterId,
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        inviteCode: input.inviteCode || null,
      },
    })
  },

  async findById(id: string) {
    return prisma.host.findUnique({
      where: { id },
    })
  },

  async findByEmail(quizmasterId: string, email: string) {
    return prisma.host.findUnique({
      where: { quizmasterId_email: { quizmasterId, email } },
    })
  },

  async findByQuizmaster(quizmasterId: string, statusFilter?: string) {
    const where: any = { quizmasterId }
    if (statusFilter) {
      where.status = statusFilter
    }
    return prisma.host.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  },

  async findActiveByQuizmaster(quizmasterId: string) {
    return prisma.host.findMany({
      where: {
        quizmasterId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async updateNotes(id: string, notes: string) {
    return prisma.host.update({
      where: { id },
      data: { notes },
    })
  },

  async updateContactInfo(id: string, contactInfo: any) {
    return prisma.host.update({
      where: { id },
      data: { contactInfo },
    })
  },

  async disable(id: string) {
    return prisma.host.update({
      where: { id },
      data: { status: 'disabled', disabledAt: new Date() },
    })
  },

  async enable(id: string) {
    return prisma.host.update({
      where: { id },
      data: { status: 'active', enabledAt: new Date(), disabledAt: null },
    })
  },

  async softDelete(id: string) {
    return prisma.host.update({
      where: { id },
      data: { status: 'soft_removed', deletedAt: new Date() },
    })
  },

  async restore(id: string) {
    return prisma.host.update({
      where: { id },
      data: { status: 'active', deletedAt: null },
    })
  },
}

/**
 * GameArchive repository
 */
export const archiveRepo = {
  async create(input: {
    quizmasterId: string
    venueName: string
    hostName: string
    gameDate: Date
    snapshot: object
  }) {
    return prisma.gameArchive.create({
      data: input,
    })
  },

  async findByQuizmaster(quizmasterId: string, limit = 20, offset = 0) {
    return prisma.gameArchive.findMany({
      where: { quizmasterId, deletedAt: null },
      orderBy: { gameDate: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  async findById(id: string) {
    return prisma.gameArchive.findUnique({
      where: { id },
    })
  },

  async softDelete(id: string) {
    return prisma.gameArchive.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },
}

/**
 * Prisma client export
 */
export { prisma }
