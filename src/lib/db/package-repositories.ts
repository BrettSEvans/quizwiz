/**
 * Package repository - persistence layer for quizmaster packages.
 */

import { prisma } from './prisma'
import type { DraftPackage } from '../domain/package-authoring'
import type { PublishedPackage } from '../domain/package-publishing'

export async function create(quizmasterId: string, name: string) {
  const emptyPackage: DraftPackage = {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    status: 'draft',
    rounds: [],
  }

  return prisma.package.create({
    data: {
      quizmasterId,
      name,
      status: 'draft',
      data: emptyPackage,
    },
  })
}

export async function findById(packageId: string) {
  return prisma.package.findUnique({
    where: { id: packageId },
  })
}

export async function findByQuizmaster(quizmasterId: string) {
  return prisma.package.findMany({
    where: {
      quizmasterId,
      // Exclude soft-deleted packages if we add a deletedAt field
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function update(packageId: string, packageData: DraftPackage) {
  // Verify package is still in draft status
  const existing = await prisma.package.findUnique({
    where: { id: packageId },
  })

  if (!existing) {
    throw new Error('Package not found')
  }

  if (existing.status === 'published') {
    throw new Error('Cannot edit published package')
  }

  return prisma.package.update({
    where: { id: packageId },
    data: {
      name: packageData.name,
      data: packageData,
    },
  })
}

export async function publish(packageId: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { versions: true },
  })

  if (!pkg) {
    throw new Error('Package not found')
  }

  const nextVersionNumber = (pkg.versions?.length ?? 0) + 1
  const packageData = pkg.data as DraftPackage

  // Create package version snapshot
  await prisma.packageVersion.create({
    data: {
      packageId,
      versionNumber: nextVersionNumber,
      snapshot: packageData, // This would be the FrozenPackage in real implementation
      publishedAt: new Date(),
    },
  })

  // Mark package as published
  return prisma.package.update({
    where: { id: packageId },
    data: { status: 'published' },
  })
}

export async function deletePackage(packageId: string) {
  // For now, hard delete. Could implement soft delete with deletedAt field.
  return prisma.package.delete({
    where: { id: packageId },
  })
}
