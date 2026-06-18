/**
 * Package publishing domain logic - state machine for publishing and modifying frozen packages.
 * Supports void questions and team awards for operational flexibility.
 */

import type { FrozenPackage } from './package-authoring'

export interface PublishedPackage extends FrozenPackage {
  status: 'published'
  voidQuestions: Set<string> // Format: "roundIndex:questionIndex"
  awardedQuestions: Map<string, number> // Format: "roundIndex:questionIndex" -> points
}

export function publishPackage(frozenPkg: FrozenPackage): PublishedPackage {
  return {
    id: frozenPkg.id,
    name: frozenPkg.name,
    rounds: JSON.parse(JSON.stringify(frozenPkg.rounds)),
    tiebreaker: JSON.parse(JSON.stringify(frozenPkg.tiebreaker)),
    frozenAt: frozenPkg.frozenAt,
    status: 'published',
    voidQuestions: new Set(),
    awardedQuestions: new Map(),
  }
}

export function voidQuestion(
  pkg: PublishedPackage,
  roundIndex: number,
  questionIndex: number
): PublishedPackage {
  const key = `${roundIndex}:${questionIndex}`
  const newVoidSet = new Set(pkg.voidQuestions)
  newVoidSet.add(key)

  return {
    ...pkg,
    voidQuestions: newVoidSet,
  }
}

export function awardAllTeams(
  pkg: PublishedPackage,
  roundIndex: number,
  questionIndex: number,
  points: number
): PublishedPackage {
  const key = `${roundIndex}:${questionIndex}`
  const newAwardMap = new Map(pkg.awardedQuestions)
  newAwardMap.set(key, points)

  return {
    ...pkg,
    awardedQuestions: newAwardMap,
  }
}
