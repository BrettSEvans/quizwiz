import { describe, it, expect, beforeEach } from 'vitest'
import {
  softRemoveTeam,
  restoreTeam,
  renameTeam,
  getActiveTeams,
  calculateScoresExcluding,
  type TeamWithStatus,
} from '../team-management'
import { createGameState, type GameStateSnapshot } from '../game-state'

describe('Team Management', () => {
  let gameState: GameStateSnapshot
  const mockTeams: TeamWithStatus[] = [
    { id: 't1', name: 'Team A', status: 'active', answers: {}, scores: {} },
    { id: 't2', name: 'Team B', status: 'active', answers: {}, scores: {} },
    { id: 't3', name: 'Team C', status: 'active', answers: {}, scores: {} },
  ]

  beforeEach(() => {
    gameState = {
      currentRoundIndex: 0,
      roundStatus: 'active',
      registrationOpen: true,
      teams: mockTeams,
    } as any
  })

  describe('softRemoveTeam', () => {
    it('should mark team as soft_removed', () => {
      const updated = softRemoveTeam(gameState, 't1')
      const team = updated.teams.find((t) => t.id === 't1')
      expect(team?.status).toBe('soft_removed')
    })

    it('should maintain immutability', () => {
      const updated = softRemoveTeam(gameState, 't1')
      const originalTeam = gameState.teams.find((t) => t.id === 't1')
      expect(originalTeam?.status).toBe('active')
      expect(updated.teams).not.toBe(gameState.teams)
    })

    it('should preserve other team data', () => {
      const updated = softRemoveTeam(gameState, 't1')
      const team = updated.teams.find((t) => t.id === 't1')
      expect(team?.name).toBe('Team A')
      expect(team?.id).toBe('t1')
    })

    it('should not affect other teams', () => {
      const updated = softRemoveTeam(gameState, 't1')
      const otherTeams = updated.teams.filter((t) => t.id !== 't1')
      expect(otherTeams.every((t) => t.status === 'active')).toBe(true)
    })
  })

  describe('restoreTeam', () => {
    it('should change soft_removed team back to active', () => {
      let updated = softRemoveTeam(gameState, 't1')
      updated = restoreTeam(updated, 't1')
      const team = updated.teams.find((t) => t.id === 't1')
      expect(team?.status).toBe('active')
    })

    it('should maintain immutability', () => {
      let updated = softRemoveTeam(gameState, 't1')
      const beforeRestore = updated
      updated = restoreTeam(updated, 't1')
      expect(beforeRestore.teams).not.toBe(updated.teams)
    })

    it('should be idempotent on active teams', () => {
      const updated = restoreTeam(gameState, 't1')
      const team = updated.teams.find((t) => t.id === 't1')
      expect(team?.status).toBe('active')
    })
  })

  describe('renameTeam', () => {
    it('should rename a team', () => {
      const updated = renameTeam(gameState, 't1', 'New Name')
      const team = updated.teams.find((t) => t.id === 't1')
      expect(team?.name).toBe('New Name')
    })

    it('should reject duplicate names', () => {
      const result = renameTeam(gameState, 't1', 'Team B')
      expect(result.error).toBeDefined()
      expect(result.error).toContain('already exists')
    })

    it('should allow renaming to any unique name', () => {
      const updated = renameTeam(gameState, 't1', 'Unique Team Name')
      expect(!('error' in updated)).toBe(true)
      const team = (updated as any).teams.find((t: any) => t.id === 't1')
      expect(team.name).toBe('Unique Team Name')
    })

    it('should maintain immutability', () => {
      const updated = renameTeam(gameState, 't1', 'Changed')
      expect(gameState.teams[0].name).toBe('Team A')
      expect((updated as any).teams[0].name).toBe('Changed')
    })
  })

  describe('getActiveTeams', () => {
    it('should return only active teams', () => {
      let updated = softRemoveTeam(gameState, 't1')
      updated = softRemoveTeam(updated, 't2')
      const active = getActiveTeams(updated)
      expect(active).toHaveLength(1)
      expect(active[0].name).toBe('Team C')
    })

    it('should return all teams if none removed', () => {
      const active = getActiveTeams(gameState)
      expect(active).toHaveLength(3)
    })

    it('should return empty array if all teams removed', () => {
      let updated = softRemoveTeam(gameState, 't1')
      updated = softRemoveTeam(updated, 't2')
      updated = softRemoveTeam(updated, 't3')
      const active = getActiveTeams(updated)
      expect(active).toHaveLength(0)
    })
  })

  describe('calculateScoresExcluding', () => {
    it('should calculate ranking excluding specified teams', () => {
      const gameWithScores = {
        ...gameState,
        teams: mockTeams.map((t) => ({
          ...t,
          scores: {
            0: { 0: 2, 1: 1, 2: 0 },
          },
        })),
      }

      const ranking = calculateScoresExcluding(gameWithScores, ['t1'])
      expect(ranking.teams).toHaveLength(2)
      expect(ranking.teams.some((t) => t.id === 't1')).toBe(false)
    })

    it('should recalculate totals without excluded teams', () => {
      const gameWithScores = {
        ...gameState,
        teams: [
          { id: 't1', name: 'Team A', status: 'active' as const, scores: { 0: { 0: 10 } } },
          { id: 't2', name: 'Team B', status: 'active' as const, scores: { 0: { 0: 5 } } },
        ] as any,
      }

      const ranking = calculateScoresExcluding(gameWithScores, ['t1'])
      expect(ranking.teams[0].totalPoints).toBe(5)
    })

    it('should maintain ranking order', () => {
      const gameWithScores = {
        ...gameState,
        teams: [
          { id: 't1', name: 'Team A', status: 'active' as const, scores: { 0: { 0: 5 } } },
          { id: 't2', name: 'Team B', status: 'active' as const, scores: { 0: { 0: 10 } } },
          { id: 't3', name: 'Team C', status: 'active' as const, scores: { 0: { 0: 8 } } },
        ] as any,
      }

      const ranking = calculateScoresExcluding(gameWithScores, ['t1'])
      expect(ranking.teams[0].totalPoints).toBe(10) // Team B highest
      expect(ranking.teams[1].totalPoints).toBe(8) // Team C second
    })
  })
})
