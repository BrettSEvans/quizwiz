import { describe, it, expect } from 'vitest'
import {
  calculateTeamTotal,
  rankTeams,
  detectTieForPrize,
  isValidScore,
  calculateRoundScore,
} from '../scoring'
import { TeamScore } from '../models'

describe('Scoring Logic', () => {
  describe('calculateTeamTotal', () => {
    it('should sum all points across rounds and questions', () => {
      const scores = {
        0: { 0: 2, 1: 1, 2: 0 },
        1: { 0: 2, 1: 2 },
      }
      expect(calculateTeamTotal(scores)).toBe(7)
    })

    it('should return 0 for empty scores', () => {
      expect(calculateTeamTotal({})).toBe(0)
    })

    it('should handle single question', () => {
      const scores = {
        0: { 0: 2 },
      }
      expect(calculateTeamTotal(scores)).toBe(2)
    })
  })

  describe('rankTeams', () => {
    it('should sort teams by total points descending', () => {
      const teams: TeamScore[] = [
        {
          teamId: '1',
          teamName: 'Team A',
          totalPoints: 10,
          scores: {},
        },
        {
          teamId: '2',
          teamName: 'Team B',
          totalPoints: 20,
          scores: {},
        },
        {
          teamId: '3',
          teamName: 'Team C',
          totalPoints: 15,
          scores: {},
        },
      ]

      const { teams: ranked } = rankTeams(teams)

      expect(ranked[0].teamId).toBe('2')
      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].teamId).toBe('3')
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].teamId).toBe('1')
      expect(ranked[2].rank).toBe(3)
    })

    it('should assign same rank for tied teams', () => {
      const teams: TeamScore[] = [
        { teamId: '1', teamName: 'Team A', totalPoints: 20, scores: {} },
        { teamId: '2', teamName: 'Team B', totalPoints: 20, scores: {} },
        { teamId: '3', teamName: 'Team C', totalPoints: 15, scores: {} },
      ]

      const { teams: ranked, tiedTeamIds } = rankTeams(teams)

      expect(ranked[0].rank).toBe('T-1')
      expect(ranked[1].rank).toBe('T-1')
      expect(ranked[2].rank).toBe(3)
      expect(tiedTeamIds.has('1')).toBe(true)
      expect(tiedTeamIds.has('2')).toBe(true)
    })

    it('should handle empty teams list', () => {
      const { teams: ranked } = rankTeams([])
      expect(ranked).toEqual([])
    })
  })

  describe('detectTieForPrize', () => {
    it('should detect ties for prize positions', () => {
      const ranked = [
        { teamId: '1', teamName: 'Team A', totalPoints: 20, rank: 'T-1' as const, scores: {} },
        { teamId: '2', teamName: 'Team B', totalPoints: 20, rank: 'T-1' as const, scores: {} },
        { teamId: '3', teamName: 'Team C', totalPoints: 15, rank: 3 as const, scores: {} },
      ]

      const tied = detectTieForPrize(ranked, [1, 2, 3])
      expect(tied.has('1')).toBe(true)
      expect(tied.has('2')).toBe(true)
    })

    it('should not detect ties outside prize positions', () => {
      const ranked = [
        { teamId: '1', teamName: 'Team A', totalPoints: 20, rank: 1 as const, scores: {} },
        { teamId: '2', teamName: 'Team B', totalPoints: 15, rank: 2 as const, scores: {} },
        { teamId: '3', teamName: 'Team C', totalPoints: 10, rank: 'T-3' as const, scores: {} },
        { teamId: '4', teamName: 'Team D', totalPoints: 10, rank: 'T-3' as const, scores: {} },
      ]

      const tied = detectTieForPrize(ranked, [1, 2, 3])
      expect(tied.has('3')).toBe(true)
      expect(tied.has('4')).toBe(true)
    })

    it('should ignore teams at rank 3 if not tied', () => {
      const ranked = [
        { teamId: '1', teamName: 'Team A', totalPoints: 20, rank: 1 as const, scores: {} },
        { teamId: '2', teamName: 'Team B', totalPoints: 15, rank: 2 as const, scores: {} },
        { teamId: '3', teamName: 'Team C', totalPoints: 10, rank: 3 as const, scores: {} },
      ]

      const tied = detectTieForPrize(ranked, [1, 2])
      expect(tied.size).toBe(0)
    })
  })

  describe('isValidScore', () => {
    it('should validate standard 0/1/2 scores', () => {
      expect(isValidScore('standard', 0)).toBe(true)
      expect(isValidScore('standard', 1)).toBe(true)
      expect(isValidScore('standard', 2)).toBe(true)
      expect(isValidScore('standard', 3)).toBe(true) // Allow any non-negative for custom
    })

    it('should validate musical scores with artist/year', () => {
      expect(isValidScore('musical', { artist: 0, year: 0 })).toBe(true)
      expect(isValidScore('musical', { artist: 1, year: 2 })).toBe(true)
      expect(isValidScore('musical', { artist: 3, year: 0 })).toBe(false)
    })

    it('should reject invalid musical format', () => {
      expect(isValidScore('musical', 2)).toBe(false)
    })

    it('should reject negative scores', () => {
      expect(isValidScore('standard', -1)).toBe(false)
    })
  })

  describe('calculateRoundScore', () => {
    it('should sum question scores for a round', () => {
      const roundScores = { 0: 2, 1: 1, 2: 0 }
      expect(calculateRoundScore(roundScores)).toBe(3)
    })

    it('should return 0 for empty round', () => {
      expect(calculateRoundScore({})).toBe(0)
    })
  })
})
