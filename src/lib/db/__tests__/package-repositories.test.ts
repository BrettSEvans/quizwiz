import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '../prisma'
import * as packageRepo from '../package-repositories'
import type { DraftPackage } from '../../domain/package-authoring'

describe('Package Repositories', () => {
  const testQuizmasterId = 'test-quizmaster-1'
  const testEmail = `qm-${Date.now()}@test.com`

  beforeEach(async () => {
    // Create test quizmaster
    await prisma.quizmaster.create({
      data: {
        id: testQuizmasterId,
        email: testEmail,
        name: 'Test Quizmaster',
      },
    })
  })

  afterEach(async () => {
    // Cleanup
    await prisma.packageVersion.deleteMany({})
    await prisma.package.deleteMany({})
    await prisma.quizmaster.deleteMany({})
  })

  describe('create', () => {
    it('should create a new draft package', async () => {
      const result = await packageRepo.create(testQuizmasterId, 'Test Package')
      expect(result.name).toBe('Test Package')
      expect(result.status).toBe('draft')
      expect(result.quizmasterId).toBe(testQuizmasterId)
    })

    it('should initialize empty rounds array', async () => {
      const result = await packageRepo.create(testQuizmasterId, 'Test Package')
      const data = result.data as DraftPackage
      expect(data.rounds).toEqual([])
    })
  })

  describe('findById', () => {
    it('should retrieve package by id', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      const found = await packageRepo.findById(created.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Test Package')
    })

    it('should return undefined for non-existent package', async () => {
      const found = await packageRepo.findById('nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('findByQuizmaster', () => {
    it('should retrieve all packages for a quizmaster', async () => {
      await packageRepo.create(testQuizmasterId, 'Package 1')
      await packageRepo.create(testQuizmasterId, 'Package 2')
      const result = await packageRepo.findByQuizmaster(testQuizmasterId)
      expect(result).toHaveLength(2)
    })

    it('should return empty array for quizmaster with no packages', async () => {
      const result = await packageRepo.findByQuizmaster(testQuizmasterId)
      expect(result).toHaveLength(0)
    })

    it('should not include packages from other quizmasters', async () => {
      const otherQmId = 'other-qm-1'
      await prisma.quizmaster.create({
        data: {
          id: otherQmId,
          email: `other-${Date.now()}@test.com`,
          name: 'Other QM',
        },
      })

      await packageRepo.create(testQuizmasterId, 'Package 1')
      await packageRepo.create(otherQmId, 'Package 2')

      const result = await packageRepo.findByQuizmaster(testQuizmasterId)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Package 1')
    })
  })

  describe('update', () => {
    it('should update draft package data', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      const mockData: DraftPackage = {
        id: created.id,
        name: 'Updated Package',
        status: 'draft',
        rounds: [],
      }

      const updated = await packageRepo.update(created.id, mockData)
      expect(updated.name).toBe('Updated Package')
      expect((updated.data as DraftPackage).rounds).toEqual([])
    })

    it('should throw error when updating published package', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      await prisma.package.update({
        where: { id: created.id },
        data: { status: 'published' },
      })

      const mockData: DraftPackage = {
        id: created.id,
        name: 'Updated',
        status: 'draft',
        rounds: [],
      }

      await expect(packageRepo.update(created.id, mockData)).rejects.toThrow(
        'Cannot edit published package'
      )
    })
  })

  describe('publish', () => {
    it('should publish a draft package', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      const published = await packageRepo.publish(created.id)
      expect(published.status).toBe('published')
    })

    it('should create PackageVersion on publish', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      await packageRepo.publish(created.id)

      const versions = await prisma.packageVersion.findMany({
        where: { packageId: created.id },
      })
      expect(versions).toHaveLength(1)
      expect(versions[0].versionNumber).toBe(1)
    })

    it('should increment version number on re-publish', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      await packageRepo.publish(created.id)

      // Reset to draft for re-publish
      await prisma.package.update({
        where: { id: created.id },
        data: { status: 'draft' },
      })

      await packageRepo.publish(created.id)

      const versions = await prisma.packageVersion.findMany({
        where: { packageId: created.id },
        orderBy: { versionNumber: 'asc' },
      })
      expect(versions).toHaveLength(2)
      expect(versions[0].versionNumber).toBe(1)
      expect(versions[1].versionNumber).toBe(2)
    })
  })

  describe('deletePackage', () => {
    it('should delete a package', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      const deleted = await packageRepo.deletePackage(created.id)
      expect(deleted.id).toBe(created.id)
    })

    it('should not retrieve deleted package in findByQuizmaster', async () => {
      const created = await packageRepo.create(testQuizmasterId, 'Test Package')
      await packageRepo.deletePackage(created.id)
      const result = await packageRepo.findByQuizmaster(testQuizmasterId)
      expect(result).toHaveLength(0)
    })
  })
})
