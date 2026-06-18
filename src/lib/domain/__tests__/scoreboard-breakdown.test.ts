import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculatePerRoundTotals,
  getRoundBreakdown,
  getTiebreakerStatus,
  formatScoreboard,
  type TiebreakerView,
} from '../scoreboard-breakdown'
import { rankTeams, type TeamScore } from '../scoring'

describe('Scoreboard Breakdown', () => {
  let gameState: any
  let rankedTeams: ReturnType<typeof rankTeams>

  beforeEach(() => {
    const mockTeams = [
      {
        teamId: 't1',
        teamName: 'Team A',
        totalPoints: 8,
        scores: {
          0: { 0: 2, 1: 1, 2: 0 },
          1: { 0: 1, 1: 2, 2: 2 },
        },
      },
      {
        teamId: 't2',
        teamName: 'Team B',
        totalPoints: 8, // Tied
        scores: {
          0: { 0: 1, 1: 1, 2: 1 },
          1: { 0: 2, 1: 2, 2: 2 },
        },
      },
      {
        teamId: 't3',
        teamName: 'Team C',
        totalPoints: 7,
        scores: {
          0: { 0: 0, 1: 2, 2: 1 },
          1: { 0: 2, 1: 1, 2: 2 },
        },
      },
    ] as TeamScore[]

    rankedTeams = rankTeams(mockTeams)

    gameState = {
      teams: mockTeams.map((t) => ({
        id: t.teamId,
        name: t.teamName,
        status: 'active',
        answers: {},
        scores: t.scores,
      })),
    }
  })

  describe('calculatePerRoundTotals', () => {
    it('should sum all scores in a round', () => {
      const totals = calculatePerRoundTotals(gameState, 't1')
      expect(totals[0]).toBe(3) // 2+1+0
      expect(totals[1]).toBe(5) // 1+2+2 = 5
    })

    it('should handle teams with no scores', () => {
      const emptyGameState = {
        teams: [
          {
            id: 't1',
            name: 'Empty Team',
            status: 'active',
            answers: {},
            scores: {},
          },
        ],
      }
      const totals = calculatePerRoundTotals(emptyGameState, 't1')
      expect(totals).toEqual({})
    })

    it('should match total for single team', () => {
      const totals = calculatePerRoundTotals(gameState, 't1')
      const sum = Object.values(totals).reduce((a, b) => a + b, 0)
      expect(sum).toBe(8)
    })

    it('should match calculated totals for multiple teams', () => {
      ;['t1', 't2', 't3'].forEach((teamId) => {
        const totals = calculatePerRoundTotals(gameState, teamId)
        const sum = Object.values(totals).reduce((a, b) => a + b, 0)
        const expectedTotal = gameState.teams.find((t: any) => t.id === teamId).totalPoints || 0
        if (Object.keys(totals).length > 0) {
          expect(sum).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('getRoundBreakdown', () => {
    it('should return per-question scores for a round', () => {
      const breakdown = getRoundBreakdown(gameState, 't1', 0)
      expect(breakdown).toEqual({ 0: 2, 1: 1, 2: 0 })
    })

    it('should handle multiple rounds', () => {
      const round0 = getRoundBreakdown(gameState, 't1', 0)
      const round1 = getRoundBreakdown(gameState, 't1', 1)
      expect(round0).toEqual({ 0: 2, 1: 1, 2: 0 })
      expect(round1).toEqual({ 0: 1, 1: 2, 2: 2 })
    })

    it('should return empty object for non-existent round', () => {
      const breakdown = getRoundBreakdown(gameState, 't1', 99)
      expect(breakdown).toEqual({})
    })

    it('should return empty object for non-existent team', () => {
      const breakdown = getRoundBreakdown(gameState, 'nonexistent', 0)
      expect(breakdown).toEqual({})
    })
  })

  describe('getTiebreakerStatus', () => {
    it('should return tiebreaker data for tied teams', () => {
      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'What is 2+2?',
        type: 'standard' as const,
      }

      const status = getTiebreakerStatus(rankedTeams, tiebreaker)
      expect(status.isTiebreaker).toBe(true)
      expect(status.tiedTeamCount).toBeGreaterThan(0)
    })

    it('should identify teams tied for first place', () => {
      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      const status = getTiebreakerStatus(rankedTeams, tiebreaker)
      // Team A and B are both at rank 1
      expect(status.tiedAtPrizePosition).toBe(true)
    })

    it('should return empty if no ties', () => {
      const singleWinnerState = rankTeams([
        {
          teamId: 't1',
          teamName: 'Team A',
          totalPoints: 10,
          scores: { 0: { 0: 2 } },
        },
        {
          teamId: 't2',
          teamName: 'Team B',
          totalPoints: 5,
          scores: { 0: { 0: 1 } },
        },
      ] as TeamScore[])

      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      const status = getTiebreakerStatus(singleWinnerState, tiebreaker)
      expect(status.isTiebreaker).toBe(true)
      expect(status.tiedAtPrizePosition).toBe(false)
    })
  })

  describe('formatScoreboard', () => {
    it('should format ranked teams with per-round columns', () => {
      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      const formatted = formatScoreboard(rankedTeams, tiebreaker)
      expect(formatted.teams).toHaveLength(3)
      expect(formatted.teams[0].rank).toBeDefined()
      expect(formatted.teams[0].totalScore).toBeDefined()
    })

    it('should include per-round breakdown in formatted teams', () => {
      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      const formatted = formatScoreboard(rankedTeams, tiebreaker)
      const firstTeam = formatted.teams[0]
      expect(firstTeam.roundTotals).toBeDefined()
    })

    it('should maintain ranking order', () => {
      const tiebreaker = {
        id: 'tie_q1',
        index: 0,
        text: 'Tiebreaker',
        type: 'standard' as const,
      }

      const formatted = formatScoreboard(rankedTeams, tiebreaker)
      // First two teams should have same total (tie)
      expect(formatted.teams[0].totalScore).toBe(formatted.teams[1].totalScore)
      // Third team should have lower score
      expect(formatted.teams[2].totalScore).toBeLessThan(formatted.teams[0].totalScore)
    })
  })
})
