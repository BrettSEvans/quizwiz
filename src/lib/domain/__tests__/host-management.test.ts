import { describe, it, expect } from 'vitest'
import {
  updateHostNote,
  addHostContactInfo,
  disableHost,
  enableHost,
  softDeleteHost,
  restoreHost,
  getActiveHostsForQuizmaster,
  validateHostRemoval,
} from '../host-management'

interface Host {
  id: string
  quizmasterId: string
  name: string
  status: 'active' | 'disabled' | 'soft_removed'
  notes: string
  contactInfo: { phone?: string; address?: string; notes?: string } | null
  lastGameDate: Date | null
  disabledAt: Date | null
  enabledAt: Date | null
  deletedAt: Date | null
  createdAt: Date
}

const mockHost = (): Host => ({
  id: 'host-123',
  quizmasterId: 'qm-456',
  name: 'John Doe',
  status: 'active',
  notes: '',
  contactInfo: null,
  lastGameDate: null,
  disabledAt: null,
  enabledAt: null,
  deletedAt: null,
  createdAt: new Date(),
})

describe('host-management', () => {
  describe('updateHostNote', () => {
    it('appends a note to the audit trail', () => {
      const host = mockHost()
      const updated = updateHostNote(host, 'Great attitude')
      expect(updated.notes).toContain('Great attitude')
    })

    it('preserves existing notes', () => {
      const host = mockHost()
      host.notes = 'Previous note'
      const updated = updateHostNote(host, 'New note')
      expect(updated.notes).toContain('Previous note')
      expect(updated.notes).toContain('New note')
    })

    it('does not modify original host', () => {
      const host = mockHost()
      updateHostNote(host, 'Test note')
      expect(host.notes).toBe('')
    })

    it('timestamp is included in note', () => {
      const host = mockHost()
      const before = new Date()
      const updated = updateHostNote(host, 'Timestamped note')
      const after = new Date()
      expect(updated.notes).toContain('Timestamped note')
      // Note should contain ISO date format
      expect(updated.notes).toMatch(/\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('addHostContactInfo', () => {
    it('adds contact information', () => {
      const host = mockHost()
      const updated = addHostContactInfo(host, '555-1234', '123 Main St', 'Prefers email')
      expect(updated.contactInfo).toEqual({
        phone: '555-1234',
        address: '123 Main St',
        notes: 'Prefers email',
      })
    })

    it('allows partial contact info', () => {
      const host = mockHost()
      const updated = addHostContactInfo(host, '555-1234', undefined, 'No address')
      expect(updated.contactInfo?.phone).toBe('555-1234')
      expect(updated.contactInfo?.address).toBeUndefined()
      expect(updated.contactInfo?.notes).toBe('No address')
    })

    it('overwrites existing contact info', () => {
      const host = mockHost()
      host.contactInfo = { phone: '555-9999', address: 'Old Address' }
      const updated = addHostContactInfo(host, '555-1234', '123 New St', undefined)
      expect(updated.contactInfo?.phone).toBe('555-1234')
      expect(updated.contactInfo?.address).toBe('123 New St')
    })

    it('does not modify original host', () => {
      const host = mockHost()
      addHostContactInfo(host, '555-1234')
      expect(host.contactInfo).toBeNull()
    })
  })

  describe('disableHost', () => {
    it('sets status to disabled', () => {
      const host = mockHost()
      const updated = disableHost(host, 'No-show policy violation')
      expect(updated.status).toBe('disabled')
    })

    it('sets disabledAt timestamp', () => {
      const host = mockHost()
      const before = new Date()
      const updated = disableHost(host)
      const after = new Date()
      expect(updated.disabledAt).not.toBeNull()
      expect(updated.disabledAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(updated.disabledAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('preserves other fields', () => {
      const host = mockHost()
      const updated = disableHost(host)
      expect(updated.id).toBe(host.id)
      expect(updated.name).toBe(host.name)
      expect(updated.quizmasterId).toBe(host.quizmasterId)
    })
  })

  describe('enableHost', () => {
    it('sets status to active', () => {
      const host = mockHost()
      host.status = 'disabled'
      const updated = enableHost(host)
      expect(updated.status).toBe('active')
    })

    it('sets enabledAt timestamp', () => {
      const host = mockHost()
      host.status = 'disabled'
      const before = new Date()
      const updated = enableHost(host)
      const after = new Date()
      expect(updated.enabledAt).not.toBeNull()
      expect(updated.enabledAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(updated.enabledAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('clears disabledAt when enabling', () => {
      const host = mockHost()
      host.status = 'disabled'
      host.disabledAt = new Date('2024-01-01')
      const updated = enableHost(host)
      expect(updated.disabledAt).toBeNull()
    })
  })

  describe('softDeleteHost', () => {
    it('sets status to soft_removed', () => {
      const host = mockHost()
      const updated = softDeleteHost(host)
      expect(updated.status).toBe('soft_removed')
    })

    it('sets deletedAt timestamp', () => {
      const host = mockHost()
      const before = new Date()
      const updated = softDeleteHost(host)
      const after = new Date()
      expect(updated.deletedAt).not.toBeNull()
      expect(updated.deletedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(updated.deletedAt!.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('restoreHost', () => {
    it('sets status back to active', () => {
      const host = mockHost()
      host.status = 'soft_removed'
      host.deletedAt = new Date()
      const updated = restoreHost(host)
      expect(updated.status).toBe('active')
    })

    it('clears deletedAt timestamp', () => {
      const host = mockHost()
      host.status = 'soft_removed'
      host.deletedAt = new Date()
      const updated = restoreHost(host)
      expect(updated.deletedAt).toBeNull()
    })

    it('preserves notes and contact info', () => {
      const host = mockHost()
      host.status = 'soft_removed'
      host.deletedAt = new Date()
      host.notes = 'Audit trail entry'
      host.contactInfo = { phone: '555-1234' }
      const updated = restoreHost(host)
      expect(updated.notes).toBe('Audit trail entry')
      expect(updated.contactInfo?.phone).toBe('555-1234')
    })
  })

  describe('getActiveHostsForQuizmaster', () => {
    it('returns only active hosts for a quizmaster', () => {
      const qmId = 'qm-123'
      const hosts: Host[] = [
        { ...mockHost(), quizmasterId: qmId, status: 'active', name: 'Host 1' },
        { ...mockHost(), quizmasterId: qmId, status: 'disabled', name: 'Host 2' },
        { ...mockHost(), quizmasterId: qmId, status: 'soft_removed', name: 'Host 3' },
        { ...mockHost(), quizmasterId: 'other-qm', status: 'active', name: 'Host 4' },
      ]
      const active = getActiveHostsForQuizmaster(hosts, qmId)
      expect(active).toHaveLength(1)
      expect(active[0].name).toBe('Host 1')
    })

    it('returns empty array if no active hosts', () => {
      const qmId = 'qm-123'
      const hosts: Host[] = [
        { ...mockHost(), quizmasterId: qmId, status: 'disabled' },
        { ...mockHost(), quizmasterId: qmId, status: 'soft_removed' },
      ]
      const active = getActiveHostsForQuizmaster(hosts, qmId)
      expect(active).toHaveLength(0)
    })

    it('returns empty array for unknown quizmaster', () => {
      const hosts: Host[] = [
        { ...mockHost(), quizmasterId: 'qm-123', status: 'active' },
      ]
      const active = getActiveHostsForQuizmaster(hosts, 'unknown-qm')
      expect(active).toHaveLength(0)
    })
  })

  describe('validateHostRemoval', () => {
    it('allows removal if no in-progress games', () => {
      const host = mockHost()
      const gameState = { games: [] } as any
      const result = validateHostRemoval(host, gameState)
      expect(result.valid).toBe(true)
    })

    it('rejects removal if host has in-progress games', () => {
      const host = mockHost()
      const gameState = {
        games: [
          { hostId: 'host-123', status: 'active' },
        ],
      } as any
      const result = validateHostRemoval(host, gameState)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('in-progress')
    })

    it('allows removal if host has completed games', () => {
      const host = mockHost()
      const gameState = {
        games: [
          { hostId: 'host-123', status: 'completed' },
        ],
      } as any
      const result = validateHostRemoval(host, gameState)
      expect(result.valid).toBe(true)
    })

    it('ignores other hosts in-progress games', () => {
      const host = mockHost()
      const gameState = {
        games: [
          { hostId: 'other-host', status: 'active' },
        ],
      } as any
      const result = validateHostRemoval(host, gameState)
      expect(result.valid).toBe(true)
    })
  })
})
