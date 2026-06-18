/**
 * Manual team entry domain logic - enables phone-less team registration.
 * Hosts can manually add teams without requiring QR code or join token.
 */

import type { GameStateSnapshot } from './game-state'

export interface ManualTeam {
  id: string
  name: string
  status: 'active' | 'soft_removed'
  answers: Record<number, Record<number, any>>
  scores: Record<number, Record<number, number>>
  isManual?: boolean
  teamToken?: string
}

export function createManualTeam(hostId: string, teamName: string): ManualTeam {
  return {
    id: `t_manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: teamName,
    status: 'active',
    answers: {},
    scores: {},
    isManual: true,
  }
}

export function isManualTeamEligibleToScore(team: ManualTeam): boolean {
  return team.status === 'active'
}

export function assignManualScores(
  gameState: GameStateSnapshot,
  teamId: string,
  roundIndex: number,
  scores: Record<number, number>
): GameStateSnapshot {
  const teams = gameState.teams.map((team) => {
    if (team.id !== teamId) return team

    return {
      ...team,
      scores: {
        ...team.scores,
        [roundIndex]: scores,
      },
    }
  })

  return {
    ...gameState,
    teams,
  }
}
