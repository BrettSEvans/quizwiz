import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPackage,
  addRound,
  addQuestion,
  setTiebreaker,
  validatePackage,
  updateRound,
  updateQuestion,
  deleteQuestion,
  deleteRound,
  freezeForGameStart,
  type DraftPackage,
  type Question,
} from '../package-authoring'

describe('Package Authoring', () => {
  let pkg: DraftPackage

  beforeEach(() => {
    pkg = createPackage('Trivia Night')
  })

  describe('createPackage', () => {
    it('should create a new draft package', () => {
      expect(pkg.name).toBe('Trivia Night')
      expect(pkg.status).toBe('draft')
      expect(pkg.rounds).toEqual([])
      expect(pkg.tiebreaker).toBeUndefined()
    })
  })

  describe('addRound', () => {
    it('should add a round to the package', () => {
      const updated = addRound(pkg, 0, 'General Knowledge', 'standard')
      expect(updated.rounds).toHaveLength(1)
      expect(updated.rounds[0].index).toBe(0)
      expect(updated.rounds[0].name).toBe('General Knowledge')
      expect(updated.rounds[0].type).toBe('standard')
      expect(updated.rounds[0].questions).toEqual([])
    })

    it('should maintain immutability', () => {
      const updated = addRound(pkg, 0, 'Round 1', 'standard')
      expect(pkg.rounds).toEqual([])
      expect(updated.rounds).toHaveLength(1)
    })

    it('should insert round at specified index', () => {
      const withRound1 = addRound(pkg, 0, 'Round 1', 'standard')
      const withRound2 = addRound(withRound1, 0, 'Round 2', 'standard')
      expect(withRound2.rounds[0].index).toBe(0)
      expect(withRound2.rounds[0].name).toBe('Round 2')
      expect(withRound2.rounds[1].index).toBe(1)
      expect(withRound2.rounds[1].name).toBe('Round 1')
    })

    it('should support custom and optional round types', () => {
      const custom = addRound(pkg, 0, 'Bonus', 'custom')
      const optional = addRound(custom, 1, 'Extra Credit', 'optional')
      expect(custom.rounds[0].type).toBe('custom')
      expect(optional.rounds[1].type).toBe('optional')
    })
  })

  describe('addQuestion', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
    })

    it('should add a standard question to a round', () => {
      const updated = addQuestion(pkg, 0, 0, 'What is the capital of France?', 'standard')
      expect(updated.rounds[0].questions).toHaveLength(1)
      expect(updated.rounds[0].questions[0].index).toBe(0)
      expect(updated.rounds[0].questions[0].text).toBe('What is the capital of France?')
      expect(updated.rounds[0].questions[0].type).toBe('standard')
    })

    it('should add a musical question with labels', () => {
      const updated = addQuestion(
        pkg,
        0,
        0,
        'Who performed this song?',
        'musical',
        { artistLabel: 'Artist', yearLabel: 'Year' }
      )
      expect(updated.rounds[0].questions[0].type).toBe('musical')
      expect(updated.rounds[0].questions[0].musicalArtistLabel).toBe('Artist')
      expect(updated.rounds[0].questions[0].musicalYearLabel).toBe('Year')
    })

    it('should add bonus and custom questions', () => {
      const bonus = addQuestion(pkg, 0, 0, 'Double points!', 'bonus')
      const custom = addQuestion(bonus, 0, 1, 'Custom scoring', 'custom')
      expect(bonus.rounds[0].questions[0].type).toBe('bonus')
      expect(custom.rounds[0].questions[1].type).toBe('custom')
    })

    it('should maintain immutability when adding questions', () => {
      const updated = addQuestion(pkg, 0, 0, 'Q1', 'standard')
      expect(pkg.rounds[0].questions).toEqual([])
      expect(updated.rounds[0].questions).toHaveLength(1)
    })

    it('should insert question at specified index', () => {
      const q1 = addQuestion(pkg, 0, 0, 'Q1', 'standard')
      const q2 = addQuestion(q1, 0, 0, 'Q2', 'standard')
      expect(q2.rounds[0].questions[0].index).toBe(0)
      expect(q2.rounds[0].questions[0].text).toBe('Q2')
      expect(q2.rounds[0].questions[1].index).toBe(1)
      expect(q2.rounds[0].questions[1].text).toBe('Q1')
    })
  })

  describe('setTiebreaker', () => {
    let q1: Question

    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'Tiebreaker', 'standard')
      q1 = pkg.rounds[0].questions[0]
    })

    it('should set the tiebreaker question', () => {
      const updated = setTiebreaker(pkg, q1)
      expect(updated.tiebreaker).toBe(q1)
    })

    it('should maintain immutability', () => {
      const updated = setTiebreaker(pkg, q1)
      expect(pkg.tiebreaker).toBeUndefined()
      expect(updated.tiebreaker).toBe(q1)
    })
  })

  describe('validatePackage', () => {
    it('should fail if no rounds', () => {
      const result = validatePackage(pkg)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Package must have at least 1 round')
    })

    it('should fail if more than 20 rounds', () => {
      let p = pkg
      for (let i = 0; i < 21; i++) {
        p = addRound(p, i, `Round ${i}`, 'standard')
      }
      const result = validatePackage(p)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Package cannot exceed 20 rounds')
    })

    it('should fail if round has fewer than 4 questions', () => {
      let p = addRound(pkg, 0, 'Round 1', 'standard')
      p = addQuestion(p, 0, 0, 'Q1', 'standard')
      p = addQuestion(p, 0, 1, 'Q2', 'standard')
      p = addQuestion(p, 0, 2, 'Q3', 'standard')
      const result = validatePackage(p)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Each round must have at least 4 questions')
    })

    it('should fail if tiebreaker not set', () => {
      let p = addRound(pkg, 0, 'Round 1', 'standard')
      for (let i = 0; i < 4; i++) {
        p = addQuestion(p, 0, i, `Q${i}`, 'standard')
      }
      const result = validatePackage(p)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Tiebreaker question must be set')
    })

    it('should pass valid package', () => {
      let p = addRound(pkg, 0, 'Round 1', 'standard')
      for (let i = 0; i < 5; i++) {
        p = addQuestion(p, 0, i, `Q${i}`, 'standard')
      }
      p = setTiebreaker(p, p.rounds[0].questions[0])
      const result = validatePackage(p)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should allow up to 20 rounds', () => {
      let p = pkg
      for (let i = 0; i < 20; i++) {
        p = addRound(p, i, `Round ${i}`, 'standard')
        for (let j = 0; j < 4; j++) {
          p = addQuestion(p, i, j, `Q${j}`, 'standard')
        }
      }
      p = setTiebreaker(p, p.rounds[0].questions[0])
      const result = validatePackage(p)
      expect(result.valid).toBe(true)
    })
  })

  describe('updateRound', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'Q1', 'standard')
    })

    it('should update round name', () => {
      const updated = updateRound(pkg, 0, 'Updated Round', 'standard')
      expect(updated.rounds[0].name).toBe('Updated Round')
    })

    it('should update round type', () => {
      const updated = updateRound(pkg, 0, 'Round 1', 'custom')
      expect(updated.rounds[0].type).toBe('custom')
    })

    it('should maintain immutability', () => {
      const updated = updateRound(pkg, 0, 'New Name', 'standard')
      expect(pkg.rounds[0].name).toBe('Round 1')
      expect(updated.rounds[0].name).toBe('New Name')
    })

    it('should preserve questions when updating round', () => {
      const updated = updateRound(pkg, 0, 'New Name', 'standard')
      expect(updated.rounds[0].questions).toHaveLength(1)
      expect(updated.rounds[0].questions[0].text).toBe('Q1')
    })
  })

  describe('updateQuestion', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'What is 2+2?', 'standard')
    })

    it('should update question text', () => {
      const updated = updateQuestion(pkg, 0, 0, 'What is 3+3?', 'standard')
      expect(updated.rounds[0].questions[0].text).toBe('What is 3+3?')
    })

    it('should change question type', () => {
      const updated = updateQuestion(pkg, 0, 0, 'Text', 'musical', {
        artistLabel: 'Artist',
        yearLabel: 'Year',
      })
      expect(updated.rounds[0].questions[0].type).toBe('musical')
      expect(updated.rounds[0].questions[0].musicalArtistLabel).toBe('Artist')
    })

    it('should maintain immutability', () => {
      const updated = updateQuestion(pkg, 0, 0, 'Updated', 'standard')
      expect(pkg.rounds[0].questions[0].text).toBe('What is 2+2?')
      expect(updated.rounds[0].questions[0].text).toBe('Updated')
    })
  })

  describe('deleteQuestion', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'Q1', 'standard')
      pkg = addQuestion(pkg, 0, 1, 'Q2', 'standard')
      pkg = addQuestion(pkg, 0, 2, 'Q3', 'standard')
    })

    it('should remove question from round', () => {
      const updated = deleteQuestion(pkg, 0, 1)
      expect(updated.rounds[0].questions).toHaveLength(2)
      expect(updated.rounds[0].questions[1].text).toBe('Q3')
    })

    it('should re-index remaining questions', () => {
      const updated = deleteQuestion(pkg, 0, 1)
      expect(updated.rounds[0].questions[0].index).toBe(0)
      expect(updated.rounds[0].questions[1].index).toBe(1)
    })

    it('should clear tiebreaker if deleted question was tiebreaker', () => {
      let p = setTiebreaker(pkg, pkg.rounds[0].questions[1])
      p = deleteQuestion(p, 0, 1)
      expect(p.tiebreaker).toBeUndefined()
    })

    it('should maintain immutability', () => {
      const updated = deleteQuestion(pkg, 0, 1)
      expect(pkg.rounds[0].questions).toHaveLength(3)
      expect(updated.rounds[0].questions).toHaveLength(2)
    })
  })

  describe('deleteRound', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'Q1', 'standard')
      pkg = addRound(pkg, 1, 'Round 2', 'standard')
      pkg = addQuestion(pkg, 1, 0, 'Q2', 'standard')
    })

    it('should remove round from package', () => {
      const updated = deleteRound(pkg, 0)
      expect(updated.rounds).toHaveLength(1)
      expect(updated.rounds[0].name).toBe('Round 2')
    })

    it('should re-index remaining rounds', () => {
      const updated = deleteRound(pkg, 0)
      expect(updated.rounds[0].index).toBe(0)
    })

    it('should clear tiebreaker if from deleted round', () => {
      let p = setTiebreaker(pkg, pkg.rounds[0].questions[0])
      p = deleteRound(p, 0)
      expect(p.tiebreaker).toBeUndefined()
    })

    it('should maintain immutability', () => {
      const updated = deleteRound(pkg, 0)
      expect(pkg.rounds).toHaveLength(2)
      expect(updated.rounds).toHaveLength(1)
    })
  })

  describe('freezeForGameStart', () => {
    beforeEach(() => {
      pkg = addRound(pkg, 0, 'Round 1', 'standard')
      pkg = addQuestion(pkg, 0, 0, 'Q1', 'standard')
      pkg = addQuestion(pkg, 0, 1, 'Q2', 'standard')
      pkg = addQuestion(pkg, 0, 2, 'Q3', 'standard')
      pkg = addQuestion(pkg, 0, 3, 'Q4', 'standard')
      pkg = setTiebreaker(pkg, pkg.rounds[0].questions[0])
    })

    it('should create a frozen snapshot', () => {
      const now = new Date()
      const frozen = freezeForGameStart(pkg, now)
      expect(frozen.frozenAt).toBe(now)
      expect(frozen.rounds).toHaveLength(1)
      expect(frozen.tiebreaker).toBeDefined()
    })

    it('should preserve all round and question data', () => {
      const frozen = freezeForGameStart(pkg, new Date())
      expect(frozen.rounds[0].name).toBe('Round 1')
      expect(frozen.rounds[0].questions).toHaveLength(4)
      expect(frozen.rounds[0].questions[0].text).toBe('Q1')
    })

    it('should be immutable copy of original', () => {
      const before = pkg.rounds[0].questions.length
      const frozen = freezeForGameStart(pkg, new Date())
      const after = pkg.rounds[0].questions.length
      expect(before).toBe(after)
      expect(frozen.rounds).not.toBe(pkg.rounds)
    })
  })
})
