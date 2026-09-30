/**
 * projectStatus.js
 *
 * The project-level status pill, so Home and My Projects can never disagree.
 *
 * Every answer is something Yourkly actually knows: unsaved edits are drafts
 * sitting on this computer, and the review states come from stored update
 * records. "Up to date" means nothing is outstanding in Yourkly — not a claim
 * about anything it hasn't seen.
 */
export function projectStatus(updates = [], drafts = {}) {
  if (Object.keys(drafts).length > 0) {
    return { label: 'Changes not saved', tone: 'changes-unsaved' }
  }
  if (updates.some(u => u.status === 'changes_detected' || u.status === 'waiting_for_review')) {
    return { label: 'Needs review', tone: 'needs-review' }
  }
  if (updates.some(u => u.status === 'ready_to_save')) {
    return { label: 'Changes not saved', tone: 'changes-unsaved' }
  }
  return { label: 'Up to date', tone: 'up-to-date' }
}
