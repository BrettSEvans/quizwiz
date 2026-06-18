import { describe, it, expect, beforeEach } from 'vitest'
import {
  publishPackage,
  voidQuestion,
  awardAllTeams,
  type PublishedPackage,
} from '../package-publishing'
import {
  createPackage,
  addRound,
  addQuestion,
  setTiebreaker,
  validatePackage,
  type FrozenPackage,
} from '../package-authoring'

describe('Package Publishing', () => {
  let frozenPkg: FrozenPackage

  beforeEach(() => {
    let pkg = createPackage('Test Package')
    pkg = addRound(pkg, 0, 'Round 1', 'standard')
    for (let i = 0; i < 5; i++) {
      pkg = addQuestion(pkg, 0, i, `Q${i + 1}`, 'standard')
    }
    pkg = setTiebreaker(pkg, pkg.rounds[0].questions[0])
    frozenPkg = {
      id: pkg.id,
      name: pkg.name,
      rounds: pkg.rounds,
      tiebreaker: pkg.tiebreaker!,
      frozenAt: new Date(),
    }
  })

  describe('publishPackage', () => {
    it('should create a published package from frozen package', () => {
      const published = publishPackage(frozenPkg)
      expect(published).toBeDefined()
      expect(published.status).toBe('published')
      expect(published.frozenAt).toBeDefined()
      expect(published.voidQuestions).toEqual(new Set())
      expect(published.awardedQuestions).toEqual(new Map())
    })

    it('should preserve package data on publish', () => {
      const published = publishPackage(frozenPkg)
      expect(published.id).toBe(frozenPkg.id)
      expect(published.name).toBe(frozenPkg.name)
      expect(published.rounds).toEqual(frozenPkg.rounds)
      expect(published.tiebreaker).toEqual(frozenPkg.tiebreaker)
    })

    it('should create immutable copy', () => {
      const published = publishPackage(frozenPkg)
      expect(published.rounds).not.toBe(frozenPkg.rounds)
      expect(published.tiebreaker).not.toBe(frozenPkg.tiebreaker)
    })

    it('should initialize empty void/award tracking', () => {
      const published = publishPackage(frozenPkg)
      expect(published.voidQuestions.size).toBe(0)
      expect(published.awardedQuestions.size).toBe(0)
    })
  })

  describe('voidQuestion', () => {
    let published: PublishedPackage

    beforeEach(() => {
      published = publishPackage(frozenPkg)
    })

    it('should mark question as void', () => {
      const updated = voidQuestion(published, 0, 1)
      const key = '0:1'
      expect(updated.voidQuestions.has(key)).toBe(true)
    })

    it('should maintain immutability', () => {
      const updated = voidQuestion(published, 0, 1)
      expect(published.voidQuestions.size).toBe(0)
      expect(updated.voidQuestions.size).toBe(1)
    })

    it('should allow voiding multiple questions', () => {
      let updated = voidQuestion(published, 0, 1)
      updated = voidQuestion(updated, 0, 2)
      updated = voidQuestion(updated, 0, 3)
      expect(updated.voidQuestions.size).toBe(3)
      expect(updated.voidQuestions.has('0:1')).toBe(true)
      expect(updated.voidQuestions.has('0:2')).toBe(true)
      expect(updated.voidQuestions.has('0:3')).toBe(true)
    })

    it('should idempotently void same question', () => {
      let updated = voidQuestion(published, 0, 1)
      updated = voidQuestion(updated, 0, 1)
      expect(updated.voidQuestions.size).toBe(1)
    })
  })

  describe('awardAllTeams', () => {
    let published: PublishedPackage

    beforeEach(() => {
      published = publishPackage(frozenPkg)
    })

    it('should award points for a question', () => {
      const updated = awardAllTeams(published, 0, 1, 2)
      const key = '0:1'
      expect(updated.awardedQuestions.has(key)).toBe(true)
      expect(updated.awardedQuestions.get(key)).toBe(2)
    })

    it('should allow different point values per question', () => {
      let updated = awardAllTeams(published, 0, 1, 2)
      updated = awardAllTeams(updated, 0, 2, 1)
      expect(updated.awardedQuestions.get('0:1')).toBe(2)
      expect(updated.awardedQuestions.get('0:2')).toBe(1)
    })

    it('should maintain immutability', () => {
      const updated = awardAllTeams(published, 0, 1, 2)
      expect(published.awardedQuestions.size).toBe(0)
      expect(updated.awardedQuestions.size).toBe(1)
    })

    it('should override previous award for same question', () => {
      let updated = awardAllTeams(published, 0, 1, 2)
      updated = awardAllTeams(updated, 0, 1, 3)
      expect(updated.awardedQuestions.size).toBe(1)
      expect(updated.awardedQuestions.get('0:1')).toBe(3)
    })

    it('should support zero and negative awards', () => {
      let updated = awardAllTeams(published, 0, 1, 0)
      updated = awardAllTeams(updated, 0, 2, -1)
      expect(updated.awardedQuestions.get('0:1')).toBe(0)
      expect(updated.awardedQuestions.get('0:2')).toBe(-1)
    })
  })

  describe('void and award combinations', () => {
    let published: PublishedPackage

    beforeEach(() => {
      published = publishPackage(frozenPkg)
    })

    it('should allow void and award on different questions', () => {
      let updated = voidQuestion(published, 0, 1)
      updated = awardAllTeams(updated, 0, 2, 2)
      expect(updated.voidQuestions.has('0:1')).toBe(true)
      expect(updated.awardedQuestions.get('0:2')).toBe(2)
    })

    it('should support voiding and awarding same round', () => {
      let updated = voidQuestion(published, 0, 1)
      updated = voidQuestion(updated, 0, 2)
      updated = awardAllTeams(updated, 0, 3, 1)
      updated = awardAllTeams(updated, 0, 4, 2)
      expect(updated.voidQuestions.size).toBe(2)
      expect(updated.awardedQuestions.size).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should handle void/award on multiround packages', () => {
      let pkg = createPackage('Multi-Round')
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addRound(pkg, 1, 'Round 2', 'standard')
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 4; i++) {
          pkg = addQuestion(pkg, r, i, `Q${i}`, 'standard')
        }
      }
      pkg = setTiebreaker(pkg, pkg.rounds[0].questions[0])
      const frozen: FrozenPackage = {
        id: pkg.id,
        name: pkg.name,
        rounds: pkg.rounds,
        tiebreaker: pkg.tiebreaker!,
        frozenAt: new Date(),
      }
      const published = publishPackage(frozen)
      let updated = voidQuestion(published, 0, 1)
      updated = awardAllTeams(updated, 1, 2, 2)
      expect(updated.voidQuestions.has('0:1')).toBe(true)
      expect(updated.awardedQuestions.get('1:2')).toBe(2)
    })
  })
})
