/**
 * Pure domain logic for Host management.
 * All functions are immutable and side-effect free.
 */

export interface Host {
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

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Append a note to the host's audit trail (append-only)
 */
export function updateHostNote(host: Host, note: string): Host {
  const timestamp = new Date().toISOString()
  const newNote = `[${timestamp}] ${note}`
  const updatedNotes = host.notes ? `${host.notes}\n${newNote}` : newNote
  return {
    ...host,
    notes: updatedNotes,
  }
}

/**
 * Add or update contact information
 */
export function addHostContactInfo(
  host: Host,
  phone?: string,
  address?: string,
  notes?: string
): Host {
  return {
    ...host,
    contactInfo: {
      ...(phone && { phone }),
      ...(address && { address }),
      ...(notes && { notes }),
    },
  }
}

/**
 * Disable a host (prevent from starting games)
 */
export function disableHost(host: Host, reason?: string): Host {
  const updated = {
    ...host,
    status: 'disabled' as const,
    disabledAt: new Date(),
  }
  if (reason) {
    return updateHostNote(updated, `Disabled: ${reason}`)
  }
  return updated
}

/**
 * Re-enable a previously disabled host
 */
export function enableHost(host: Host): Host {
  return {
    ...host,
    status: 'active' as const,
    enabledAt: new Date(),
    disabledAt: null,
  }
}

/**
 * Soft delete a host (preserve data, mark as removed)
 */
export function softDeleteHost(host: Host): Host {
  return {
    ...host,
    status: 'soft_removed' as const,
    deletedAt: new Date(),
  }
}

/**
 * Restore a soft-deleted host
 */
export function restoreHost(host: Host): Host {
  return {
    ...host,
    status: 'active' as const,
    deletedAt: null,
  }
}

/**
 * Get all active hosts for a specific quizmaster
 */
export function getActiveHostsForQuizmaster(hosts: Host[], quizmasterId: string): Host[] {
  return hosts.filter((h) => h.quizmasterId === quizmasterId && h.status === 'active')
}

/**
 * Validate that a host can be removed (no in-progress games)
 */
export function validateHostRemoval(
  host: Host,
  gameState: { games?: Array<{ hostId: string; status: string }> }
): ValidationResult {
  const inProgressGames = (gameState.games || []).filter(
    (g) => g.hostId === host.id && g.status === 'active'
  )

  if (inProgressGames.length > 0) {
    return {
      valid: false,
      error: `Cannot remove host with ${inProgressGames.length} in-progress game(s)`,
    }
  }

  return { valid: true }
}
