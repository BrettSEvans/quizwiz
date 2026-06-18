/**
 * Team management domain logic - operations for removing, restoring, and renaming teams.
 * Supports operational flexibility for live bar gameplay.
 */

import type { GameStateSnapshot } from './game-state'
import { rankTeams, type TeamScore } from './scoring'

export interface TeamWithStatus {
  id: string
  name: string
  status: 'active' | 'soft_removed'
  answers: Record<number, Record<number, any>>
  scores: Record<number, Record<number, number>>
}

export function softRemoveTeam(
  gameState: GameStateSnapshot,
  teamId: string
): GameStateSnapshot {
  const teams = gameState.teams.map((t) =>
    t.id === teamId ? { ...t, status: 'soft_removed' as const } : t
  )

  return {
    ...gameState,
    teams,
  }
}

export function restoreTeam(gameState: GameStateSnapshot, teamId: string): GameStateSnapshot {
  const teams = gameState.teams.map((t) =>
    t.id === teamId ? { ...t, status: 'active' as const } : t
  )

  return {
    ...gameState,
    teams,
  }
}

export function renameTeam(
  gameState: GameStateSnapshot,
  teamId: string,
  newName: string
): GameStateSnapshot | { error: string } {
  // Check if name is already taken by another active team
  const duplicate = gameState.teams.some((t) => t.id !== teamId && t.name === newName && t.status === 'active')

  if (duplicate) {
    return { error: `Team name "${newName}" already exists` }
  }

  const teams = gameState.teams.map((t) => (t.id === teamId ? { ...t, name: newName } : t))

  return {
    ...gameState,
    teams,
  }
}

export function getActiveTeams(gameState: GameStateSnapshot): TeamWithStatus[] {
  return gameState.teams.filter((t) => t.status === 'active')
}

export function calculateScoresExcluding(
  gameState: GameStateSnapshot,
  excludeTeamIds: string[]
): { teams: Array<TeamScore & { rank: number | string }>; tiedTeamIds: Set<string> } {
  const activeTeams = gameState.teams
    .filter((t) => t.status === 'active' && !excludeTeamIds.includes(t.id))
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      totalPoints: calculateTotal(t.scores),
      scores: t.scores,
    }))

  return rankTeams(activeTeams)
}

function calculateTotal(scores: Record<number, Record<number, number>>): number {
  let total = 0
  for (const roundScores of Object.values(scores)) {
    for (const points of Object.values(roundScores)) {
      total += points
    }
  }
  return total
}
