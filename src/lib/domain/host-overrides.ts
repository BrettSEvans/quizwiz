/**
 * Host overrides domain logic - flexible operations for live gameplay.
 * Supports voiding questions, awarding all teams, and manual scoring.
 */

import type { GameStateSnapshot } from './game-state'

export interface HostOverrideMap {
  voidedQuestions?: Record<string, boolean>
  awardedQuestions?: Record<string, number>
  manualScores?: Record<string, number>
  lateSyncApprovals?: Record<string, Date>
}

export interface HostOverrideResult {
  gameState: GameStateSnapshot
  overrides: HostOverrideMap
}

export function voidQuestion(
  gameState: GameStateSnapshot,
  overrides: HostOverrideMap,
  roundIndex: number,
  questionIndex: number
): HostOverrideResult {
  const key = `${roundIndex}:${questionIndex}`

  const teams = gameState.teams.map((team) => ({
    ...team,
    scores: {
      ...team.scores,
      [roundIndex]: {
        ...team.scores[roundIndex],
        [questionIndex]: undefined,
      },
    },
  }))

  return {
    gameState: { ...gameState, teams },
    overrides: {
      ...overrides,
      voidedQuestions: {
        ...overrides.voidedQuestions,
        [key]: true,
      },
    },
  }
}

export function awardAllTeams(
  gameState: GameStateSnapshot,
  overrides: HostOverrideMap,
  roundIndex: number,
  questionIndex: number,
  points: number
): HostOverrideResult {
  const key = `${roundIndex}:${questionIndex}`

  const teams = gameState.teams.map((team) => ({
    ...team,
    scores: {
      ...team.scores,
      [roundIndex]: {
        ...team.scores[roundIndex],
        [questionIndex]: points,
      },
    },
  }))

  return {
    gameState: { ...gameState, teams },
    overrides: {
      ...overrides,
      awardedQuestions: {
        ...overrides.awardedQuestions,
        [key]: points,
      },
    },
  }
}

export function createManualScore(
  gameState: GameStateSnapshot,
  overrides: HostOverrideMap,
  teamId: string,
  roundIndex: number,
  questionIndex: number,
  points: number
): HostOverrideResult {
  const key = `${teamId}:${roundIndex}:${questionIndex}`

  const teams = gameState.teams.map((team) => {
    if (team.id !== teamId) return team

    return {
      ...team,
      scores: {
        ...team.scores,
        [roundIndex]: {
          ...team.scores[roundIndex],
          [questionIndex]: points,
        },
      },
    }
  })

  return {
    gameState: { ...gameState, teams },
    overrides: {
      ...overrides,
      manualScores: {
        ...overrides.manualScores,
        [key]: points,
      },
    },
  }
}

export function approveLateSyncWithOverride(
  gameState: GameStateSnapshot,
  overrides: HostOverrideMap,
  teamId: string,
  roundIndex: number,
  approvedAt: Date
): HostOverrideResult {
  const key = `${teamId}:${roundIndex}`

  return {
    gameState,
    overrides: {
      ...overrides,
      lateSyncApprovals: {
        ...overrides.lateSyncApprovals,
        [key]: approvedAt,
      },
    },
  }
}
