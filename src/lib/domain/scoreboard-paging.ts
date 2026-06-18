/**
 * Scoreboard paging domain logic - handles 50+ teams with pagination and overflow display.
 * Supports auto-cycling through pages and truncated "and X more" display.
 */

import type { TeamScore } from './models'

export interface PaginatedResult {
  teams: Array<TeamScore & { rank: number | string }>
  totalPages: number
  currentPage: number
}

export interface TruncatedResult {
  visible: Array<TeamScore & { rank: number | string }>
  moreCount: number
}

export interface HighlightedTeam extends TeamScore {
  rank: number | string
  isTiebreakerCandidate?: boolean
}

export function paginate(
  teams: Array<TeamScore & { rank: number | string }>,
  pageSize: number,
  currentPage: number
): PaginatedResult {
  const totalPages = Math.ceil(teams.length / pageSize)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = startIdx + pageSize

  return {
    teams: teams.slice(startIdx, endIdx),
    totalPages,
    currentPage,
  }
}

export function getTruncatedBoard(
  teams: Array<TeamScore & { rank: number | string }>,
  maxVisible: number
): TruncatedResult {
  if (teams.length <= maxVisible) {
    return {
      visible: teams,
      moreCount: 0,
    }
  }

  return {
    visible: teams.slice(0, maxVisible),
    moreCount: teams.length - maxVisible,
  }
}

export function highlightTiebreakerTeams(
  teams: Array<TeamScore & { rank: number | string }>,
  prizePositions: number[]
): HighlightedTeam[] {
  return teams.map((team) => {
    const rankNum = typeof team.rank === 'string' ? parseInt(team.rank.replace(/[^0-9]/g, '')) : team.rank
    const isTied = typeof team.rank === 'string' && team.rank.startsWith('T-')
    const isTiebreakerCandidate =
      isTied && prizePositions.includes(rankNum)

    return {
      ...team,
      isTiebreakerCandidate,
    }
  })
}

export interface PageCycle {
  page: number
  teams: Array<TeamScore & { rank: number | string }>
}

export function generatePageCycle(
  teams: Array<TeamScore & { rank: number | string }>,
  pageSize: number,
  cycleIntervalMs: number = 10000
): PageCycle[] {
  const totalPages = Math.ceil(teams.length / pageSize)
  const cycle: PageCycle[] = []

  for (let page = 1; page <= totalPages; page++) {
    const result = paginate(teams, pageSize, page)
    cycle.push({
      page,
      teams: result.teams,
    })
  }

  return cycle
}
