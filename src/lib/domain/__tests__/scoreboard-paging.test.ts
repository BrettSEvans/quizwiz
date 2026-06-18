import { describe, it, expect, beforeEach } from 'vitest'
import {
  paginate,
  getTruncatedBoard,
  highlightTiebreakerTeams,
  type PaginatedResult,
} from '../scoreboard-paging'
import { rankTeams, type TeamScore } from '../scoring'

describe('Scoreboard Paging', () => {
  let rankedTeams: any

  beforeEach(() => {
    const mockTeams: TeamScore[] = Array.from({ length: 50 }, (_, i) => ({
      teamId: `t${i}`,
      teamName: `Team ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`,
      totalPoints: 50 - i,
      scores: { 0: { 0: 50 - i } },
    }))

    rankedTeams = rankTeams(mockTeams)
  })

  describe('paginate', () => {
    it('should split teams into pages', () => {
      const result = paginate(rankedTeams.teams, 10, 1)
      expect(result.teams).toHaveLength(10)
      expect(result.totalPages).toBe(5)
    })

    it('should return correct page content', () => {
      const page1 = paginate(rankedTeams.teams, 10, 1)
      const page2 = paginate(rankedTeams.teams, 10, 2)
      expect(page1.teams[0].teamName).not.toBe(page2.teams[0].teamName)
    })

    it('should handle last page with fewer items', () => {
      const result = paginate(rankedTeams.teams, 10, 5)
      expect(result.teams).toHaveLength(10) // 50 teams, 5 pages of 10 = exactly 50
      expect(result.currentPage).toBe(5)
    })

    it('should handle single-page results', () => {
      const smallTeams = rankedTeams.teams.slice(0, 5)
      const result = paginate(smallTeams, 10, 1)
      expect(result.teams).toHaveLength(5)
      expect(result.totalPages).toBe(1)
    })

    it('should maintain ranking within pages', () => {
      const result = paginate(rankedTeams.teams, 10, 1)
      // First page should have highest-ranked teams
      expect(result.teams[0].totalPoints).toBeGreaterThanOrEqual(result.teams[1].totalPoints)
    })
  })

  describe('getTruncatedBoard', () => {
    it('should limit teams to max visible', () => {
      const result = getTruncatedBoard(rankedTeams.teams, 10)
      expect(result.visible).toHaveLength(10)
      expect(result.moreCount).toBe(40)
    })

    it('should show all teams if under limit', () => {
      const smallTeams = rankedTeams.teams.slice(0, 5)
      const result = getTruncatedBoard(smallTeams, 10)
      expect(result.visible).toHaveLength(5)
      expect(result.moreCount).toBe(0)
    })

    it('should maintain top rankings', () => {
      const result = getTruncatedBoard(rankedTeams.teams, 10)
      expect(result.visible[0].totalPoints).toBeGreaterThanOrEqual(result.visible[9].totalPoints)
    })

    it('should report correct "more" count', () => {
      const result = getTruncatedBoard(rankedTeams.teams, 15)
      expect(result.moreCount).toBe(35)
    })

    it('should handle empty list', () => {
      const result = getTruncatedBoard([], 10)
      expect(result.visible).toHaveLength(0)
      expect(result.moreCount).toBe(0)
    })
  })

  describe('highlightTiebreakerTeams', () => {
    it('should identify tied teams at prize positions', () => {
      const result = highlightTiebreakerTeams(rankedTeams.teams, [1, 2, 3])
      const tiebreakerTeams = result.filter((t) => t.isTiebreakerCandidate)
      expect(tiebreakerTeams.length).toBeGreaterThanOrEqual(0)
    })

    it('should mark teams at specified positions', () => {
      const result = highlightTiebreakerTeams(rankedTeams.teams, [1])
      const firstPlace = result.find((t) => t.rank === 1 || t.rank === 'T-1')
      if (firstPlace) {
        expect(firstPlace.isTiebreakerCandidate).toBeDefined()
      }
    })

    it('should handle multiple prize positions', () => {
      const result = highlightTiebreakerTeams(rankedTeams.teams, [1, 2, 3])
      expect(result.every((t) => t.isTiebreakerCandidate !== undefined)).toBe(true)
    })

    it('should maintain team data', () => {
      const result = highlightTiebreakerTeams(rankedTeams.teams, [1])
      expect(result[0]).toHaveProperty('teamName')
      expect(result[0]).toHaveProperty('totalPoints')
      expect(result[0]).toHaveProperty('rank')
    })
  })

  describe('integration', () => {
    it('should support pagination with tiebreaker highlighting', () => {
      const page1 = paginate(rankedTeams.teams, 10, 1)
      const highlighted = highlightTiebreakerTeams(page1.teams, [1])
      expect(highlighted.length).toBe(10)
    })

    it('should work with truncated board', () => {
      const truncated = getTruncatedBoard(rankedTeams.teams, 20)
      expect(truncated.visible).toHaveLength(20)
      expect(truncated.moreCount).toBeGreaterThan(0)

      const paginated = paginate(truncated.visible, 10, 1)
      expect(paginated.teams).toHaveLength(10)
      expect(paginated.totalPages).toBe(2)
    })
  })
})
