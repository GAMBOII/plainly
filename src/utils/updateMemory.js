/**
 * updateMemory.js
 *
 * Client-side update store using localStorage.
 * An "update" is one thing the user wants to change, tracked from intention
 * through AI handoff, return detection, review, and save.
 *
 * Replaces taskMemory.js. A one-time migration runs on first read to convert
 * any existing plainly_tasks_* entries to the new shape.
 *
 * Storage key: plainly_updates_${owner}_${repo}
 * Legacy key:  plainly_tasks_${owner}_${repo}  (read-once, then migrated)
 */

// ── Status lifecycle ─────────────────────────────────────────────────────────

export const STATUSES = [
  'planned',
  'ready_for_ai',
  'sent_to_ai',
  'changes_detected',
  'waiting_for_review',
  'ready_to_save',
  'saved',
]

// Off-path statuses (not in the main lifecycle progression)
export const STATUSES_OFF_PATH = ['needs_correction', 'paused']

export const STATUS_LABEL = {
  planned:            'Planned',
  ready_for_ai:       'Ready for AI',
  sent_to_ai:         'Sent to AI',
  changes_detected:   'Changes detected',
  waiting_for_review: 'Waiting for review',
  ready_to_save:      'Ready to save',
  saved:              'Saved',
  needs_correction:   'Needs correction',
  paused:             'Paused',
}

// ── Storage helpers ──────────────────────────────────────────────────────────

function newKey(owner, repo) {
  return `plainly_updates_${owner}_${repo}`
}

function legacyKey(owner, repo) {
  return `plainly_tasks_${owner}_${repo}`
}

export function generateId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// ── Migration ────────────────────────────────────────────────────────────────

/**
 * Maps old task status strings to the new lifecycle values.
 */
function migrateStatus(old) {
  if (!old) return 'planned'
  if (old === 'open' || old === 'in-progress') return 'planned'
  if (old === 'review') return 'waiting_for_review'
  if (old === 'done') return 'saved'
  return 'planned'
}

/**
 * Reads legacy plainly_tasks_* key, converts records to the new shape,
 * writes them to the new key, and removes the old key.
 * Safe to call multiple times — no-ops if old key doesn't exist.
 */
function migrateIfNeeded(owner, repo) {
  try {
    const legacyRaw = localStorage.getItem(legacyKey(owner, repo))
    if (!legacyRaw) return
    // If new key already exists, don't overwrite — migration already ran
    if (localStorage.getItem(newKey(owner, repo))) {
      localStorage.removeItem(legacyKey(owner, repo))
      return
    }
    const oldItems = JSON.parse(legacyRaw)
    if (!Array.isArray(oldItems)) {
      localStorage.removeItem(legacyKey(owner, repo))
      return
    }
    const now = new Date().toISOString()
    const migrated = oldItems.map(t => ({
      id:              t.id || generateId(),
      repoKey:         `${owner}/${repo}`,
      title:           t.title || 'Untitled update',
      goal:            t.goal || null,
      status:          migrateStatus(t.status),
      ai:              t.lastAITool || null,
      files:           [],
      lastActivityAt:  t.updatedAt || t.createdAt || now,
      savePoint:       null,
      handoff: {
        sentAt:           null,
        tool:             t.lastAITool || null,
        includedContext:  [],
        commitShaAtSend:  null,
      },
      story: [
        { what: 'Migrated from earlier Yourkly version', at: now },
      ],
      createdAt:  t.createdAt || now,
      updatedAt:  t.updatedAt || now,
      notes:      t.notes || null,
    }))
    localStorage.setItem(newKey(owner, repo), JSON.stringify(migrated))
    localStorage.removeItem(legacyKey(owner, repo))
  } catch {
    // silently ignore migration errors
  }
}

// ── Core CRUD ────────────────────────────────────────────────────────────────

function saveUpdates(owner, repo, updates) {
  try {
    localStorage.setItem(newKey(owner, repo), JSON.stringify(updates))
  } catch {
    // localStorage unavailable or full
  }
}

/**
 * Returns all updates for a repo, newest first.
 */
export function getUpdates(owner, repo) {
  migrateIfNeeded(owner, repo)
  try {
    const raw = localStorage.getItem(newKey(owner, repo))
    if (!raw) return []
    const updates = JSON.parse(raw)
    return Array.isArray(updates)
      ? [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : []
  } catch {
    return []
  }
}

/**
 * Creates and persists a new update in 'planned' state.
 */
export function createUpdate(owner, repo, title, goal = null) {
  const now = new Date().toISOString()
  const update = {
    id:             generateId(),
    repoKey:        `${owner}/${repo}`,
    title:          title.trim(),
    goal:           goal ? goal.trim() : null,
    status:         'planned',
    ai:             null,
    files:          [],
    lastActivityAt: now,
    savePoint:      null,
    handoff: {
      sentAt:          null,
      tool:            null,
      includedContext: [],
      commitShaAtSend: null,
    },
    story: [
      { what: 'You described this update', at: now },
    ],
    createdAt: now,
    updatedAt: now,
    notes:     null,
  }
  const current = getUpdates(owner, repo)
  saveUpdates(owner, repo, [update, ...current])
  return update
}

/**
 * Merges a patch into an update by id.
 * Automatically appends a story entry if patch.storyEntry is provided.
 * Automatically sets updatedAt and lastActivityAt.
 */
export function updateUpdate(owner, repo, id, patch) {
  try {
    const updates = getUpdates(owner, repo)
    const now = new Date().toISOString()
    const mapped = updates.map(u => {
      if (u.id !== id) return u
      const { storyEntry, ...rest } = patch
      const story = storyEntry
        ? [...(u.story || []), { what: storyEntry, at: now }]
        : (u.story || [])
      return {
        ...u,
        ...rest,
        story,
        updatedAt:      now,
        lastActivityAt: now,
      }
    })
    saveUpdates(owner, repo, mapped)
  } catch {
    // silently ignore
  }
}

/**
 * Records that the user marked an update as sent to an AI.
 * commitSha should be the current HEAD sha fetched before calling this.
 */
export function recordHandoffSent(owner, repo, id, toolLabel, commitSha) {
  const now = new Date().toISOString()
  updateUpdate(owner, repo, id, {
    status:      'sent_to_ai',
    ai:          toolLabel,
    storyEntry:  `Marked as sent to ${toolLabel}`,
    handoff: {
      sentAt:          now,
      tool:            toolLabel,
      includedContext: [],
      commitShaAtSend: commitSha || null,
    },
  })
}

/**
 * Removes an update by id.
 */
export function deleteUpdate(owner, repo, id) {
  try {
    const updates = getUpdates(owner, repo)
    saveUpdates(owner, repo, updates.filter(u => u.id !== id))
  } catch {
    // silently ignore
  }
}

/**
 * Returns the active update — first with status planned/ready_for_ai/sent_to_ai/
 * changes_detected/waiting_for_review/ready_to_save/needs_correction.
 * Returns null if all updates are saved or paused.
 */
export function getActiveUpdate(owner, repo) {
  const active = new Set([
    'planned', 'ready_for_ai', 'sent_to_ai',
    'changes_detected', 'waiting_for_review',
    'ready_to_save', 'needs_correction',
  ])
  const updates = getUpdates(owner, repo)
  return updates.find(u => active.has(u.status)) || null
}

/**
 * Returns a single update by id, or null.
 */
export function getUpdateById(owner, repo, id) {
  return getUpdates(owner, repo).find(u => u.id === id) || null
}
