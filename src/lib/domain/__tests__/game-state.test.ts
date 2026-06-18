import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGameState,
  closeRegistration,
  reopenRegistration,
  lockRound,
  unlockRound,
  holdLateSync,
  approveLateSync,
  isRoundReadyToPublish,
  publishRound,
  advanceRound,
  canTeamSubmit,
  getSubmissionKey,
  GameStateSnapshot,
} from '../game-state'

describe('Game State Machine', () => {
  let state: GameStateSnapshot

  beforeEach(() => {
    state = createGameState(3) // 3 rounds
  })

  describe('Initial state', () => {
    it('should create game with registration open', () => {
      expect(state.registrationOpen).toBe(true)
      expect(state.currentRoundIndex).toBe(0)
    })

    it('should initialize all rounds as active', () => {
      expect(state.rounds.get(0)?.status).toBe('active')
      expect(state.rounds.get(1)?.status).toBe('active')
      expect(state.rounds.get(2)?.status).toBe('active')
    })
  })

  describe('Registration control', () => {
    it('should close registration', () => {
      const closed = closeRegistration(state)
      expect(closed.registrationOpen).toBe(false)
      expect(closed.currentRoundIndex).toBe(0)
    })

    it('should reopen registration', () => {
      const closed = closeRegistration(state)
      const reopened = reopenRegistration(closed)
      expect(reopened.registrationOpen).toBe(true)
    })

    it('should not mutate original state', () => {
      closeRegistration(state)
      expect(state.registrationOpen).toBe(true)
    })
  })

  describe('Round locking', () => {
    it('should lock the active round', () => {
      const locked = lockRound(state, new Set())
      expect(locked.rounds.get(0)?.status).toBe('locked')
    })

    it('should capture draft submissions at lock', () => {
      const drafts = new Set(['team1', 'team2'])
      const locked = lockRound(state, drafts)
      expect(locked.rounds.get(0)?.draftSubmissions).toEqual(drafts)
    })

    it('should not lock a non-active round', () => {
      const locked = lockRound(state, new Set())
      expect(() => lockRound(locked, new Set())).toThrow('Cannot lock round with status locked')
    })

    it('should unlock a locked round', () => {
      const locked = lockRound(state, new Set(['team1']))
      const unlocked = unlockRound(locked)
      expect(unlocked.rounds.get(0)?.status).toBe('active')
      expect(unlocked.rounds.get(0)?.draftSubmissions.size).toBe(0)
    })

    it('should not unlock a non-locked round', () => {
      expect(() => unlockRound(state)).toThrow('Cannot unlock round with status active')
    })
  })

  describe('Late-sync approval', () => {
    it('should hold a late-sync team', () => {
      const held = holdLateSync(state, 'team1')
      expect(held.rounds.get(0)?.publishPending.has('team1')).toBe(true)
    })

    it('should approve a held team', () => {
      let s = holdLateSync(state, 'team1')
      s = holdLateSync(s, 'team2')
      s = approveLateSync(s, 'team1')

      expect(s.rounds.get(0)?.publishPending.has('team1')).toBe(false)
      expect(s.rounds.get(0)?.publishPending.has('team2')).toBe(true)
    })
  })

  describe('Round publish readiness', () => {
    it('should be ready when all gradable teams are graded (force=true)', () => {
      const locked = lockRound(state, new Set())
      const ready = isRoundReadyToPublish(
        locked,
        new Set(['team1', 'team2']),
        new Set(['team1']),
        true // force publish
      )
      expect(ready).toBe(true)
    })

    it('should not be ready if teams with unapproved drafts remain', () => {
      const locked = lockRound(state, new Set(['team1', 'team2']))
      const ready = isRoundReadyToPublish(
        locked,
        new Set(['team1', 'team2']),
        new Set(['team1']),
        false
      )
      expect(ready).toBe(false)
    })

    it('should not be ready when draft teams are not graded', () => {
      const locked = lockRound(state, new Set(['team1']))
      const ready = isRoundReadyToPublish(
        locked,
        new Set(['team1', 'team2']),
        new Set(['team2']), // team1 is draft and NOT graded
        false
      )
      expect(ready).toBe(false)
    })

    it('should be ready when all teams are graded (including approved drafts)', () => {
      let s = lockRound(state, new Set(['team1']))
      s = approveLateSync(s, 'team1')
      const ready = isRoundReadyToPublish(
        s,
        new Set(['team1', 'team2']),
        new Set(['team1', 'team2']),
        false
      )
      expect(ready).toBe(true)
    })
  })

  describe('Publishing', () => {
    it('should publish a locked round', () => {
      const locked = lockRound(state, new Set())
      const published = publishRound(locked, true)
      expect(published.rounds.get(0)?.status).toBe('published')
    })

    it('should not publish an active round', () => {
      expect(() => publishRound(state, false)).toThrow('Cannot publish round with status active')
    })
  })

  describe('Round advancement', () => {
    it('should advance to the next round', () => {
      const advanced = advanceRound(state)
      expect(advanced.currentRoundIndex).toBe(1)
    })

    it('should not advance past the last round', () => {
      let s = state
      s = advanceRound(s)
      s = advanceRound(s)
      expect(() => advanceRound(s)).toThrow('Cannot advance past final round')
    })
  })

  describe('Team submission eligibility', () => {
    it('should allow submission when round is active', () => {
      expect(canTeamSubmit(state)).toBe(true)
    })

    it('should prevent submission when round is locked', () => {
      const locked = lockRound(state, new Set())
      expect(canTeamSubmit(locked)).toBe(false)
    })

    it('should prevent submission when round is published', () => {
      const locked = lockRound(state, new Set())
      const published = publishRound(locked, true)
      expect(canTeamSubmit(published)).toBe(false)
    })
  })

  describe('Submission idempotency', () => {
    it('should generate unique keys for submissions', () => {
      const key1 = getSubmissionKey('team1', 0, 0)
      const key2 = getSubmissionKey('team1', 0, 1)
      const key3 = getSubmissionKey('team2', 0, 0)

      expect(key1).not.toBe(key2)
      expect(key1).not.toBe(key3)
      expect(key2).not.toBe(key3)
    })

    it('should generate consistent keys', () => {
      const key1 = getSubmissionKey('team1', 0, 0)
      const key2 = getSubmissionKey('team1', 0, 0)
      expect(key1).toBe(key2)
    })
  })
})
