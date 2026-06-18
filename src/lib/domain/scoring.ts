/**
 * Pure scoring logic for QuizWiz.
 * All functions are deterministic and testable without side effects.
 */

import { TeamScore, GameRanking, Round } from './models'

/**
 * Calculate total points for a team across all questions and rounds.
 */
export function calculateTeamTotal(
  teamScores: {
    [roundIndex: number]: {
      [questionIndex: number]: number
    }
  }
): number {
  let total = 0

  for (const roundScores of Object.values(teamScores)) {
    for (const points of Object.values(roundScores)) {
      total += points
    }
  }

  return total
}

/**
 * Sort teams by total score (descending).
 * Return with rank assignment, handling ties.
 */
export function rankTeams(teams: TeamScore[]): GameRanking {
  // Sort by total points descending
  const sorted = [...teams].sort((a, b) => b.totalPoints - a.totalPoints)

  // Assign ranks, handling ties
  const ranked: (TeamScore & { rank: number | string })[] = []
  const tiedTeamIds = new Set<string>()
  let currentRank = 1

  for (let i = 0; i < sorted.length; i++) {
    const team = sorted[i]

    // Update rank when points change
    if (i > 0 && sorted[i].totalPoints !== sorted[i - 1].totalPoints) {
      currentRank = i + 1
    }

    // Check if this team is tied with adjacent teams
    const hasTieNext = i + 1 < sorted.length && sorted[i].totalPoints === sorted[i + 1].totalPoints
    const hasTiePrev = i > 0 && sorted[i].totalPoints === sorted[i - 1].totalPoints

    const isTied = hasTieNext || hasTiePrev
    const rank = isTied ? `T-${currentRank}` : currentRank

    if (isTied) {
      tiedTeamIds.add(team.teamId)
    }

    ranked.push({
      ...team,
      rank,
    })
  }

  return { teams: ranked, tiedTeamIds }
}

/**
 * Detect teams tied for a prize position (e.g., rank 1-3 for typical prizes).
 * Returns the set of team IDs that are tied for any prize position.
 */
export function detectTieForPrize(
  rankedTeams: (TeamScore & { rank: number | string })[],
  prizePositions: number[] = [1, 2, 3]
): Set<string> {
  const tiedForPrize = new Set<string>()

  for (const prizePos of prizePositions) {
    const teamAtPrize = rankedTeams.find(
      (t) => (typeof t.rank === 'number' && t.rank === prizePos) || t.rank === `T-${prizePos}`
    )

    if (teamAtPrize) {
      const pointsAtPrize = teamAtPrize.totalPoints
      // Find all teams with the same score (tied teams)
      const tiedTeams = rankedTeams.filter((t) => t.totalPoints === pointsAtPrize)

      // Only add if there's actually a tie (more than 1 team)
      if (tiedTeams.length > 1) {
        for (const team of tiedTeams) {
          tiedForPrize.add(team.teamId)
        }
      }
    }
  }

  return tiedForPrize
}

/**
 * Validate a score based on question type.
 * Returns true if the score is valid for that question type.
 */
export function isValidScore(
  questionType: string,
  score: number | { artist: number; year: number }
): boolean {
  if (questionType === 'musical') {
    if (typeof score === 'object') {
      const { artist, year } = score
      return (artist === 0 || artist === 1 || artist === 2) && (year === 0 || year === 1 || year === 2)
    }
    return false
  }

  if (typeof score === 'number') {
    // Allow 0, 1, 2 for standard, or any non-negative integer for custom/bonus
    return score >= 0
  }

  return false
}

/**
 * Compute a team's score for a round.
 */
export function calculateRoundScore(
  roundScores: {
    [questionIndex: number]: number
  }
): number {
  let total = 0
  for (const points of Object.values(roundScores)) {
    total += points
  }
  return total
}
