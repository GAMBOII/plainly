/**
 * projectMemory.js
 *
 * Pure client-side memory layer using localStorage.
 * Stores per-project context (last file open, last save, last AI handoff, etc.)
 * so the dashboard can show "continue where you left off."
 *
 * Storage key: plainly_memory_${owner}_${repo}
 */

function key(owner, repo) {
  return `plainly_memory_${owner}_${repo}`
}

const DEFAULTS = {
  lastOpenedAt:      null,
  lastOpenedFile:    null,
  lastSaveLabel:     null,
  lastSaveAt:        null,
  lastAITool:        null,
  lastAIAt:          null,
  lastAIInstruction: null,
  openTaskId:        null,
  // Stores the HEAD commit SHA last seen by Yourkly.
  // Used for return-detection: compare against current HEAD after an AI handoff.
  lastSeenCommitSha: null,
  // Every Save Point Yourkly itself created. This is how the return screen can
  // tell "the AI saved this" from "I saved this" without guessing.
  yourklySavedShas: [],
}

/**
 * Returns the stored memory object for a project, or sensible defaults.
 * @param {string} owner
 * @param {string} repo
 * @returns {object}
 */
export function getMemory(owner, repo) {
  try {
    const raw = localStorage.getItem(key(owner, repo))
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * Merges a patch into the stored memory object.
 * @param {string} owner
 * @param {string} repo
 * @param {object} patch
 */
export function setMemory(owner, repo, patch) {
  try {
    const current = getMemory(owner, repo)
    const updated = { ...current, ...patch }
    localStorage.setItem(key(owner, repo), JSON.stringify(updated))
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

/**
 * Records that a file was opened.
 * @param {string} owner
 * @param {string} repo
 * @param {string} fileName
 */
export function recordFileOpen(owner, repo, fileName) {
  setMemory(owner, repo, {
    lastOpenedFile: fileName,
    lastOpenedAt: new Date().toISOString(),
  })
}

/**
 * Records that a save point was created.
 * @param {string} owner
 * @param {string} repo
 * @param {string} label
 * @param {string} [sha]  the commit Yourkly just created, when GitHub returns one
 */
export function recordSave(owner, repo, label, sha) {
  const prev = getMemory(owner, repo)
  const shas = Array.isArray(prev.yourklySavedShas) ? prev.yourklySavedShas : []
  setMemory(owner, repo, {
    lastSaveLabel: label,
    lastSaveAt: new Date().toISOString(),
    lastSeenCommitSha: sha || prev.lastSeenCommitSha,
    // keep the last 50 — enough to answer "did we make this one?"
    yourklySavedShas: sha ? [sha, ...shas.filter(s => s !== sha)].slice(0, 50) : shas,
  })
}

/**
 * Records an AI handoff (which tool the user opened, and with what instruction).
 * @param {string} owner
 * @param {string} repo
 * @param {string} toolId  — 'chatgpt' | 'claude' | 'gemini' | 'bob' | 'generic'
 * @param {string} instruction
 */
export function recordAIHandoff(owner, repo, toolId, instruction) {
  setMemory(owner, repo, {
    lastAITool: toolId,
    lastAIAt: new Date().toISOString(),
    lastAIInstruction: instruction || null,
  })
}
