/**
 * Scoreboard breakdown domain logic - displays per-round scores and tiebreaker info.
 * Formats ranking data for display with detailed breakdowns.
 */

import type { GameRanking, Question } from './models'

export interface TiebreakerView {
  isTiebreaker: boolean
  tiedTeamCount: number
  tiedAtPrizePosition: boolean
  tiebreaker: Question
  tiedTeamIds: string[]
}

export interface FormattedBoard {
  teams: Array<{
    rank: number | string
    teamName: string
    totalScore: number
    roundTotals: Record<number, number>
  }>
  tiebreaker: Question
}

export function calculatePerRoundTotals(
  gameState: any,
  teamId: string
): Record<number, number> {
  const team = gameState.teams.find((t: any) => t.id === teamId)
  if (!team) return {}

  const totals: Record<number, number> = {}

  for (const [roundIndex, roundScores] of Object.entries(team.scores || {})) {
    const roundNum = parseInt(roundIndex)
    const total = Object.values(roundScores as Record<number, number>).reduce(
      (sum, points) => sum + (points || 0),
      0
    )
    totals[roundNum] = total
  }

  return totals
}

export function getRoundBreakdown(
  gameState: any,
  teamId: string,
  roundIndex: number
): Record<number, number> {
  const team = gameState.teams.find((t: any) => t.id === teamId)
  if (!team || !team.scores || !team.scores[roundIndex]) return {}

  return team.scores[roundIndex]
}

export function getTiebreakerStatus(
  ranking: GameRanking,
  tiebreaker: Question
): TiebreakerView {
  const tiedTeamIds = Array.from(ranking.tiedTeamIds)
  const tiedAtPrizePosition = tiedTeamIds.some((id) => {
    const team = ranking.teams.find((t) => t.teamId === id)
    const rank = team?.rank
    return rank === 1 || rank === '1' || (typeof rank === 'string' && rank.includes('T-1'))
  })

  return {
    isTiebreaker: true,
    tiedTeamCount: tiedTeamIds.length,
    tiedAtPrizePosition,
    tiebreaker,
    tiedTeamIds,
  }
}

export function formatScoreboard(
  ranking: GameRanking,
  tiebreaker: Question
): FormattedBoard {
  const formattedTeams = ranking.teams.map((team) => {
    const roundTotals: Record<number, number> = {}
    for (const [roundIndex, questionScores] of Object.entries(team.scores)) {
      const roundNum = parseInt(roundIndex)
      const total = Object.values(questionScores as Record<number, number>).reduce(
        (sum, points) => sum + (points || 0),
        0
      )
      roundTotals[roundNum] = total
    }

    return {
      rank: team.rank,
      teamName: team.teamName,
      totalScore: team.totalPoints,
      roundTotals,
    }
  })

  return {
    teams: formattedTeams,
    tiebreaker,
  }
}
