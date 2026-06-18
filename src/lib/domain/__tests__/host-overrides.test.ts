import { describe, it, expect, beforeEach } from 'vitest'
import {
  voidQuestion,
  awardAllTeams,
  createManualScore,
  approveLateSyncWithOverride,
  type HostOverrideMap,
} from '../host-overrides'
import type { GameStateSnapshot } from '../game-state'

describe('Host Overrides', () => {
  let gameState: GameStateSnapshot
  let overrides: HostOverrideMap

  beforeEach(() => {
    gameState = {
      currentRoundIndex: 0,
      roundStatus: 'active',
      registrationOpen: false,
      teams: [
        {
          id: 't1',
          name: 'Team A',
          status: 'active',
          answers: { 0: { 0: 'Paris' } },
          scores: { 0: { 0: 2, 1: 1, 2: 0 } },
        },
        {
          id: 't2',
          name: 'Team B',
          status: 'active',
          answers: { 0: { 0: 'London' } },
          scores: { 0: { 0: 0, 1: 1, 2: 2 } },
        },
      ] as any,
    } as any
    overrides = {}
  })

  describe('voidQuestion', () => {
    it('should mark question as void', () => {
      const result = voidQuestion(gameState, overrides, 0, 1)
      expect(result.overrides.voidedQuestions).toHaveProperty('0:1')
      expect(result.overrides.voidedQuestions['0:1']).toBe(true)
    })

    it('should recalculate team scores excluding void question', () => {
      const result = voidQuestion(gameState, overrides, 0, 1)
      const team1 = result.gameState.teams.find((t) => t.id === 't1')
      // Void question 1: had 1 point, now voided
      expect(team1?.scores?.[0]?.[1]).toBeUndefined()
    })

    it('should affect all teams', () => {
      const result = voidQuestion(gameState, overrides, 0, 0)
      const team1 = result.gameState.teams.find((t) => t.id === 't1')
      const team2 = result.gameState.teams.find((t) => t.id === 't2')
      // Both should have question 0 voided
      expect(team1?.scores?.[0]?.[0]).toBeUndefined()
      expect(team2?.scores?.[0]?.[0]).toBeUndefined()
    })

    it('should maintain immutability', () => {
      const result = voidQuestion(gameState, overrides, 0, 1)
      expect(gameState.teams).not.toBe(result.gameState.teams)
      expect(overrides).toEqual({})
    })
  })

  describe('awardAllTeams', () => {
    it('should grant points to all teams on a question', () => {
      const result = awardAllTeams(gameState, overrides, 0, 2, 2)
      const team1 = result.gameState.teams.find((t) => t.id === 't1')
      const team2 = result.gameState.teams.find((t) => t.id === 't2')
      // Both teams should get 2 points for question 0:2
      expect(team1?.scores?.[0]?.[2]).toBe(2)
      expect(team2?.scores?.[0]?.[2]).toBe(2)
    })

    it('should record award in overrides', () => {
      const result = awardAllTeams(gameState, overrides, 0, 2, 2)
      expect(result.overrides.awardedQuestions).toHaveProperty('0:2')
      expect(result.overrides.awardedQuestions['0:2']).toBe(2)
    })

    it('should support zero and negative awards', () => {
      let result = awardAllTeams(gameState, overrides, 0, 1, 0)
      expect(result.overrides.awardedQuestions['0:1']).toBe(0)

      result = awardAllTeams(result.gameState, result.overrides, 0, 2, -1)
      expect(result.overrides.awardedQuestions['0:2']).toBe(-1)
    })

    it('should override previous award on same question', () => {
      let result = awardAllTeams(gameState, overrides, 0, 1, 2)
      result = awardAllTeams(result.gameState, result.overrides, 0, 1, 3)
      expect(result.overrides.awardedQuestions['0:1']).toBe(3)
    })
  })

  describe('createManualScore', () => {
    it('should set manual score for a team on a question', () => {
      const result = createManualScore(gameState, overrides, 't1', 0, 0, 2)
      const team = result.gameState.teams.find((t) => t.id === 't1')
      expect(team?.scores?.[0]?.[0]).toBe(2)
    })

    it('should track manual scores in overrides', () => {
      const result = createManualScore(gameState, overrides, 't1', 0, 0, 2)
      expect(result.overrides.manualScores).toHaveProperty('t1:0:0')
      expect(result.overrides.manualScores['t1:0:0']).toBe(2)
    })

    it('should allow different scores per team', () => {
      let result = createManualScore(gameState, overrides, 't1', 0, 0, 2)
      result = createManualScore(result.gameState, result.overrides, 't2', 0, 0, 1)
      expect(result.overrides.manualScores['t1:0:0']).toBe(2)
      expect(result.overrides.manualScores['t2:0:0']).toBe(1)
    })

    it('should override previous manual score', () => {
      let result = createManualScore(gameState, overrides, 't1', 0, 0, 2)
      result = createManualScore(result.gameState, result.overrides, 't1', 0, 0, 1)
      expect(result.overrides.manualScores['t1:0:0']).toBe(1)
    })
  })

  describe('approveLateSyncWithOverride', () => {
    it('should mark late sync as approved', () => {
      const now = new Date()
      const result = approveLateSyncWithOverride(gameState, overrides, 't1', 0, now)
      expect(result.overrides.lateSyncApprovals).toHaveProperty('t1:0')
    })

    it('should record approval timestamp', () => {
      const now = new Date()
      const result = approveLateSyncWithOverride(gameState, overrides, 't1', 0, now)
      expect(result.overrides.lateSyncApprovals['t1:0']).toEqual(now)
    })

    it('should allow multiple approvals', () => {
      const now = new Date()
      let result = approveLateSyncWithOverride(gameState, overrides, 't1', 0, now)
      const later = new Date(now.getTime() + 1000)
      result = approveLateSyncWithOverride(result.gameState, result.overrides, 't2', 0, later)
      expect(result.overrides.lateSyncApprovals['t1:0']).toEqual(now)
      expect(result.overrides.lateSyncApprovals['t2:0']).toEqual(later)
    })
  })

  describe('combined operations', () => {
    it('should allow void and award in same state', () => {
      let result = voidQuestion(gameState, overrides, 0, 1)
      result = awardAllTeams(result.gameState, result.overrides, 0, 2, 2)
      expect(result.overrides.voidedQuestions['0:1']).toBe(true)
      expect(result.overrides.awardedQuestions['0:2']).toBe(2)
    })

    it('should allow manual scores alongside awards', () => {
      let result = awardAllTeams(gameState, overrides, 0, 1, 2)
      result = createManualScore(result.gameState, result.overrides, 't1', 0, 2, 1)
      expect(result.overrides.awardedQuestions['0:1']).toBe(2)
      expect(result.overrides.manualScores['t1:0:2']).toBe(1)
    })
  })
})
